import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Pin, AlertTriangle, CheckCircle, Info, ArrowRight } from "lucide-react";
import { formatDateTime, truncate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pengumuman",
  description: "Semua pengumuman dan informasi BONDING FEST 2026",
};
export const dynamic = "force-dynamic";

const typeConfig = {
  SUCCESS: { icon:CheckCircle,  color:"text-[#065F46]",  bg:"bg-[#ECFDF5] border-[#10B981]",  shadow:"#10B981" },
  WARNING: { icon:AlertTriangle, color:"text-[#92400E]", bg:"bg-[#FFFBEB] border-[#F59E0B]",  shadow:"#F59E0B" },
  URGENT:  { icon:AlertTriangle, color:"text-[#991B1B]", bg:"bg-[#FEF2F2] border-[#EF4444]",  shadow:"#EF4444" },
  INFO:    { icon:Info,          color:"text-[#1E40AF]", bg:"bg-[#EFF6FF] border-[#3B82F6]",  shadow:"#3B82F6" },
};

export default async function PengumumanPage() {
  const event = await prisma.event.findFirst();
  if (!event) return null;

  const announcements = await prisma.announcement.findMany({
    where: {
      eventId: event.id, isPublished: true,
      OR: [{ expiresAt:null }, { expiresAt:{ gt:new Date() } }],
    },
    orderBy: [{ isPinned:"desc" }, { priority:"desc" }, { publishedAt:"desc" }],
    include: { competition:{ select:{ name:true, slug:true } } },
  });

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full border-[2.5px] border-[#1C1917] bg-[#FFF7ED] shadow-[3px_3px_0_#F97316] font-black text-sm text-[#9A3412]">
            <Megaphone className="w-3.5 h-3.5 text-[#F97316]"/> Informasi
          </div>
          <h1 className="text-4xl font-black text-[#1C1917] mb-3">
            Pengumuman <span className="text-[#F97316]">Terkini</span>
          </h1>
          <p className="text-black font-semibold">{announcements.length} pengumuman aktif</p>
        </div>

        {announcements.length===0 ? (
          <div className="neu-card p-16 text-center text-black">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30"/>
            <p className="font-bold">Belum ada pengumuman</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => {
              const config = typeConfig[ann.type as keyof typeof typeConfig]||typeConfig.INFO;
              const Icon = config.icon;
              return (
                <Link key={ann.id} href={`/pengumuman/${ann.id}`} className="block group">
                  <div className={cn("p-6 rounded-[6px] border-[2.5px] border-[#1C1917] bg-white hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#1C1917] transition-all duration-100",
                    ann.isPinned ? "shadow-[4px_4px_0_#F97316]" : "shadow-[3px_3px_0_#D4D0CA]")}>
                    <div className="flex gap-4">
                      <div className={cn("p-3 rounded-[6px] border-2 flex-shrink-0 self-start", config.bg)}>
                        <Icon className={cn("w-5 h-5", config.color)}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {ann.isPinned && <Pin className="w-3.5 h-3.5 text-[#F97316]"/>}
                          {ann.competition && (
                            <span className="text-xs px-2 py-0.5 rounded-full border-2 border-[#0891B2] bg-[#ECFEFF] text-[#0E7490] font-black">
                              {ann.competition.name}
                            </span>
                          )}
                          <span className="text-black text-xs font-semibold">{formatDateTime(ann.publishedAt)}</span>
                        </div>
                        <h2 className="text-[#1C1917] font-black text-base group-hover:text-[#0891B2] transition-colors mb-2">{ann.title}</h2>
                        <p className="text-black text-sm leading-relaxed font-semibold">{truncate(ann.content, 200)}</p>
                        <div className="flex items-center gap-1 text-[#0891B2] text-xs font-black mt-3">
                          Baca Selengkapnya <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
