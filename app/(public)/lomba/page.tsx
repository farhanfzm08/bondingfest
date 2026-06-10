import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Users, Swords, ArrowRight, Search } from "lucide-react";
import LombaListClient from "./lomba-list-client";

export const metadata: Metadata = {
  title: "Semua Lomba",
  description: "Daftar seluruh cabang perlombaan BONDING FEST 2026",
};

export const dynamic = "force-dynamic";

export default async function LombaPage() {
  const event = await prisma.event.findFirst();
  if (!event) return null;

  const competitions = await prisma.competition.findMany({
    where: { eventId: event.id },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { teams: true, compParticipants: true, matches: true, champions: true },
      },
      champions: {
        orderBy: { position: "asc" },
        take: 1,
        include: { team: true, participant: true },
      },
    },
  });

  return <LombaListClient competitions={competitions} />;
}
