"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Megaphone, ArrowRight, Pin, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { formatDateTime, truncate, cn } from "@/lib/utils";

interface Announcement { id:string; title:string; content:string; type:string; priority:string; isPinned:boolean; publishedAt:Date | string; }

const typeConfig = {
  SUCCESS: { icon:CheckCircle, color:"text-[#065F46]",  bg:"bg-[#ECFDF5] border-[#10B981]" },
  WARNING: { icon:AlertTriangle,color:"text-[#92400E]", bg:"bg-[#FFFBEB] border-[#F59E0B]" },
  URGENT:  { icon:AlertTriangle,color:"text-[#991B1B]", bg:"bg-[#FEF2F2] border-[#EF4444]" },
  INFO:    { icon:Info,         color:"text-[#1E40AF]", bg:"bg-[#EFF6FF] border-[#3B82F6]" },
};

export default function AnnouncementsSection({ announcements }: { announcements:Announcement[] }) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="flex items-center justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-3 rounded-full border-[2.5px] border-[#1C1917] bg-[#FFF7ED] shadow-[3px_3px_0_#F97316] font-black text-sm text-[#9A3412]">
              <Megaphone className="w-3.5 h-3.5 text-[#F97316]"/> Terbaru
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1C1917]">Pengumuman <span className="text-[#F97316]">Terkini</span></h2>
          </div>
          <Link href="/pengumuman" className="hidden sm:flex items-center gap-2 text-[#0891B2] font-black text-sm hover:text-[#0E7490] transition-colors group">
            Semua <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
          </Link>
        </motion.div>

        <div className="space-y-3">
          {announcements.length===0 && (
            <div className="neu-card p-8 text-center text-black font-bold">Belum ada pengumuman</div>
          )}
          {announcements.map((ann, i) => {
            const config = typeConfig[ann.type as keyof typeof typeConfig]||typeConfig.INFO;
            const Icon = config.icon;
            return (
              <motion.div key={ann.id} initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.08}}>
                <Link href={`/pengumuman/${ann.id}`} className="block">
                  <div className={cn("p-5 rounded-[6px] border-[2.5px] border-[#1C1917] bg-white hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#1C1917] transition-all duration-100 group",
                    ann.isPinned ? "shadow-[3px_3px_0_#F97316]" : "shadow-[3px_3px_0_#D4D0CA]")}>
                    <div className="flex items-start gap-4">
                      <div className={cn("mt-0.5 p-2 rounded-[6px] border-2 flex-shrink-0", config.bg)}>
                        <Icon className={cn("w-4 h-4", config.color)}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {ann.isPinned && <Pin className="w-3 h-3 text-[#F97316] flex-shrink-0"/>}
                          <h3 className="text-[#1C1917] font-black text-sm group-hover:text-[#0891B2] transition-colors truncate">{ann.title}</h3>
                        </div>
                        <p className="text-black text-xs line-clamp-2 mb-2 font-semibold">{truncate(ann.content, 120)}</p>
                        <p className="text-black text-xs font-semibold">{formatDateTime(ann.publishedAt)}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#D4D0CA] group-hover:text-[#0891B2] group-hover:translate-x-1 transition-all flex-shrink-0"/>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
