import { prisma } from "@/lib/prisma";
import HeroSection from "@/components/public/hero-section";
import LiveStats from "@/components/public/live-stats";
import OverallStandingsSection from "@/components/public/overall-standings-section";
import CompetitionsGrid from "@/components/public/competitions-grid";
import AnnouncementsSection from "@/components/public/announcements-section";
import UpcomingMatches from "@/components/public/upcoming-matches";
import SponsorsSection from "@/components/public/sponsors-section";

export const dynamic = "force-dynamic";

async function getHomepageData() {
  const event = await prisma.event.findFirst();
  if (!event) return null;

  const [competitions, overallStandings, announcements, upcomingMatches, sponsors, participantsCount, teamsCount] =
    await Promise.all([
      prisma.competition.findMany({
        where: { eventId: event.id },
        orderBy: { order: "asc" },
        take: 8,
        include: {
          _count: { select: { teams: true, compParticipants: true, matches: true } },
          champions: {
            orderBy: { position: "asc" },
            take: 1,
            include: { team: true, participant: true },
          },
        },
      }),
      prisma.overallStanding.findMany({
        where: { eventId: event.id },
        orderBy: { rank: "asc" },
        take: 8,
      }),
      prisma.announcement.findMany({
        where: { eventId: event.id, isPublished: true },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        take: 4,
      }),
      prisma.match.findMany({
        where: {
          competition: { eventId: event.id },
          status: { in: ["SCHEDULED", "ONGOING"] },
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        include: {
          competition: { select: { name: true, slug: true } },
          participants: {
            include: { team: true, participant: true },
          },
        },
      }),
      prisma.sponsor.findMany({
        where: { eventId: event.id },
        orderBy: [{ tier: "asc" }, { order: "asc" }],
      }),
      prisma.participant.count({ where: { eventId: event.id } }),
      prisma.team.count({ where: { competition: { eventId: event.id } } }),
    ]);

  const matchesCount = await prisma.match.count({
    where: { competition: { eventId: event.id } },
  });

  return {
    event: { ...event, pointSystem: JSON.parse(event.pointSystem) },
    competitions,
    overallStandings,
    announcements,
    upcomingMatches,
    sponsors,
    stats: {
      competitions: competitions.length,
      participants: participantsCount,
      teams: teamsCount,
      matches: matchesCount,
    },
  };
}

export default async function HomePage() {
  const data = await getHomepageData();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-black">Event belum dikonfigurasi.</p>
      </div>
    );
  }

  return (
    <>
      <HeroSection event={data.event} />
      <LiveStats stats={data.stats} />
      <OverallStandingsSection standings={data.overallStandings} />
      <CompetitionsGrid competitions={data.competitions} />
      <AnnouncementsSection announcements={data.announcements} />
      <UpcomingMatches matches={data.upcomingMatches} />
      <SponsorsSection sponsors={data.sponsors} />
    </>
  );
}
