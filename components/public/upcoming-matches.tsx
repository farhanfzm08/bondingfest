"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight, Swords } from "lucide-react";
import { formatDateTime, formatTime, getStatusColor, getStatusLabel, cn } from "@/lib/utils";

interface MatchParticipant { score:number; result:string|null; team:{name:string}|null; participant:{name:string}|null; }
interface Match { id:string; name:string; round:string|null; scheduledAt:Date|string|null; venue:string|null; status:string; competition:{name:string;slug:string}; participants:MatchParticipant[]; }

export default function UpcomingMatches({ matches }: { matches:Match[] }) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="flex items-center justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-3 rounded-full border-[2.5px] border-[#1C1917] bg-[#ECFDF5] shadow-[3px_3px_0_#10B981] font-black text-sm text-[#065F46]">
              <Calendar className="w-3.5 h-3.5 text-[#10B981]"/> Jadwal
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1C1917]">Pertandingan <span className="text-[#10B981]">Terdekat</span></h2>
          </div>
          <Link href="/jadwal" className="hidden sm:flex items-center gap-2 text-[#0891B2] hover:text-[#0E7490] text-sm font-black transition-colors group">
            Jadwal Lengkap <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
          </Link>
        </motion.div>

        {matches.length === 0 ? (
          <div className="neu-card p-10 text-center text-black font-bold">Tidak ada pertandingan yang dijadwalkan</div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, i) => {
              const p1 = match.participants[0];
              const p2 = match.participants[1];
              const isOngoing = match.status === "ONGOING";
              return (
                <motion.div key={match.id} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08}}
                  className={cn("p-4 sm:p-5 rounded-[6px] border-[2.5px] border-[#1C1917] bg-white transition-all",
                    isOngoing ? "shadow-[4px_4px_0_#10B981]" : "shadow-[3px_3px_0_#D4D0CA]")}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Competition & Status */}
                    <div className="flex items-center gap-3 sm:w-44 flex-shrink-0">
                      <div className="w-8 h-8 rounded-[6px] border-2 border-[#1C1917] bg-[#ECFEFF] flex items-center justify-center">
                        <Swords className="w-4 h-4 text-[#0891B2]"/>
                      </div>
                      <div>
                        <Link href={`/lomba/${match.competition.slug}`} className="text-[#1C1917] font-black text-xs hover:text-[#0891B2] transition-colors">{match.competition.name}</Link>
                        <p className="text-black text-xs font-semibold">{match.round}</p>
                      </div>
                    </div>

                    {/* Matchup */}
                    <div className="flex items-center gap-3 flex-1 justify-center">
                      <div className="text-right flex-1">
                        <span className="text-[#1C1917] font-black text-sm">{p1?.team?.name||p1?.participant?.name||"TBD"}</span>
                      </div>
                      <div className={cn("px-3 py-1.5 rounded-[6px] border-2 text-xs font-black min-w-[60px] text-center",
                        isOngoing ? "border-[#10B981] bg-[#ECFDF5] text-[#065F46]" : "border-[#D4D0CA] text-black bg-[#F5F5F4]")}>
                        {isOngoing && p1 && p2 ? `${p1.score} - ${p2.score}` : "VS"}
                      </div>
                      <div className="text-left flex-1">
                        <span className="text-[#1C1917] font-black text-sm">{p2?.team?.name||p2?.participant?.name||"TBD"}</span>
                      </div>
                    </div>

                    {/* Date & Venue */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 sm:w-36">
                      {match.scheduledAt && (
                        <div className="flex items-center gap-1 text-black text-xs font-semibold">
                          <Clock className="w-3 h-3"/><span>{formatTime(match.scheduledAt)}</span>
                        </div>
                      )}
                      {match.venue && (
                        <div className="flex items-center gap-1 text-black text-xs font-semibold">
                          <MapPin className="w-3 h-3"/><span className="truncate max-w-[120px]">{match.venue}</span>
                        </div>
                      )}
                      {isOngoing && (
                        <div className="flex items-center gap-1">
                          <span className="pulse-dot"/><span className="text-[#10B981] text-xs font-black">LIVE</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
