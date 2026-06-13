import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/competitions/[id]/advance-to-bracket
// Calculates group standings, picks top N from each group, seeds them into existing bracket slots
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: competitionId } = await params;
    const body = await req.json().catch(() => ({}));

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const cfg = competition.config ? JSON.parse(competition.config) : {};
    const numGroups: number = cfg.numGroups || 2;
    const advanceCount: number = cfg.advanceCount || 2;  // top N per group
    const bracketSize: number = cfg.bracketSize || 8;
    const isTeam = competition.type === "TEAM" || competition.type === "DUO";

    // 1. Fetch all group-stage matches with their participants
    const groupMatches = await prisma.match.findMany({
      where: { competitionId, stage: "REGULAR" },
      include: { participants: { include: { team: true, participant: true } } },
    });

    // 2. Get all teams/participants with their groupName
    type Entry = { id: string; name: string; groupName: string | null };
    let entries: Entry[] = [];
    if (isTeam) {
      const teams = await prisma.team.findMany({ where: { competitionId } });
      entries = teams.map(t => ({ id: t.id, name: t.name, groupName: t.groupName }));
    } else {
      const cps = await prisma.competitionParticipant.findMany({
        where: { competitionId },
        include: { participant: true },
      });
      entries = cps.map(cp => ({ id: cp.participantId, name: cp.participant.name, groupName: (cp as any).groupName ?? null }));
    }

    // 3. Calculate standings per group
    const groups = Array.from({ length: numGroups }, (_, i) => `Grup ${String.fromCharCode(65 + i)}`);
    const stat: Record<string, { pts: number; gf: number; ga: number; wins: number; played: number; id: string; name: string; group: string }> = {};

    for (const e of entries) {
      if (!e.groupName) continue;
      stat[e.id] = { pts: 0, gf: 0, ga: 0, wins: 0, played: 0, id: e.id, name: e.name, group: e.groupName };
    }

    const ptsWin = cfg.pointsWin ?? 3;
    const ptsDraw = cfg.pointsDraw ?? 1;
    const ptsLoss = cfg.pointsLoss ?? 0;

    for (const m of groupMatches) {
      if (m.status !== "COMPLETED" || m.participants.length < 2) continue;
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

    // 4. Sort each group and pick top N
    const advancingIds: string[] = [];
    const advancingOrder: Array<{ id: string; name: string; group: string; rank: number }> = [];

    for (const group of groups) {
      const groupEntries = Object.values(stat)
        .filter(s => s.group === group)
        .sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          return (b.gf - b.ga) - (a.gf - a.ga); // goal diff
        });

      groupEntries.slice(0, advanceCount).forEach((e, rank) => {
        advancingIds.push(e.id);
        advancingOrder.push({ id: e.id, name: e.name, group, rank: rank + 1 });
      });
    }

    // 5. Find existing bracket KNOCKOUT matches sorted by bracketSlot
    let bracketMatches = await prisma.match.findMany({
      where: { competitionId, stage: "KNOCKOUT" },
      include: { participants: true },
      orderBy: { bracketSlot: "asc" },
    });

    // If no bracket matches exist, create them first
    if (bracketMatches.length === 0) {
      const ROUND_NAMES: Record<number, string> = { 2: "Final", 4: "Semifinal", 8: "Perempat Final", 16: "16 Besar", 32: "32 Besar", 64: "64 Besar" };
      const rounds: number[] = [];
      let r = bracketSize;
      while (r >= 2) { rounds.push(r); r = Math.floor(r / 2); }

      let slot = 1;
      for (const rSize of rounds) {
        const matchCount = Math.floor(rSize / 2);
        const roundName = ROUND_NAMES[rSize] || `${rSize} Besar`;
        for (let i = 0; i < matchCount; i++) {
          await prisma.match.create({
            data: {
              competitionId,
              name: `${roundName} - Match ${i + 1}`,
              round: roundName,
              stage: "KNOCKOUT",
              bracketSlot: slot++,
              status: "SCHEDULED",
            },
          });
          // Create 2 empty participant slots
          const created = await prisma.match.findFirst({ where: { competitionId, bracketSlot: slot - 1 } });
          if (created) {
            await prisma.matchParticipant.createMany({
              data: [
                { matchId: created.id, score: 0 },
                { matchId: created.id, score: 0 },
              ],
            });
          }
        }
      }

      bracketMatches = await prisma.match.findMany({
        where: { competitionId, stage: "KNOCKOUT" },
        include: { participants: true },
        orderBy: { bracketSlot: "asc" },
      });
    }

    // 6. First-round matches = matches with lowest bracketSlot numbers
    // In a bracketSize=8 tree: slots 1-4 are first round (Perempat Final)
    // Seeding: Group A 1st vs Group B 2nd, Group B 1st vs Group A 2nd (cross-seeding)
    const firstRoundCount = Math.floor(bracketSize / 2);
    const firstRoundMatches = bracketMatches
      .filter(m => m.bracketSlot !== null && m.bracketSlot <= firstRoundCount)
      .sort((a, b) => (a.bracketSlot || 0) - (b.bracketSlot || 0));

    // Build seeded matchups: interleave groups (A1 vs B2, B1 vs A2, A2nd vs B2nd, ...)
    // Simple strategy: pair first-place finishers from each group against second-place from opposite group
    const seededPairs: Array<[string, string]> = [];
    for (let i = 0; i < numGroups; i++) {
      for (let j = 0; j < advanceCount; j++) {
        const oppositeGroup = (i + 1) % numGroups;
        const opponent = advancingOrder.find(e => e.group === groups[oppositeGroup] && e.rank === (j + 1));
        const me = advancingOrder.find(e => e.group === groups[i] && e.rank === (j + 1));
        if (me && opponent && !seededPairs.some(p => p.includes(me.id) || p.includes(opponent.id))) {
          seededPairs.push([me.id, opponent.id]);
        }
      }
    }

    // Fallback: just pair all advancing teams in order
    const allAdvancing = advancingOrder.map(e => e.id);
    while (seededPairs.length < firstRoundCount && allAdvancing.length >= 2) {
      const a = allAdvancing.shift()!;
      const b = allAdvancing.pop()!;
      if (!seededPairs.some(p => p.includes(a) || p.includes(b))) {
        seededPairs.push([a, b]);
      }
    }

    // 7. Assign advancing teams to first-round bracket participant slots
    let updated = 0;
    for (let i = 0; i < Math.min(seededPairs.length, firstRoundMatches.length); i++) {
      const m = firstRoundMatches[i];
      const [idA, idB] = seededPairs[i] || [];
      if (!idA || !idB) continue;

      const pSlots = m.participants.sort((a, b) => a.id.localeCompare(b.id));

      if (pSlots[0]) {
        await prisma.matchParticipant.update({
          where: { id: pSlots[0].id },
          data: isTeam ? { teamId: idA, participantId: null } : { participantId: idA, teamId: null },
        });
      }
      if (pSlots[1]) {
        await prisma.matchParticipant.update({
          where: { id: pSlots[1].id },
          data: isTeam ? { teamId: idB, participantId: null } : { participantId: idB, teamId: null },
        });
      }
      updated++;
    }

    return NextResponse.json({
      success: true,
      advancing: advancingOrder,
      bracketMatchesUpdated: updated,
      message: `${advancingOrder.length} peserta/tim berhasil dimajukan ke bracket. ${updated} pertandingan bracket diperbarui.`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
