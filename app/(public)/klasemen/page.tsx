import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import KlasemenClient from "./klasemen-client";

export const metadata: Metadata = {
  title: "Klasemen Juara Umum",
  description: "Lihat klasemen juara umum seluruh perlombaan BONDING FEST 2026",
};

export const dynamic = "force-dynamic";

export default async function KlasemenPage() {
  const event = await prisma.event.findFirst();
  if (!event) return null;

  const [standings, competitions] = await Promise.all([
    prisma.overallStanding.findMany({
      where: { eventId: event.id },
      orderBy: { rank: "asc" },
    }),
    prisma.competition.findMany({
      where: { eventId: event.id },
      orderBy: { order: "asc" },
      include: {
        champions: {
          orderBy: { position: "asc" },
          take: 3,
          include: { team: true, participant: true },
        },
      },
    }),
  ]);

  return (
    <KlasemenClient
      standings={standings}
      competitions={competitions}
      pointSystem={JSON.parse(event.pointSystem)}
    />
  );
}
