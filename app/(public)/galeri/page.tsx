import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import GaleriClient from "./galeri-client";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Galeri foto dan video BONDING FEST 2026",
};
export const dynamic = "force-dynamic";

export default async function GaleriPage() {
  const event = await prisma.event.findFirst();
  if (!event) return null;

  const media = await prisma.media.findMany({
    where: { eventId: event.id },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { competition: { select: { name: true, slug: true } } },
  });

  return <GaleriClient media={media} />;
}
