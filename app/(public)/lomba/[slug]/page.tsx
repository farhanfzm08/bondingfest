import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CompetitionDetailClient from "./competition-detail-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const competition = await prisma.competition.findFirst({ where: { slug } });
  return {
    title: competition?.name || "Detail Lomba",
    description: competition?.description || undefined,
  };
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { slug } = await params;

  const competition = await prisma.competition.findFirst({
    where: { slug },
    include: {
      event: true,
      teams: {
        include: {
          members: { include: { participant: true } },
          rankings: true,
        },
        orderBy: { seedNumber: "asc" },
      },
      compParticipants: {
        include: { participant: true },
      },
      matches: {
        orderBy: [{ bracketSlot: "asc" }, { groupName: "asc" }, { scheduledAt: "asc" }],
        include: {
          participants: {
            include: { team: { select: { id: true, name: true, section: true } }, participant: { select: { id: true, name: true, section: true } } },
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
        take: 5,
      },
      _count: {
        select: { teams: true, compParticipants: true, matches: true },
      },
    },
  });

  if (!competition) notFound();

  return <CompetitionDetailClient competition={competition} />;
}
