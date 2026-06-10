import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Users, Swords, Megaphone, Plus, ArrowRight, Clock, TrendingUp, BarChart2 } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard Admin — BONDING FEST 2026" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const event = await prisma.event.findFirst();
  if (!event) return (
    <div className="neu-card p-8 text-center">
      <p className="text-black font-bold">Event belum dikonfigurasi.</p>
      <Link href="/admin/pengaturan" className="btn-neon mt-4 inline-flex px-4 py-2 text-sm">Pengaturan Event</Link>
    </div>
  );

  const [competitionsCount, participantsCount, matchesCount, announcements, recentMatches, overallStandings, competitions] = await Promise.all([
    prisma.competition.count({ where: { eventId: event.id } }),
    prisma.participant.count({ where: { eventId: event.id } }),
    prisma.match.count({ where: { competition: { eventId: event.id } } }),
    prisma.announcement.findMany({
      where: { eventId: event.id, isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.match.findMany({
      where: { competition: { eventId: event.id } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        competition: { select: { name: true } },
        participants: { include: { team: true, participant: true } },
      },
    }),
    prisma.overallStanding.findMany({
      where: { eventId: event.id },
      orderBy: { rank: "asc" },
      take: 5,
    }),
    prisma.competition.findMany({
      where: { eventId: event.id },
      orderBy: { order: "asc" },
      select: { id: true, name: true, status: true, slug: true, format: true },
    }),
  ]);

  const completedMatches = await prisma.match.count({ where: { competition: { eventId: event.id }, status: "COMPLETED" } });
  const ongoingMatches = await prisma.match.count({ where: { competition: { eventId: event.id }, status: "ONGOING" } });

  const statsCards = [
    { label: "Cabang Lomba",   value: competitionsCount, icon: Swords,    color: "#0891B2", bg: "#ECFEFF", link: "/admin/lomba" },
    { label: "Total Peserta",  value: participantsCount, icon: Users,     color: "#10B981", bg: "#ECFDF5", link: "/admin/peserta" },
    { label: "Pertandingan",   value: matchesCount,      icon: BarChart2, color: "#F97316", bg: "#FFF7ED", link: "/admin/klasemen" },
    { label: "Pengumuman",     value: announcements.length, icon: Megaphone, color: "#F59E0B", bg: "#FFFBEB", link: "/admin/pengumuman" },
  ];

  const formatBadge: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
    BRACKET:     { emoji: "🏆", label: "Gugur",       bg: "#FFF7ED", color: "#C2410C" },
    GROUP_STAGE: { emoji: "👥", label: "Grup",        bg: "#ECFEFF", color: "#0E7490" },
    TIME_TRIAL:  { emoji: "⏱️", label: "Time Trial",  bg: "#ECFDF5", color: "#065F46" },
  };

  const statusLabel: Record<string, { label: string; bg: string; color: string }> = {
    UPCOMING:     { label: "Akan Datang", bg: "#EFF6FF", color: "#1D4ED8" },
    REGISTRATION: { label: "Daftar",      bg: "#FFFBEB", color: "#92400E" },
    ONGOING:      { label: "Berlangsung", bg: "#ECFDF5", color: "#065F46" },
    COMPLETED:    { label: "Selesai",     bg: "#F5F5F4", color: "#57534E" },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">Dashboard Admin</h1>
          <p className="text-black text-sm font-semibold mt-0.5">
            {event.name} —{" "}
            <span className={event.status === "ONGOING" ? "text-[#10B981]" : "text-[#0891B2]"}>
              {event.status === "ONGOING" ? "🟢 Sedang berlangsung" : event.status === "UPCOMING" ? "🔵 Segera dimulai" : "⚫ Selesai"}
            </span>
          </p>
        </div>
        <Link href="/admin/lomba" className="btn-neon text-sm px-4 py-2 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Tambah Lomba
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link key={label} href={link}
            className="block p-5 rounded-[6px] border-[2.5px] border-[#1C1917] card-hover group"
            style={{ background: bg, boxShadow: `4px 4px 0 ${color}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[6px] border-[2.5px] border-[#1C1917] flex items-center justify-center"
                style={{ background: color }}>
                <Icon className="w-5 h-5 text-black" />
              </div>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-3xl font-black text-[#1C1917] stat-number">{value}</div>
            <div className="text-black text-xs font-bold mt-1">{label}</div>
          </Link>
        ))}
      </div>

      {/* Match Status Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Selesai",      value: completedMatches, color: "#57534E", bg: "#F5F5F4" },
          { label: "Live Sekarang",value: ongoingMatches,   color: "#065F46", bg: "#ECFDF5" },
          { label: "Terjadwal",    value: matchesCount - completedMatches - ongoingMatches, color: "#1D4ED8", bg: "#EFF6FF" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-[6px] border-[2.5px] border-[#1C1917] p-4 text-center"
            style={{ background: bg, boxShadow: `3px 3px 0 ${color}` }}>
            <div className="text-2xl font-black stat-number" style={{ color }}>{value}</div>
            <div className="text-black text-xs font-bold mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Matches */}
        <div className="lg:col-span-2 neu-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#1C1917] font-black flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0891B2]" /> Pertandingan Terbaru
            </h2>
            <Link href="/admin/klasemen" className="text-[#0891B2] hover:text-[#0E7490] text-xs font-bold">Semua →</Link>
          </div>
          <div className="space-y-2">
            {recentMatches.map((match) => {
              const p1 = match.participants[0];
              const p2 = match.participants[1];
              const isCompleted = match.status === "COMPLETED";
              const isOngoing = match.status === "ONGOING";
              return (
                <div key={match.id} className="flex items-center gap-3 p-3 rounded-[6px] border-2 border-[#E7E5E4] hover:border-[#0891B2] hover:bg-[#ECFEFF] transition-all">
                  <div className="text-xs text-black w-20 flex-shrink-0 truncate font-bold">{match.competition.name}</div>
                  <div className="flex-1 flex items-center gap-2 text-sm">
                    <span className="text-[#1C1917] font-bold truncate">{p1?.team?.name || p1?.participant?.name || "TBD"}</span>
                    <span className="text-black font-black text-xs px-2 py-0.5 bg-[#FEF3C7] border-2 border-[#1C1917] rounded-[4px]">
                      {isCompleted || isOngoing ? `${p1?.score ?? 0}-${p2?.score ?? 0}` : "vs"}
                    </span>
                    <span className="text-[#1C1917] font-bold truncate">{p2?.team?.name || p2?.participant?.name || "TBD"}</span>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-[4px] border-2 border-[#1C1917] ${
                    isCompleted ? "bg-[#F5F5F4] text-[#57534E]" : isOngoing ? "bg-[#ECFDF5] text-[#065F46]" : "bg-[#EFF6FF] text-[#1D4ED8]"
                  }`}>
                    {isCompleted ? "Selesai" : isOngoing ? "Live" : "Jadwal"}
                  </span>
                </div>
              );
            })}
            {recentMatches.length === 0 && (
              <div className="text-center py-6 text-black font-bold text-sm">Belum ada pertandingan</div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="neu-card p-5">
            <h2 className="text-[#1C1917] font-black mb-3 text-sm">⚡ Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/admin/lomba",       emoji: "⚽", label: "Kelola Lomba" },
                { href: "/admin/peserta",     emoji: "👥", label: "Data Peserta" },
                { href: "/admin/pengumuman",  emoji: "📢", label: "Pengumuman" },
                { href: "/admin/pengaturan",  emoji: "⚙️", label: "Pengaturan" },
              ].map(({ href, emoji, label }) => (
                <Link key={href} href={href}
                  className="p-3 rounded-[6px] border-2 border-[#D4D0CA] hover:border-[#1C1917] hover:shadow-[2px_2px_0_#1C1917] hover:bg-[#FFFBEB] transition-all text-center group">
                  <div className="text-xl mb-1">{emoji}</div>
                  <div className="text-black text-xs font-bold group-hover:text-[#1C1917]">{label}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mini Standings */}
          <div className="neu-card-ocean p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#1C1917] font-black text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#F59E0B]" /> Top Seksi
              </h2>
              <Link href="/admin/klasemen" className="text-[#0891B2] text-xs font-bold">→</Link>
            </div>
            <div className="space-y-2">
              {overallStandings.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className={`font-black w-6 text-center rounded-[4px] border-2 border-[#1C1917] px-1 ${
                    s.rank === 1 ? "bg-[#FCD34D]" : s.rank === 2 ? "bg-[#E2E8F0]" : s.rank === 3 ? "bg-[#FBBF24]" : "bg-white"
                  } text-[#1C1917]`}>{s.rank}</span>
                  <span className="text-[#1C1917] font-bold flex-1 truncate">{(s.section || "").replace("Seksi ", "")}</span>
                  <span className="font-black text-[#F59E0B]">{s.totalPoints}pts</span>
                </div>
              ))}
              {overallStandings.length === 0 && (
                <div className="text-black text-xs text-center py-3 font-bold">Belum ada data klasemen</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Competitions Grid */}
      <div className="neu-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#1C1917] font-black flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#F59E0B]" /> Status Semua Lomba
          </h2>
          <Link href="/admin/lomba" className="text-[#0891B2] text-xs font-bold">Kelola →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {competitions.map((comp) => {
            const fmt = formatBadge[comp.format] || formatBadge.BRACKET;
            const st = statusLabel[comp.status] || statusLabel.UPCOMING;
            return (
              <Link key={comp.id} href={`/admin/lomba`}
                className="p-3 rounded-[6px] border-2 border-[#D4D0CA] hover:border-[#1C1917] hover:shadow-[3px_3px_0_#1C1917] transition-all bg-white">
                <div className="text-[#1C1917] font-black text-xs mb-2 truncate">{comp.name}</div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-[3px] border border-[#D4D0CA]"
                    style={{ background: fmt.bg, color: fmt.color }}>{fmt.emoji} {fmt.label}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-[3px] border border-[#D4D0CA]"
                    style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
