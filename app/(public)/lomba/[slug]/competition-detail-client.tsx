"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Users, Swords, Trophy, Calendar, Image, Megaphone, MapPin, Clock } from "lucide-react";
import { cn, getStatusColor, getStatusLabel, formatDateTime, formatTime, getMedalEmoji } from "@/lib/utils";

// Types
interface Participant { id: string; name: string; section: string | null; }
interface Team { id: string; name: string; section: string | null; groupName?: string | null; seedNumber: number | null; members: Array<{ participant: Participant; role: string }>; rankings: Array<{ position: number; points: number; wins: number; losses: number; draws: number }>; }
interface MatchParticipant { id?: string; score: number; result: string | null; timeResult?: string | null; team: { id?: string; name: string } | null; participant: { id?: string; name: string } | null; }
interface Match { id: string; name: string; round: string | null; groupName?: string | null; scheduledAt: Date | string | null; venue: string | null; status: string; bracketSlot?: number | null; participants: MatchParticipant[]; }
interface Champion { position: number; section: string | null; team: { name: string } | null; participant: { name: string } | null; awardPoints: number; }
interface Media { id: string; url: string; title: string | null; type: string; }
interface Announcement { id: string; title: string; content: string; type: string; publishedAt: Date | string; }

interface Competition {
  id: string; name: string; slug: string; description: string | null; status: string; type: string;
  format: string; config: string | null;
  category: string | null; venue: string | null; rules: string | null; bannerUrl: string | null;
  teams: Team[]; compParticipants: Array<{ participant: Participant; groupName?: string | null }>; matches: Match[];
  rankings: Array<{ position: number; points: number; wins: number; losses: number; draws: number; team: { name: string } | null; participant: { name: string } | null; }>;
  champions: Champion[]; media: Media[]; announcements: Announcement[];
  _count: { teams: number; compParticipants: number; matches: number };
}

// Compute group standings from match data
function computeGroupStandings(competition: Competition) {
  const cfg = competition.config ? JSON.parse(competition.config) : {};
  const numGroups = cfg.numGroups || 2;
  const groups = Array.from({ length: numGroups }, (_, i) => `Grup ${String.fromCharCode(65 + i)}`);
  const ptsWin = cfg.pointsWin ?? 3, ptsDraw = cfg.pointsDraw ?? 1, ptsLoss = cfg.pointsLoss ?? 0;
  const advanceCount = cfg.advanceCount || 2;

  // Build entity list with groupName
  const isTeam = competition.type === "TEAM" || competition.type === "DUO";
  type Entity = { id: string; name: string; groupName: string | null; section: string | null };
  let entities: Entity[] = [];
  if (isTeam) {
    entities = competition.teams.map(t => ({ id: t.id, name: t.name, groupName: t.groupName ?? null, section: t.section }));
  } else {
    entities = competition.compParticipants.map(cp => ({ id: cp.participant.id, name: cp.participant.name, groupName: cp.groupName ?? null, section: cp.participant.section }));
  }

  // Compute stats
  const stat: Record<string, { pts: number; wins: number; draws: number; losses: number; gf: number; ga: number; played: number }> = {};
  for (const e of entities) stat[e.id] = { pts: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, played: 0 };

  const groupMatches = competition.matches.filter(m => !m.bracketSlot);
  for (const m of groupMatches) {
    if (m.status !== "COMPLETED" || m.participants.length < 2) continue;
    const [pA, pB] = m.participants;
    const idA = (pA.team as any)?.id || (pA.participant as any)?.id || "";
    const idB = (pB.team as any)?.id || (pB.participant as any)?.id || "";
    if (!stat[idA] || !stat[idB]) continue;
    stat[idA].gf += pA.score; stat[idA].ga += pB.score; stat[idA].played++;
    stat[idB].gf += pB.score; stat[idB].ga += pA.score; stat[idB].played++;
    if (pA.score > pB.score) { stat[idA].wins++; stat[idA].pts += ptsWin; stat[idB].losses++; stat[idB].pts += ptsLoss; }
    else if (pB.score > pA.score) { stat[idB].wins++; stat[idB].pts += ptsWin; stat[idA].losses++; stat[idA].pts += ptsLoss; }
    else { stat[idA].draws++; stat[idA].pts += ptsDraw; stat[idB].draws++; stat[idB].pts += ptsDraw; }
  }

  return { groups, entities, stat, advanceCount, groupMatches };
}

// Format ms → "HH:MM:SS.mmm"
function msToTimeStr(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mil = ms % 1000;
  const pad = (n: number, d = 2) => String(n).padStart(d, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(mil, 3)}`;
  return `${pad(m)}:${pad(s)}.${pad(mil, 3)}`;
}

import useSWR from "swr";

export default function CompetitionDetailClient({ competition: initialData }: { competition: Competition }) {
  const { data: competition } = useSWR(
    `/api/competitions/${initialData.slug}`,
    (url) => fetch(url).then(r => r.json()),
    {
      fallbackData: initialData,
      refreshInterval: 10000, // Poll every 10s for live updates
    }
  );

  const [activeTab, setActiveTab] = useState("overview");

  const baseTabs = [
    { id: "overview", label: "Overview", icon: Trophy },
    { id: "peserta", label: "Peserta", icon: Users },
    { id: "jadwal", label: "Jadwal & Hasil", icon: Calendar },
  ];

  let formatTabs: any[] = [];
  if (competition.format === "BRACKET") {
    formatTabs = [{ id: "bracket", label: "Bracket", icon: Swords }];
  } else if (competition.format === "GROUP_STAGE") {
    formatTabs = [
      { id: "fase-grup", label: "Fase Grup", icon: Users },
      { id: "bracket", label: "Bracket", icon: Swords }
    ];
  } else if (competition.format === "TIME_TRIAL") {
    formatTabs = [{ id: "ranking", label: "Ranking", icon: Trophy }];
  }

  const tabs = [
    ...baseTabs,
    ...formatTabs,
    { id: "info", label: "Info", icon: Megaphone },
  ];

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
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-black whitespace-nowrap transition-colors flex-shrink-0 border-2 border-[#1C1917]",
                activeTab === id
                  ? "bg-indigo-600 text-white shadow-[3px_3px_0_#1C1917]"
                  : "bg-white text-[#1C1917] hover:bg-indigo-50 hover:shadow-[3px_3px_0_#1C1917]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
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
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        key={match.id} 
                        className={cn(
                          "glass rounded-xl p-5 border cursor-default",
                          isOngoing ? "border-green-500/30 shadow-[4px_4px_0_#10B981]" : 
                          isCompleted ? "border-[#1C1917] shadow-[4px_4px_0_#1C1917]" : 
                          "border-white/[0.06]"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-black text-xs font-bold bg-white/50 px-2 py-1 rounded-md">{match.round}</span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-bold",
                            isCompleted ? "bg-[#1C1917] text-white" :
                            isOngoing ? "bg-green-500 text-white animate-pulse" :
                            "bg-blue-500/20 text-blue-800"
                          )}>
                            {getStatusLabel(match.status)}
                          </span>
                          {isOngoing && <span className="pulse-dot ml-auto" />}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1 text-right text-black font-black text-sm md:text-base">
                            {p1?.team?.name || p1?.participant?.name || "TBD"}
                          </div>
                          <div className={cn(
                            "min-w-[80px] text-center rounded-xl py-2 px-3 text-lg font-black stat-number border-2 border-[#1C1917]",
                            isCompleted ? "bg-white text-[#1C1917]" : "bg-[#1C1917] text-white"
                          )}>
                            {isCompleted || isOngoing ? `${p1?.score ?? 0} - ${p2?.score ?? 0}` : "VS"}
                          </div>
                          <div className="flex-1 text-black font-black text-sm md:text-base">
                            {p2?.team?.name || p2?.participant?.name || "TBD"}
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 mt-4 text-xs font-bold text-gray-600 bg-white/40 py-2 rounded-lg">
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
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {/* BRACKET */}
            {activeTab === "bracket" && ["BRACKET", "GROUP_STAGE"].includes(competition.format) && (
              <div className="glass rounded-xl p-5 relative">
                <div className="md:hidden text-xs text-black font-bold mb-3 flex items-center gap-2 bg-white/40 p-2 rounded-lg">
                  <span>👉 Geser untuk melihat seluruh bagan</span>
                </div>
                <div className="overflow-x-auto pb-4 pt-2 cursor-grab active:cursor-grabbing">
                {(() => {
                  const cfg = competition.config ? JSON.parse(competition.config) : {};
                  const bracketSize: number = cfg.bracketSize || 8;
                  const thirdPlace: boolean = cfg.thirdPlace ?? true;
                  
                  const rounds: number[] = [];
                  let r = bracketSize;
                  while (r >= 2) { rounds.push(r); r /= 2; }

                  const matchBySlot = new Map<number, Match>();
                  competition.matches.forEach(m => { if (m.bracketSlot) matchBySlot.set(m.bracketSlot, m); });

                  const renderMatchCard = (m: Match | undefined) => {
                    if (!m) return <div className="w-[180px] h-[64px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-[6px] flex items-center justify-center text-[10px] text-gray-400 font-bold">Slot Kosong</div>;
                    
                    const pA = m.participants[0];
                    const pB = m.participants[1];
                    const nA = pA?.team?.name || pA?.participant?.name || "TBD";
                    const nB = pB?.team?.name || pB?.participant?.name || "TBD";

                    return (
                      <motion.div 
                        whileHover={{ scale: 1.05, zIndex: 20 }}
                        className={`w-[180px] rounded-[6px] border-[2px] border-[#1C1917] bg-white overflow-hidden ${m.status==="COMPLETED"?"shadow-[4px_4px_0_#10B981]":"shadow-[4px_4px_0_#1C1917]"} relative z-10 transition-shadow duration-200`}
                      >
                        <div className={`flex items-center justify-between px-2 py-1.5 border-b-2 border-[#1C1917] ${pA?.result==="WIN"?"bg-[#10B981] text-white":""}`}>
                          <span className={`text-[11px] font-black truncate max-w-[120px] ${pA?.result==="WIN"?"text-white":pA?.result==="LOSE"?"text-gray-400 line-through":"text-[#1C1917]"}`}>{nA}</span>
                          <span className={`text-xs font-black stat-number ${pA?.result==="WIN"?"text-white":"text-[#1C1917]"}`}>{m.status==="COMPLETED" ? pA?.score??0 : "-"}</span>
                        </div>
                        <div className={`flex items-center justify-between px-2 py-1.5 ${pB?.result==="WIN"?"bg-[#10B981] text-white":""}`}>
                          <span className={`text-[11px] font-black truncate max-w-[120px] ${pB?.result==="WIN"?"text-white":pB?.result==="LOSE"?"text-gray-400 line-through":"text-[#1C1917]"}`}>{nB}</span>
                          <span className={`text-xs font-black stat-number ${pB?.result==="WIN"?"text-white":"text-[#1C1917]"}`}>{m.status==="COMPLETED" ? pB?.score??0 : "-"}</span>
                        </div>
                      </motion.div>
                    );
                  };

                  const BracketNode = ({ slot, roundIndex }: { slot: number, roundIndex: number }) => {
                    const isFirstRound = roundIndex === 0;
                    const match = matchBySlot.get(slot);
                    
                    return (
                      <div className="flex items-center">
                        {!isFirstRound && (
                          <div className="flex flex-col justify-center relative">
                            <div className="absolute right-0 top-[25%] bottom-[25%] w-[16px] border-r-[2px] border-t-[2px] border-b-[2px] border-[#1C1917] rounded-r-[4px]" />
                            <div className="flex flex-col gap-y-4 pr-4">
                              <BracketNode slot={2 * slot - bracketSize - 1} roundIndex={roundIndex - 1} />
                              <BracketNode slot={2 * slot - bracketSize} roundIndex={roundIndex - 1} />
                            </div>
                          </div>
                        )}
                        <div className="relative pl-4">
                          {!isFirstRound && (
                            <div className="absolute left-0 top-1/2 w-[16px] h-[2px] bg-[#1C1917] -translate-y-1/2" />
                          )}
                          {renderMatchCard(match)}
                        </div>
                      </div>
                    );
                  };

                  const finalSlot = bracketSize - 1;

                  return (
                    <div className="overflow-x-auto pb-4 pt-2">
                      <div className="min-w-max flex gap-6">
                        <BracketNode slot={finalSlot} roundIndex={rounds.length - 1} />
                        
                        {thirdPlace && (
                           <div className="ml-8 border-l-[3px] border-dashed border-[#E7E5E4] pl-8 flex flex-col justify-center">
                             <h3 className="text-[10px] font-black text-[#1C1917] uppercase tracking-wider mb-2 bg-[#FFFBEB] px-2 py-0.5 border-[2px] border-[#1C1917] shadow-[2px_2px_0_#1C1917] inline-block rounded-[4px]">
                               Perebutan Juara 3
                             </h3>
                             {renderMatchCard(matchBySlot.get(bracketSize))}
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* FASE GRUP */}
            {activeTab === "fase-grup" && competition.format === "GROUP_STAGE" && (() => {
              const { groups, entities, stat, advanceCount, groupMatches } = computeGroupStandings(competition);
              return (
                <div className="space-y-6">
                  {groups.map(group => {
                    const grpEntities = entities.filter(e => e.groupName === group).sort((a,b) => {
                      const sa = stat[a.id] || { pts:0, gf:0, ga:0 };
                      const sb = stat[b.id] || { pts:0, gf:0, ga:0 };
                      if (sb.pts !== sa.pts) return sb.pts - sa.pts;
                      return (sb.gf - sb.ga) - (sa.gf - sa.ga);
                    });
                    const grpMatches = groupMatches.filter(m => m.groupName === group);
                    if (grpEntities.length === 0 && grpMatches.length === 0) return null;
                    return (
                      <div key={group} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 font-black text-sm border border-indigo-500/30">{group}</span>
                          <span className="text-black text-xs">{grpEntities.length} peserta · {grpMatches.length} laga</span>
                        </div>

                        {/* Standings */}
                        {grpEntities.length > 0 && (
                          <div className="glass rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                              <thead><tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                <th className="text-left px-4 py-2.5 text-black text-xs font-semibold uppercase">Peserta</th>
                                <th className="text-center px-3 py-2.5 text-black text-xs font-semibold">Main</th>
                                <th className="text-center px-3 py-2.5 text-green-400 text-xs font-semibold">M</th>
                                <th className="text-center px-3 py-2.5 text-gray-400 text-xs font-semibold">S</th>
                                <th className="text-center px-3 py-2.5 text-red-400 text-xs font-semibold">K</th>
                                <th className="text-center px-3 py-2.5 text-black text-xs font-semibold">GD</th>
                                <th className="text-right px-4 py-2.5 text-indigo-400 text-xs font-semibold">Poin</th>
                              </tr></thead>
                              <tbody>
                                {grpEntities.map((e, i) => {
                                  const s = stat[e.id] || { pts:0, wins:0, draws:0, losses:0, gf:0, ga:0, played:0 };
                                  const isAdvancing = i < advanceCount;
                                  return (
                                    <tr key={e.id} className={`border-b border-white/[0.04] ${ isAdvancing ? "bg-indigo-500/10" : ""}`}>
                                      <td className="px-4 py-2.5 flex items-center gap-2">
                                        {isAdvancing && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"/>}
                                        <span className="text-black font-medium">{e.name}</span>
                                        {e.section && <span className="text-black text-xs hidden sm:block">({e.section})</span>}
                                      </td>
                                      <td className="text-center px-3 py-2.5 text-black text-xs">{s.played}</td>
                                      <td className="text-center px-3 py-2.5 text-green-400 font-semibold">{s.wins}</td>
                                      <td className="text-center px-3 py-2.5 text-gray-400">{s.draws}</td>
                                      <td className="text-center px-3 py-2.5 text-red-400">{s.losses}</td>
                                      <td className="text-center px-3 py-2.5 text-black text-xs">{s.gf}-{s.ga}</td>
                                      <td className="text-right px-4 py-2.5 text-indigo-400 font-black stat-number">{s.pts}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Group Matches */}
                        {grpMatches.length > 0 && (
                          <div className="space-y-2">
                            {grpMatches.map(m => {
                              const p1 = m.participants[0]; const p2 = m.participants[1];
                              const done = m.status === "COMPLETED";
                              return (
                                <div key={m.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                                  <span className={`font-semibold text-sm flex-1 text-right ${p1?.result==="WIN"?"text-green-400":"text-black"}`}>
                                    {p1?.team?.name || p1?.participant?.name || "TBD"}
                                  </span>
                                  <span className="px-3 py-1 rounded-lg bg-white/10 text-black font-black text-sm min-w-[60px] text-center stat-number">
                                    {done ? `${p1?.score??0} - ${p2?.score??0}` : "vs"}
                                  </span>
                                  <span className={`font-semibold text-sm flex-1 ${p2?.result==="WIN"?"text-green-400":"text-black"}`}>
                                    {p2?.team?.name || p2?.participant?.name || "TBD"}
                                  </span>
                                  {m.scheduledAt && <span className="text-xs text-black hidden sm:block">{formatDateTime(m.scheduledAt)}</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {grpEntities.length === 0 && grpMatches.length === 0 && (
                          <div className="glass rounded-xl p-6 text-center text-black text-sm">Belum ada peserta di grup ini</div>
                        )}
                      </div>
                    );
                  })}
                  {entities.every(e => !e.groupName) && (
                    <div className="glass rounded-xl p-10 text-center text-black">Belum ada peserta yang ditempatkan ke grup</div>
                  )}
                </div>
              );
            })()}

            {/* RANKING — Time Trial */}
            {activeTab === "ranking" && competition.format === "TIME_TRIAL" && (() => {
              const cfg2 = competition.config ? JSON.parse(competition.config) : {};
              const sortOrder = cfg2.sortOrder || "DESC";
              const isTime = cfg2.scoreUnit === "waktu" || cfg2.sortOrder === "FASTEST" || cfg2.sortOrder === "ASC";
              const unitLabel = isTime ? "Waktu" : (cfg2.scoreUnit || "Nilai");

              type RankEntry = { name: string; score: number | null; timeResult?: string | null; section: string | null };
              const entries: RankEntry[] = [];
              for (const m of competition.matches) {
                for (const p of m.participants) {
                  entries.push({ name: p.team?.name || p.participant?.name || "?", score: p.score, timeResult: p.timeResult, section: p.team ? null : (p.participant as any)?.section });
                }
              }
              const sorted = entries.sort((a, b) => {
                if (a.score === null) return 1; if (b.score === null) return -1;
                return sortOrder === "DESC" ? b.score - a.score : a.score - b.score;
              });
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div className="glass rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="text-center px-4 py-3 text-black text-xs font-semibold uppercase w-16">Rank</th>
                      <th className="text-left px-4 py-3 text-black text-xs font-semibold uppercase">Peserta</th>
                      <th className="text-center px-4 py-3 text-indigo-400 text-xs font-semibold uppercase">{unitLabel}</th>
                    </tr></thead>
                    <tbody>
                      {sorted.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-black">Belum ada hasil</td></tr>}
                      {sorted.map((e, i) => (
                        <tr key={i} className={`border-b border-white/[0.04] ${ i < 3 ? "bg-white/[0.02]" : ""}`}>
                          <td className="text-center px-4 py-3">{medals[i] || <span className="text-black text-sm">#{i+1}</span>}</td>
                          <td className="px-4 py-3 text-black font-medium text-sm">{e.name}{e.section && <span className="text-xs text-black ml-2">({e.section})</span>}</td>
                          <td className="text-center px-4 py-3 text-indigo-400 font-black stat-number">{e.score !== null ? (isTime ? (e.timeResult || msToTimeStr(e.score)) : e.score) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* INFO */}
            {activeTab === "info" && (
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
