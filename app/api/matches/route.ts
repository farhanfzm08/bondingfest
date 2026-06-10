import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/matches?competitionId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get("competitionId");
    const where = competitionId ? { competitionId } : {};
    const matches = await prisma.match.findMany({
      where,
      orderBy: [{ groupName: "asc" }, { scheduledAt: "asc" }],
      include: {
        participants: {
          include: { team: true, participant: true },
        },
        competition: { select: { name: true, format: true } },
      },
    });
    return NextResponse.json(matches);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/matches — create new match
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.competitionId || !body.name) {
      return NextResponse.json({ error: "competitionId dan name wajib diisi" }, { status: 400 });
    }
    const match = await prisma.match.create({
      data: {
        competitionId: body.competitionId,
        name: body.name,
        round: body.round || null,
        stage: body.stage || "REGULAR",
        groupName: body.groupName || null,
        bracketSlot: body.bracketSlot ? Number(body.bracketSlot) : null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        venue: body.venue || null,
        status: body.status || "SCHEDULED",
        notes: body.notes || null,
      },
      include: { participants: { include: { team: true, participant: true } } },
    });

    // Create participant slots if provided
    if (Array.isArray(body.participants) && body.participants.length > 0) {
      await Promise.all(
        body.participants.map((p: { teamId?: string; participantId?: string }) =>
          prisma.matchParticipant.create({
            data: {
              matchId: match.id,
              teamId: p.teamId || null,
              participantId: p.participantId || null,
              score: 0,
            },
          })
        )
      );
    }

    const full = await prisma.match.findUnique({
      where: { id: match.id },
      include: { participants: { include: { team: true, participant: true } } },
    });
    return NextResponse.json(full, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
