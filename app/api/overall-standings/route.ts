import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json([]);

    const standings = await prisma.overallStanding.findMany({
      where: { eventId: event.id },
      orderBy: { rank: "asc" },
    });
    return NextResponse.json(standings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — recalculate from all champions
export async function POST() {
  try {
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const ptSystem = JSON.parse(event.pointSystem);

    const allChampions = await prisma.champion.findMany({
      where: { competition: { eventId: event.id } },
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

    // Ensure all sections are included
    const allSections = await prisma.section.findMany({ where: { eventId: event.id } });
    for (const s of allSections) {
      if (!standMap.has(s.name)) {
        standMap.set(s.name, 0);
        medalMap.set(s.name, { gold: 0, silver: 0, bronze: 0 });
      }
    }

    const sorted = Array.from(standMap.entries()).sort(([, a], [, b]) => b - a);

    // Delete and recreate standings
    await prisma.overallStanding.deleteMany({ where: { eventId: event.id } });
    const created = await Promise.all(
      sorted.map(([sec, pts], r) => {
        const med = medalMap.get(sec) || { gold: 0, silver: 0, bronze: 0 };
        return prisma.overallStanding.create({
          data: {
            eventId: event.id,
            section: sec,
            totalPoints: Math.round(pts * 10) / 10,
            goldCount: med.gold,
            silverCount: med.silver,
            bronzeCount: med.bronze,
            rank: r + 1,
          },
        });
      })
    );

    return NextResponse.json(created);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
