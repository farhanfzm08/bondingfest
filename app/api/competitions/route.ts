import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");

    const event = eventId
      ? await prisma.event.findUnique({ where: { id: eventId } })
      : await prisma.event.findFirst();

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const competitions = await prisma.competition.findMany({
      where: {
        eventId: event.id,
        ...(status ? { status } : {}),
      },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            teams: true,
            compParticipants: true,
            matches: true,
            champions: true,
          },
        },
        champions: {
          orderBy: { position: "asc" },
          take: 3,
          include: {
            team: true,
            participant: true,
          },
        },
      },
    });

    return NextResponse.json(competitions);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const slug = slugify(body.name);
    const competition = await prisma.competition.create({
      data: {
        eventId: event.id,
        name: body.name,
        slug,
        description: body.description,
        status: body.status || "UPCOMING",
        type: body.type || "INDIVIDUAL",
        format: body.format || "BRACKET",
        category: body.category,
        venue: body.venue,
        maxParticipants: body.maxParticipants ? parseInt(body.maxParticipants) : null,
        rules: body.rules,
        order: body.order || 0,
      },
    });

    return NextResponse.json(competition, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
