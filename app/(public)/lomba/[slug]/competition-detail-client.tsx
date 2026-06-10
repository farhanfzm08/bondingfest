"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Users, Swords, Trophy, Calendar, Image, Megaphone, MapPin, Clock } from "lucide-react";
import { cn, getStatusColor, getStatusLabel, formatDateTime, formatTime, getMedalEmoji } from "@/lib/utils";

// Types
interface Participant { id: string; name: string; section: string | null; }
interface Team { id: string; name: string; section: string | null; seedNumber: number | null; members: Array<{ participant: Participant; role: string }>; rankings: Array<{ position: number; points: number; wins: number; losses: number; draws: number }>; }
interface MatchParticipant { score: number; result: string | null; team: { name: string } | null; participant: { name: string } | null; }
interface Match { id: string; name: string; round: string | null; scheduledAt: Date | string | null; venue: string | null; status: string; participants: MatchParticipant[]; }
interface Champion { position: number; section: string | null; team: { name: string } | null; participant: { name: string } | null; awardPoints: number; }
interface Media { id: string; url: string; title: string | null; type: string; }
interface Announcement { id: string; title: string; content: string; type: string; publishedAt: Date | string; }

interface Competition {
  id: string; name: string; slug: string; description: string | null; status: string; type: string;
  category: string | null; venue: string | null; rules: string | null; bannerUrl: string | null;
  teams: Team[]; compParticipants: Array<{ participant: Participant }>; matches: Match[];
  rankings: Array<{ position: number; points: number; wins: number; losses: number; draws: number; team: { name: string } | null; participant: { name: string } | null; }>;
  champions: Champion[]; media: Media[]; announcements: Announcement[];
  _count: { teams: number; compParticipants: number; matches: number };
}

const tabs = [
  { id: "overview", label: "Overview", icon: Trophy },
  { id: "peserta", label: "Peserta", icon: Users },
  { id: "jadwal", label: "Jadwal & Hasil", icon: Calendar },
  { id: "ranking", label: "Ranking", icon: Swords },
  { id: "galeri", label: "Galeri", icon: Image },
  { id: "pengumuman", label: "Info", icon: Megaphone },
];

export default function CompetitionDetailClient({ competition }: { competition: Competition }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen pt-20">
      {/* Banner */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-br from-blue-100 via-indigo-50 to-transparent overflow-hidden">
        {competition.bannerUrl ? (
          <img src={competition.bannerUrl} alt={competition.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
        
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 pb-8 w-full">
            <Link href="/lomba" className="inline-flex items-center gap-2 text-black hover:text-black text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Semua Lomba
            </Link>
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl shadow-xl">
                {competition.category === "Esports" ? "🎮" : competition.category === "Olahraga" ? "⚽" : "🏆"}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full border font-medium", getStatusColor(competition.status))}>
                    {getStatusLabel(competition.status)}
                  </span>
                  {competition.category && (
                    <span className="text-black text-xs">{competition.category}</span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-black">{competition.name}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8 -mt-2">
          {[
            { label: competition.type === "TEAM" ? "Tim" : "Peserta", value: competition.type === "TEAM" ? competition._count.teams : competition._count.compParticipants, icon: Users },
            { label: "Match", value: competition._count.matches, icon: Swords },
            { label: "Juara", value: competition.champions.length > 0 ? "Ada" : "Belum", icon: Trophy },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <Icon className="w-4 h-4 text-indigo-400 mx-auto mb-2" />
              <div className="text-black font-bold text-xl stat-number">{value}</div>
              <div className="text-black text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-black whitespace-nowrap transition-all flex-shrink-0 border-2 border-[#1C1917]",
                activeTab === id
                  ? "bg-indigo-600 text-white shadow-[3px_3px_0_#1C1917] translate-x-[-2px] translate-y-[-2px]"
                  : "bg-white text-[#1C1917] hover:bg-indigo-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Description */}
                {competition.description && (
                  <div className="glass rounded-xl p-6">
                    <h2 className="text-black font-bold mb-3">Tentang Lomba</h2>
                    <p className="text-black text-sm leading-relaxed">{competition.description}</p>
                  </div>
                )}

                {/* Details */}
                <div className="glass rounded-xl p-6">
                  <h2 className="text-black font-bold mb-4">Detail Event</h2>
                  <div className="space-y-3">
                    {competition.venue && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                        <span className="text-black">{competition.venue}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-4 h-4 text-violet-400" />
                      <span className="text-black">
                        Format: {competition.type === "TEAM" ? "Beregu" : "Perorangan"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Champions */}
                {competition.champions.length > 0 && (
                  <div className="glass rounded-xl p-6">
                    <h2 className="text-black font-bold mb-4">🏆 Juara</h2>
                    <div className="space-y-3">
                      {competition.champions.map((champ) => (
                        <div key={champ.position} className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border",
                          champ.position === 1 ? "border-amber-500/30 bg-amber-500/[0.05]" :
                          champ.position === 2 ? "border-gray-500/30 bg-gray-500/[0.05]" :
                          "border-orange-700/30 bg-orange-700/[0.05]"
                        )}>
                          <span className="text-3xl">{getMedalEmoji(champ.position)}</span>
                          <div>
                            <div className="text-black font-bold">
                              {champ.team?.name || champ.participant?.name}
                            </div>
                            {champ.section && (
                              <div className="text-black text-xs">{champ.section}</div>
                            )}
                          </div>
                          <div className="ml-auto text-right">
                            <div className="text-indigo-400 font-bold">+{champ.awardPoints}</div>
                            <div className="text-black text-xs">poin</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules */}
                {competition.rules && (
                  <div className="glass rounded-xl p-6">
                    <h2 className="text-black font-bold mb-3">Peraturan</h2>
                    <p className="text-black text-sm leading-relaxed whitespace-pre-wrap">{competition.rules}</p>
                  </div>
                )}
              </div>
            )}

            {/* PESERTA */}
            {activeTab === "peserta" && (
              <div>
                {competition.type === "TEAM" ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {competition.teams.map((team) => (
                      <div key={team.id} className="glass rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-black font-bold">{team.name}</div>
                            {team.section && <div className="text-black text-xs">{team.section}</div>}
                          </div>
                          {team.seedNumber && (
                            <div className="ml-auto text-black text-xs">#{team.seedNumber}</div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {team.members.map((m) => (
                            <div key={m.participant.id} className="flex items-center gap-2 text-sm">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-black">
                                {m.participant.name[0]}
                              </div>
                              <span className="text-black">{m.participant.name}</span>
                              {m.role === "CAPTAIN" && (
                                <span className="text-xs text-amber-400 ml-auto">Kapten</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="text-left px-5 py-3 text-black text-xs font-semibold uppercase tracking-wider">#</th>
                          <th className="text-left px-5 py-3 text-black text-xs font-semibold uppercase tracking-wider">Nama</th>
                          <th className="text-left px-5 py-3 text-black text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Institusi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competition.compParticipants.map(({ participant }, i) => (
                          <tr key={participant.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="px-5 py-3 text-black text-sm">{i + 1}</td>
                            <td className="px-5 py-3 text-black font-medium text-sm">{participant.name}</td>
                            <td className="px-5 py-3 text-black text-sm hidden sm:table-cell">{participant.section}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {competition.compParticipants.length === 0 && (
                      <div className="p-10 text-center text-black">Belum ada peserta</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* JADWAL & HASIL */}
            {activeTab === "jadwal" && (
              <div className="space-y-3">
                {competition.matches.length === 0 ? (
                  <div className="glass rounded-xl p-10 text-center text-black">Belum ada jadwal pertandingan</div>
                ) : (
                  competition.matches.map((match) => {
                    const p1 = match.participants[0];
                    const p2 = match.participants[1];
                    const isCompleted = match.status === "COMPLETED";
                    const isOngoing = match.status === "ONGOING";

                    return (
                      <div key={match.id} className={cn(
                        "glass rounded-xl p-5 border",
                        isOngoing ? "border-green-500/30" : isCompleted ? "border-white/10" : "border-white/[0.06]"
                      )}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-black text-xs">{match.round}</span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            isCompleted ? "bg-gray-500/20 text-black" :
                            isOngoing ? "bg-green-500/20 text-green-400" :
                            "bg-blue-500/20 text-blue-400"
                          )}>
                            {getStatusLabel(match.status)}
                          </span>
                          {isOngoing && <span className="pulse-dot ml-auto" />}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1 text-right text-black font-semibold text-sm">
                            {p1?.team?.name || p1?.participant?.name || "TBD"}
                          </div>
                          <div className={cn(
                            "min-w-[80px] text-center rounded-xl py-2 px-3 text-lg font-black stat-number",
                            isCompleted ? "bg-white/10" : "glass"
                          )}>
                            {isCompleted || isOngoing ? `${p1?.score ?? 0} - ${p2?.score ?? 0}` : "VS"}
                          </div>
                          <div className="flex-1 text-black font-semibold text-sm">
                            {p2?.team?.name || p2?.participant?.name || "TBD"}
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-black">
                          {match.scheduledAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(match.scheduledAt)}
                            </span>
                          )}
                          {match.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {match.venue}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* RANKING */}
            {activeTab === "ranking" && (
              <div>
                {competition.rankings.length === 0 ? (
                  <div className="glass rounded-xl p-10 text-center text-black">Belum ada data ranking</div>
                ) : (
                  <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="text-left px-5 py-3 text-black text-xs font-semibold uppercase tracking-wider">Rank</th>
                          <th className="text-left px-5 py-3 text-black text-xs font-semibold uppercase tracking-wider">Nama</th>
                          <th className="text-center px-4 py-3 text-black text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">M</th>
                          <th className="text-center px-4 py-3 text-black text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">K</th>
                          <th className="text-center px-4 py-3 text-black text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">S</th>
                          <th className="text-right px-5 py-3 text-black text-xs font-semibold uppercase tracking-wider">Poin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competition.rankings.map((rank, i) => (
                          <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="px-5 py-3">
                              {rank.position <= 3 ? getMedalEmoji(rank.position) : <span className="text-black text-sm">#{rank.position}</span>}
                            </td>
                            <td className="px-5 py-3 text-black font-medium text-sm">
                              {rank.team?.name || rank.participant?.name}
                            </td>
                            <td className="px-4 py-3 text-center text-green-400 hidden sm:table-cell">{rank.wins}</td>
                            <td className="px-4 py-3 text-center text-red-400 hidden sm:table-cell">{rank.losses}</td>
                            <td className="px-4 py-3 text-center text-black hidden sm:table-cell">{rank.draws}</td>
                            <td className="px-5 py-3 text-right text-indigo-400 font-bold stat-number">{rank.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* GALERI */}
            {activeTab === "galeri" && (
              <div>
                {competition.media.length === 0 ? (
                  <div className="glass rounded-xl p-16 text-center">
                    <div className="text-4xl mb-3">📷</div>
                    <p className="text-black">Belum ada galeri</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {competition.media.map((item) => (
                      <div key={item.id} className="aspect-video rounded-xl overflow-hidden glass group cursor-pointer">
                        {item.type === "IMAGE" ? (
                          <img src={item.url} alt={item.title || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl">▶️</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PENGUMUMAN / INFO */}
            {activeTab === "pengumuman" && (
              <div className="space-y-3">
                {competition.announcements.length === 0 ? (
                  <div className="glass rounded-xl p-10 text-center text-black">Belum ada info</div>
                ) : (
                  competition.announcements.map((ann) => (
                    <div key={ann.id} className="glass rounded-xl p-5">
                      <h3 className="text-black font-bold text-sm mb-2">{ann.title}</h3>
                      <p className="text-black text-sm">{ann.content}</p>
                      <p className="text-black text-xs mt-3">{formatDateTime(ann.publishedAt)}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
