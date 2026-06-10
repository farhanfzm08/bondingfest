import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/teams/[id] — update team fields like groupName, seedNumber
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await prisma.team.update({
      where: { id },
      data: {
        groupName: body.groupName !== undefined ? (body.groupName || null) : undefined,
        seedNumber: body.seedNumber !== undefined ? (body.seedNumber || null) : undefined,
        name: body.name !== undefined ? body.name : undefined,
        section: body.section !== undefined ? (body.section || null) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Team not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
