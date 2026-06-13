import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ROUND_NAMES: Record<number, string> = {
  2: "Final", 4: "Semifinal", 8: "Perempat Final",
  16: "16 Besar", 32: "32 Besar", 64: "64 Besar",
};

// POST /api/competitions/[id]/advance-to-bracket
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: competitionId } = await params;

    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const cfg = competition.config ? JSON.parse(competition.config) : {};
    const numGroups: number = cfg.numGroups || 2;
    const advanceCount: number = cfg.advanceCount || 2;
    const bracketSize: number = cfg.bracketSize || (numGroups * advanceCount);
    const isTeam = competition.type === "TEAM" || competition.type === "DUO";

    const ptsWin = cfg.pointsWin ?? 3;
    const ptsDraw = cfg.pointsDraw ?? 1;
    const ptsLoss = cfg.pointsLoss ?? 0;

    // 1. Build group entries list
    const groups = Array.from({ length: numGroups }, (_, i) => `Grup ${String.fromCharCode(65 + i)}`);
    type Entry = { id: string; name: string; groupName: string };
    let allEntries: Entry[] = [];

    if (isTeam) {
      const teams = await prisma.team.findMany({ where: { competitionId } });
      allEntries = teams
        .filter(t => t.groupName)
        .map(t => ({ id: t.id, name: t.name, groupName: t.groupName! }));
    } else {
      const cps = await prisma.competitionParticipant.findMany({
        where: { competitionId },
        include: { participant: true },
      });
      allEntries = (cps as any[])
        .filter(cp => cp.groupName)
        .map(cp => ({ id: cp.participantId, name: cp.participant.name, groupName: cp.groupName }));
    }

    // 2. Compute standings per group from completed REGULAR matches
    const groupMatches = await prisma.match.findMany({
      where: { competitionId, stage: "REGULAR", status: "COMPLETED" },
      include: { participants: true },
    });

    const stat: Record<string, { pts: number; gf: number; ga: number; wins: number; played: number }> = {};
    for (const e of allEntries) stat[e.id] = { pts: 0, gf: 0, ga: 0, wins: 0, played: 0 };

    for (const m of groupMatches) {
      if (m.participants.length < 2) continue;
      const [pA, pB] = m.participants;
      const idA = pA.teamId || pA.participantId || "";
      const idB = pB.teamId || pB.participantId || "";
      if (!stat[idA] || !stat[idB]) continue;

      stat[idA].gf += pA.score; stat[idA].ga += pB.score; stat[idA].played++;
      stat[idB].gf += pB.score; stat[idB].ga += pA.score; stat[idB].played++;

      if (pA.score > pB.score) { stat[idA].pts += ptsWin; stat[idA].wins++; stat[idB].pts += ptsLoss; }
      else if (pB.score > pA.score) { stat[idB].pts += ptsWin; stat[idB].wins++; stat[idA].pts += ptsLoss; }
      else { stat[idA].pts += ptsDraw; stat[idB].pts += ptsDraw; }
    }

    // 3. Pick top N per group, sorted by pts desc then goal diff
    type AdvEntry = Entry & { rank: number; pts: number };
    const advancing: AdvEntry[] = [];

    for (const group of groups) {
      const inGroup = allEntries
        .filter(e => e.groupName === group)
        .sort((a, b) => {
          const sa = stat[a.id] || { pts: 0, gf: 0, ga: 0 };
          const sb = stat[b.id] || { pts: 0, gf: 0, ga: 0 };
          if (sb.pts !== sa.pts) return sb.pts - sa.pts;
          return (sb.gf - sb.ga) - (sa.gf - sa.ga);
        });

      inGroup.slice(0, advanceCount).forEach((e, i) => {
        advancing.push({ ...e, rank: i + 1, pts: stat[e.id]?.pts ?? 0 });
      });
    }

    if (advancing.length === 0) {
      return NextResponse.json({ error: "Tidak ada peserta yang ditempatkan ke grup" }, { status: 400 });
    }

    // 4. Ensure bracket matches exist — create if missing
    let bracketMatches = await prisma.match.findMany({
      where: { competitionId, stage: "KNOCKOUT" },
      include: { participants: { orderBy: { id: "asc" } } },
      orderBy: { bracketSlot: "asc" },
    });

    if (bracketMatches.length === 0) {
      const rounds: number[] = [];
      let r = bracketSize;
      while (r >= 2) { rounds.push(r); r = Math.floor(r / 2); }

      let slot = 1;
      for (const rSize of rounds) {
        const matchCount = Math.floor(rSize / 2);
        const roundName = ROUND_NAMES[rSize] || `${rSize} Besar`;
        for (let i = 0; i < matchCount; i++) {
          const created = await prisma.match.create({
            data: {
              competitionId,
              name: `${roundName} - Match ${i + 1}`,
              round: roundName,
              stage: "KNOCKOUT",
              bracketSlot: slot++,
              status: "SCHEDULED",
            },
          });
          // 2 empty participant slots
          await prisma.matchParticipant.createMany({
            data: [{ matchId: created.id, score: 0 }, { matchId: created.id, score: 0 }],
          });
        }
      }

      bracketMatches = await prisma.match.findMany({
        where: { competitionId, stage: "KNOCKOUT" },
        include: { participants: { orderBy: { id: "asc" } } },
        orderBy: { bracketSlot: "asc" },
      });
    }

    // 5. Seed advancing teams into FIRST ROUND bracket slots
    // First round = smallest bracketSlot numbers (floor(bracketSize/2) matches)
    const firstRoundCount = Math.floor(bracketSize / 2);
    const firstRoundMatches = bracketMatches
      .filter(m => m.bracketSlot !== null && m.bracketSlot! <= firstRoundCount)
      .sort((a, b) => (a.bracketSlot || 0) - (b.bracketSlot || 0));

    // Cross-seeding: A1 vs B2, B1 vs A2, A3 vs B4, ... (interleave groups)
    // Build seeded order: interleave by rank, then alternate groups
    const byRank: Array<AdvEntry[]> = [];
    for (let rank = 1; rank <= advanceCount; rank++) {
      byRank.push(advancing.filter(e => e.rank === rank));
    }

    const seededOrder: AdvEntry[] = [];
    for (let rank = 0; rank < advanceCount; rank++) {
      const group = byRank[rank] || [];
      // Alternate: odd rank → forward, even rank → reverse (for cross seeding)
      if (rank % 2 === 0) seededOrder.push(...group);
      else seededOrder.push(...[...group].reverse());
    }

    // Pair them up: [0 vs last], [1 vs last-1], ...
    const pairs: Array<[AdvEntry, AdvEntry]> = [];
    const pool = [...seededOrder];
    while (pool.length >= 2) {
      pairs.push([pool.shift()!, pool.pop()!]);
    }

    // 6. Write pairs into first-round bracket match participant slots
    let updated = 0;
    for (let i = 0; i < Math.min(pairs.length, firstRoundMatches.length); i++) {
      const match = firstRoundMatches[i];
      const [entA, entB] = pairs[i];
      if (!entA || !entB) continue;

      const slots = match.participants;
      if (slots.length < 2) continue;

      await Promise.all([
        prisma.matchParticipant.update({
          where: { id: slots[0].id },
          data: isTeam
            ? { teamId: entA.id, participantId: null }
            : { participantId: entA.id, teamId: null },
        }),
        prisma.matchParticipant.update({
          where: { id: slots[1].id },
          data: isTeam
            ? { teamId: entB.id, participantId: null }
            : { participantId: entB.id, teamId: null },
        }),
      ]);
      updated++;
    }

    return NextResponse.json({
      success: true,
      advancing: advancing.map(e => ({ name: e.name, group: e.groupName, rank: e.rank, pts: e.pts })),
      bracketMatchesUpdated: updated,
      message: `${advancing.length} peserta lolos ke bracket. ${updated} pertandingan bracket diperbarui.`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
