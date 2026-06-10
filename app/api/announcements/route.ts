import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const pinned = searchParams.get("pinned") === "true";
    const runningText = searchParams.get("runningText") === "true";

    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json([]);

    const announcements = await prisma.announcement.findMany({
      where: {
        eventId: event.id,
        isPublished: true,
        ...(pinned ? { isPinned: true } : {}),
        ...(runningText ? { isRunningText: true } : {}),
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [
        { isPinned: "desc" },
        { priority: "desc" },
        { publishedAt: "desc" },
      ],
      take: limit,
      include: { competition: { select: { name: true, slug: true } } },
    });

    return NextResponse.json(announcements);
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

    const announcement = await prisma.announcement.create({
      data: {
        eventId: event.id,
        competitionId: body.competitionId || null,
        title: body.title,
        content: body.content,
        type: body.type || "INFO",
        priority: body.priority || "NORMAL",
        isPinned: body.isPinned || false,
        isRunningText: body.isRunningText || false,
        isPublished: body.isPublished !== false,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
