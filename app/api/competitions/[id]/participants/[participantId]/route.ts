import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/competitions/[id]/participants/[participantId]
// Updates groupName (and other fields) for a CompetitionParticipant
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id: competitionId, participantId } = await params;
    const body = await req.json();

    const updated = await prisma.competitionParticipant.update({
      where: { competitionId_participantId: { competitionId, participantId } },
      data: {
        groupName: body.groupName !== undefined ? (body.groupName || null) : undefined,
        seedNumber: body.seedNumber !== undefined ? (body.seedNumber || null) : undefined,
        status: body.status !== undefined ? body.status : undefined,
      },
      include: { participant: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
