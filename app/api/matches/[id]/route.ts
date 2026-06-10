import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/matches/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: { participants: { include: { team: true, participant: true } } },
    });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    return NextResponse.json(match);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/matches/[id] — update match info and/or scores
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Update match metadata
    const match = await prisma.match.update({
      where: { id },
      data: {
        name: body.name,
        round: body.round,
        stage: body.stage,
        groupName: body.groupName,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        venue: body.venue,
        status: body.status,
        notes: body.notes,
        completedAt: body.status === "COMPLETED" ? new Date() : undefined,
      },
    });

    // Update scores if provided
    if (Array.isArray(body.scores) && body.scores.length > 0) {
      await Promise.all(
        body.scores.map((s: { id: string; score: number; result?: string; timeResult?: string }) =>
          prisma.matchParticipant.update({
            where: { id: s.id },
            data: {
              score: s.score !== undefined ? Number(s.score) : undefined,
              result: s.result || null,
              timeResult: s.timeResult || null,
            },
          })
        )
      );

      // If competition is GROUP_STAGE, update group standings after score input
      const competition = await prisma.competition.findUnique({ where: { id: match.competitionId } });
      if (competition?.format === "GROUP_STAGE" && body.status === "COMPLETED") {
        await recalculateGroupStandings(match.competitionId);
      }
    }

    const full = await prisma.match.findUnique({
      where: { id },
      include: { participants: { include: { team: true, participant: true } } },
    });
    return NextResponse.json(full);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/matches/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.match.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Match not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper: recalculate group stage standings for a competition
async function recalculateGroupStandings(competitionId: string) {
  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) return;

  const config = competition.config ? JSON.parse(competition.config) : {};
  const ptsWin = config.pointsWin ?? 3;
  const ptsDraw = config.pointsDraw ?? 1;
  const ptsLoss = config.pointsLoss ?? 0;

  const completedMatches = await prisma.match.findMany({
    where: { competitionId, status: "COMPLETED", stage: "REGULAR" },
    include: { participants: { include: { team: true } } },
  });

  const teamStats = new Map<string, {
    teamId: string; groupName: string;
    wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number; points: number;
  }>();

  for (const match of completedMatches) {
    if (match.participants.length !== 2) continue;
    const [pA, pB] = match.participants;
    if (!pA?.teamId || !pB?.teamId) continue;

    const sA = pA.score ?? 0;
    const sB = pB.score ?? 0;

    const initTeam = (p: typeof pA) => ({
      teamId: p.teamId!, groupName: match.groupName || "",
      wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
    });

    if (!teamStats.has(pA.teamId)) teamStats.set(pA.teamId, initTeam(pA));
    if (!teamStats.has(pB.teamId)) teamStats.set(pB.teamId, initTeam(pB));

    const stA = teamStats.get(pA.teamId)!;
    const stB = teamStats.get(pB.teamId)!;

    stA.goalsFor += sA; stA.goalsAgainst += sB;
    stB.goalsFor += sB; stB.goalsAgainst += sA;

    if (sA > sB) { stA.wins++; stA.points += ptsWin; stB.losses++; stB.points += ptsLoss; }
    else if (sA < sB) { stB.wins++; stB.points += ptsWin; stA.losses++; stA.points += ptsLoss; }
    else { stA.draws++; stA.points += ptsDraw; stB.draws++; stB.points += ptsDraw; }
  }

  // Delete existing rankings for this competition (group stage only)
  await prisma.ranking.deleteMany({ where: { competitionId } });

  // Sort by group, then points, then goal difference
  const sorted = Array.from(teamStats.values()).sort((a, b) => {
    if (a.groupName !== b.groupName) return a.groupName.localeCompare(b.groupName);
    if (b.points !== a.points) return b.points - a.points;
    return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
  });

  // Assign positions within each group
  const groupPos = new Map<string, number>();
  for (const st of sorted) {
    const pos = (groupPos.get(st.groupName) || 0) + 1;
    groupPos.set(st.groupName, pos);
    await prisma.ranking.create({
      data: {
        competitionId,
        teamId: st.teamId,
        position: pos,
        points: st.points,
        wins: st.wins,
        losses: st.losses,
        draws: st.draws,
        goalsFor: st.goalsFor,
        goalsAgainst: st.goalsAgainst,
      },
    });
  }
}
