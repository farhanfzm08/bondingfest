import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/competitions/[id]/participants
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teams = await prisma.team.findMany({
      where: { competitionId: id },
      orderBy: { createdAt: "asc" },
      include: { members: { include: { participant: true } } },
    });
    const individuals = await prisma.competitionParticipant.findMany({
      where: { competitionId: id },
      include: { participant: true },
    });
    return NextResponse.json({ teams, individuals });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/competitions/[id]/participants — add team or individual
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: competitionId } = await params;
    const body = await req.json();

    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    if (competition.type === "INDIVIDUAL" || competition.type === "DUO") {
      // Register individual/duo participant
      const result = await prisma.competitionParticipant.upsert({
        where: { competitionId_participantId: { competitionId, participantId: body.participantId } },
        update: {},
        create: { competitionId, participantId: body.participantId, status: "REGISTERED" },
        include: { participant: true },
      });
      return NextResponse.json(result, { status: 201 });
    } else {
      // Register team
      const team = await prisma.team.create({
        data: {
          competitionId,
          name: body.teamName || `Tim ${body.section}`,
          section: body.section || null,
          status: "ACTIVE",
          groupName: body.groupName || null,
          isCollaboration: body.isCollaboration || false,
          sections: body.sections ? JSON.stringify(body.sections) : null,
          sectionWeights: body.sectionWeights ? JSON.stringify(body.sectionWeights) : null,
        },
      });

      // Add members
      if (Array.isArray(body.memberIds) && body.memberIds.length > 0) {
        await Promise.all(
          body.memberIds.map((pid: string, idx: number) =>
            prisma.teamMember.create({
              data: { teamId: team.id, participantId: pid, role: idx === 0 ? "CAPTAIN" : "MEMBER" },
            })
          )
        );
      }

      const full = await prisma.team.findUnique({
        where: { id: team.id },
        include: { members: { include: { participant: true } } },
      });
      return NextResponse.json(full, { status: 201 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/competitions/[id]/participants?teamId=xxx or ?participantId=xxx
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: competitionId } = await params;
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const participantId = searchParams.get("participantId");

    if (teamId) {
      await prisma.team.delete({ where: { id: teamId } });
    } else if (participantId) {
      await prisma.competitionParticipant.deleteMany({ where: { competitionId, participantId } });
    } else {
      return NextResponse.json({ error: "teamId atau participantId diperlukan" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
