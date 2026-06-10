import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json([]);

    const sponsors = await prisma.sponsor.findMany({
      where: { eventId: event.id },
      orderBy: [{ tier: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(sponsors);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sponsor = await prisma.sponsor.create({
      data: {
        eventId: event.id,
        name: body.name,
        logoUrl: body.logoUrl,
        websiteUrl: body.websiteUrl,
        tier: body.tier || "REGULAR",
        order: body.order || 0,
      },
    });

    return NextResponse.json(sponsor, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
