import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json([]);

    const participants = await prisma.participant.findMany({
      where: {
        eventId: event.id,
        ...(section ? { section } : {}),
      },
      orderBy: [{ section: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(participants);
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

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    }

    const participant = await prisma.participant.create({
      data: {
        eventId: event.id,
        name: body.name.trim(),
        npk: body.npk?.trim() || null,
        section: body.section?.trim() || null,
      },
    });
    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
