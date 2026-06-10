import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/competitions/[id]/champions
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const champions = await prisma.champion.findMany({
      where: { competitionId: id },
      orderBy: { position: "asc" },
      include: { team: true, participant: true },
    });
    return NextResponse.json(champions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/competitions/[id]/champions — set/replace champions and update standings
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: competitionId } = await params;
    const body = await req.json();
    // body.champions: Array<{ position: 1|2|3, teamId?, participantId?, section? }>

    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const event = await prisma.event.findUnique({ where: { id: competition.eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const ptSystem = JSON.parse(event.pointSystem);
    const pointsMap: Record<number, number> = {
      1: ptSystem.first || 100,
      2: ptSystem.second || 70,
      3: ptSystem.third || 40,
    };

    // Clear existing champions for this competition
    await prisma.champion.deleteMany({ where: { competitionId } });

    const created = [];
    for (const ch of body.champions) {
      const awardPoints = pointsMap[ch.position] || 0;

      // Get section info (for collaboration teams)
      let section = ch.section;
      let teamData = null;

      if (ch.teamId) {
        teamData = await prisma.team.findUnique({ where: { id: ch.teamId } });
        if (!section && teamData) section = teamData.section || undefined;
      }

      const champion = await prisma.champion.create({
        data: {
          competitionId,
          teamId: ch.teamId || null,
          participantId: ch.participantId || null,
          position: ch.position,
          awardPoints,
          section: section || null,
        },
        include: { team: true, participant: true },
      });
      created.push(champion);
    }

    // Update competition status to COMPLETED
    await prisma.competition.update({ where: { id: competitionId }, data: { status: "COMPLETED" } });

    // Recalculate overall standings
    await recalculateOverallStandings(competition.eventId, ptSystem);

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function recalculateOverallStandings(eventId: string, ptSystem: { first: number; second: number; third: number }) {
  const allChampions = await prisma.champion.findMany({
    where: { competition: { eventId } },
    include: { team: true },
  });

  const standMap = new Map<string, number>();
  const medalMap = new Map<string, { gold: number; silver: number; bronze: number }>();

  for (const ch of allChampions) {
    let sectionsToAward: Array<{ sec: string; pts: number }> = [];

    if (ch.team?.isCollaboration && ch.team.sections) {
      const secs: string[] = JSON.parse(ch.team.sections);
      const weights: Record<string, number> = ch.team.sectionWeights
        ? JSON.parse(ch.team.sectionWeights)
        : Object.fromEntries(secs.map(s => [s, 100 / secs.length]));

      for (const s of secs) {
        const w = weights[s] ?? (100 / secs.length);
        sectionsToAward.push({ sec: s, pts: ch.awardPoints * w / 100 });
      }
    } else {
      const sec = ch.section || ch.team?.section || "Lainnya";
      sectionsToAward.push({ sec, pts: ch.awardPoints });
    }

    for (const { sec, pts } of sectionsToAward) {
      standMap.set(sec, (standMap.get(sec) || 0) + pts);
      if (!medalMap.has(sec)) medalMap.set(sec, { gold: 0, silver: 0, bronze: 0 });
      const med = medalMap.get(sec)!;
      if (ch.position === 1) med.gold++;
      else if (ch.position === 2) med.silver++;
      else if (ch.position === 3) med.bronze++;
    }
  }

  // Get all sections from event to include zeroes
  const allSections = await prisma.section.findMany({ where: { eventId } });
  for (const s of allSections) {
    if (!standMap.has(s.name)) {
      standMap.set(s.name, 0);
      medalMap.set(s.name, { gold: 0, silver: 0, bronze: 0 });
    }
  }

  const sorted = Array.from(standMap.entries()).sort(([, a], [, b]) => b - a);

  // Upsert standings
  for (let r = 0; r < sorted.length; r++) {
    const [sec, pts] = sorted[r];
    const med = medalMap.get(sec) || { gold: 0, silver: 0, bronze: 0 };
    await prisma.overallStanding.upsert({
      where: { eventId_section: { eventId, section: sec } },
      create: { eventId, section: sec, totalPoints: Math.round(pts * 10) / 10, goldCount: med.gold, silverCount: med.silver, bronzeCount: med.bronze, rank: r + 1 },
      update: { totalPoints: Math.round(pts * 10) / 10, goldCount: med.gold, silverCount: med.silver, bronzeCount: med.bronze, rank: r + 1 },
    });
  }
}
