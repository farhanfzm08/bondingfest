import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const event = await prisma.event.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get stats
    const [competitionsCount, participantsCount, matchesCount] = await Promise.all([
      prisma.competition.count({ where: { eventId: event.id } }),
      prisma.participant.count({ where: { eventId: event.id } }),
      prisma.match.count({ where: { competition: { eventId: event.id } } }),
    ]);

    return NextResponse.json({
      ...event,
      pointSystem: JSON.parse(event.pointSystem),
      stats: {
        competitions: competitionsCount,
        participants: participantsCount,
        matches: matchesCount,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        name: body.name,
        description: body.description,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        location: body.location,
        status: body.status,
        themeColor: body.themeColor,
        pointSystem: body.pointSystem ? JSON.stringify(body.pointSystem) : undefined,
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
      },
    });

    return NextResponse.json({ ...updated, pointSystem: JSON.parse(updated.pointSystem) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
