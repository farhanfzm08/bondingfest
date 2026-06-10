import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json([]);
    const sections = await prisma.section.findMany({
      where: { eventId: event.id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(sections);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Nama seksi wajib diisi" }, { status: 400 });

    // Get max order
    const maxSection = await prisma.section.findFirst({ where: { eventId: event.id }, orderBy: { order: "desc" } });
    const section = await prisma.section.create({
      data: {
        eventId: event.id,
        name: body.name.trim(),
        color: body.color || "#0891B2",
        order: (maxSection?.order ?? 0) + 1,
      },
    });
    return NextResponse.json(section, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Nama seksi sudah ada" }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
