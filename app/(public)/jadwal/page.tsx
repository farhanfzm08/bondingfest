import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, Clock, Swords } from "lucide-react";
import { formatDate, formatTime, getStatusColor, getStatusLabel, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Jadwal Pertandingan",
  description: "Jadwal lengkap seluruh pertandingan BONDING FEST 2026",
};
export const dynamic = "force-dynamic";

export default async function JadwalPage() {
  const event = await prisma.event.findFirst();
  if (!event) return null;

  const matches = await prisma.match.findMany({
    where: { competition: { eventId: event.id } },
    orderBy: { scheduledAt: "asc" },
    include: {
      competition: { select: { name:true, slug:true } },
      participants: { include: { team:true, participant:true } },
    },
  });

  const grouped = matches.reduce((acc, match) => {
    const date = match.scheduledAt ? new Date(match.scheduledAt).toDateString() : "Tanggal TBD";
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full border-[2.5px] border-[#1C1917] bg-[#ECFDF5] shadow-[3px_3px_0_#10B981] font-black text-sm text-[#065F46]">
            <Calendar className="w-3.5 h-3.5 text-[#10B981]"/> Jadwal
          </div>
          <h1 className="text-4xl font-black text-[#1C1917] mb-3">
            Jadwal <span className="text-[#10B981]">Pertandingan</span>
          </h1>
          <p className="text-black font-semibold">{matches.length} pertandingan terjadwal</p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="neu-card p-16 text-center text-black">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30"/>
            <p className="font-bold">Belum ada jadwal</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateStr, dayMatches]) => (
            <div key={dateStr} className="mb-8">
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-[2.5px] flex-1 bg-[#E7E5E4]"/>
                <div className="px-4 py-1.5 rounded-full border-[2.5px] border-[#1C1917] bg-[#FFFBEB] shadow-[2px_2px_0_#1C1917]">
                  <span className="text-[#1C1917] text-xs font-black">
                    {dateStr==="Tanggal TBD" ? dateStr : formatDate(new Date(dateStr))}
                  </span>
                </div>
                <div className="h-[2.5px] flex-1 bg-[#E7E5E4]"/>
              </div>

              <div className="space-y-3">
                {dayMatches.map((match) => {
                  const p1 = match.participants[0];
                  const p2 = match.participants[1];
                  const isOngoing = match.status === "ONGOING";
                  const isCompleted = match.status === "COMPLETED";
                  return (
                    <div key={match.id} className={cn(
                      "p-4 rounded-[6px] border-[2.5px] border-[#1C1917] bg-white transition-all",
                      isOngoing ? "shadow-[4px_4px_0_#10B981]" : "shadow-[3px_3px_0_#D4D0CA]"
                    )}>
                      <div className="flex items-center gap-4">
                        {/* Time */}
                        <div className="text-center w-16 flex-shrink-0">
                          {match.scheduledAt ? (
                            <>
                              <div className="text-[#1C1917] font-black text-sm">{formatTime(match.scheduledAt)}</div>
                              <div className="text-black text-xs font-semibold">WIB</div>
                            </>
                          ) : (
                            <div className="text-black text-xs font-bold">TBD</div>
                          )}
                        </div>

                        <div className="w-px h-10 bg-[#E7E5E4]"/>

                        {/* Competition */}
                        <div className="w-24 flex-shrink-0 hidden sm:block">
                          <Link href={`/lomba/${match.competition.slug}`} className="text-[#0891B2] hover:text-[#0E7490] text-xs font-black transition-colors truncate block">
                            {match.competition.name}
                          </Link>
                          <div className="text-black text-xs mt-0.5 font-semibold">{match.round}</div>
                        </div>

                        {/* Match */}
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1 text-right text-[#1C1917] font-black text-sm truncate">
                            {p1?.team?.name||p1?.participant?.name||"TBD"}
                          </div>
                          <div className={cn(
                            "px-3 py-1.5 rounded-[6px] border-2 text-xs font-black min-w-[60px] text-center flex-shrink-0",
                            isOngoing ? "border-[#10B981] bg-[#ECFDF5] text-[#065F46]" :
                            isCompleted ? "border-[#0891B2] bg-[#ECFEFF] text-[#0E7490]" : "border-[#D4D0CA] text-black"
                          )}>
                            {isCompleted||isOngoing ? `${p1?.score??0}-${p2?.score??0}` : "vs"}
                          </div>
                          <div className="flex-1 text-[#1C1917] font-black text-sm truncate">
                            {p2?.team?.name||p2?.participant?.name||"TBD"}
                          </div>
                        </div>

                        {/* Status + Venue */}
                        <div className="hidden lg:flex flex-col items-end gap-1 w-28">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold border", getStatusColor(match.status))}>
                            {getStatusLabel(match.status)}
                          </span>
                          {match.venue && (
                            <div className="flex items-center gap-1 text-black text-xs font-semibold">
                              <MapPin className="w-2.5 h-2.5"/>
                              <span className="truncate">{match.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
