import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const section = await prisma.section.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        color: body.color,
        order: body.order !== undefined ? Number(body.order) : undefined,
      },
    });
    return NextResponse.json(section);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Nama seksi sudah ada" }, { status: 409 });
    if (e.code === "P2025") return NextResponse.json({ error: "Seksi tidak ditemukan" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.section.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Seksi tidak ditemukan" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
