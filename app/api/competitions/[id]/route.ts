import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const competition = await prisma.competition.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        event: true,
        teams: {
          include: {
            members: { include: { participant: true } },
            rankings: true,
            champions: true,
          },
        },
        compParticipants: {
          include: { participant: true, },
        },
        matches: {
          orderBy: { scheduledAt: "asc" },
          include: {
            participants: {
              include: { team: true, participant: true },
            },
          },
        },
        rankings: {
          orderBy: { position: "asc" },
          include: { team: true, participant: true },
        },
        champions: {
          orderBy: { position: "asc" },
          include: { team: true, participant: true },
        },
        media: {
          orderBy: { order: "asc" },
        },
        announcements: {
          where: { isPublished: true },
          orderBy: { publishedAt: "desc" },
        },
        _count: {
          select: {
            teams: true,
            compParticipants: true,
            matches: true,
          },
        },
      },
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    return NextResponse.json(competition);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.competition.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.name ? slugify(body.name) : undefined,
        description: body.description,
        status: body.status,
        type: body.type,
        format: body.format,
        category: body.category,
        venue: body.venue,
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
        rules: body.rules,
        config: body.config !== undefined ? body.config : undefined,
        maxParticipants: body.maxParticipants ? parseInt(body.maxParticipants) : undefined,
        order: body.order !== undefined ? parseInt(body.order) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.competition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
