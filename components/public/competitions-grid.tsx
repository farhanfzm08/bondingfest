"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Users, Swords, Trophy } from "lucide-react";
import { cn, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Competition {
  id: string; name: string; slug: string; description: string|null; logoUrl: string|null; status: string; type: string; category: string|null;
  _count: { teams: number; compParticipants: number; matches: number };
  champions: Array<{ position:number; section:string|null; team:{name:string}|null; participant:{name:string}|null; }>;
}
const catIcons: Record<string,string> = { Olahraga:"⚽", Esports:"🎮", Akademik:"📚", Seni:"🎨", "Seni Budaya":"🎭", Kuliner:"🍳", Kreatif:"📷", Kreativitas:"🎭" };
const catColors: Record<string,string> = { Olahraga:"#0891B2", Esports:"#8B5CF6", Akademik:"#F59E0B", Seni:"#EC4899", Kreativitas:"#10B981", Kuliner:"#F97316" };

export default function CompetitionsGrid({ competitions }: { competitions: Competition[] }) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="flex items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-3 rounded-full border-[2.5px] border-[#1C1917] bg-[#ECFEFF] shadow-[3px_3px_0_#0891B2] font-black text-sm text-[#0E7490]">
              <Swords className="w-3.5 h-3.5"/> Semua Lomba
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1C1917]">Cabang <span className="text-[#0891B2]">Perlombaan</span></h2>
          </div>
          <Link href="/lomba" className="hidden sm:flex items-center gap-2 text-[#0891B2] hover:text-[#0E7490] text-sm font-black transition-colors group">
            Lihat Semua <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {competitions.map((comp, i) => {
            const champion = comp.champions[0];
            const color = catColors[comp.category||""] || "#1C1917";
            return (
              <motion.div key={comp.id} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.07}}>
                <Link href={`/lomba/${comp.slug}`}
                  className="flex flex-col h-full rounded-[6px] border-[2.5px] border-[#1C1917] bg-white overflow-hidden hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#1C1917] transition-all duration-100 group"
                  style={{ boxShadow:`4px 4px 0 ${color}` }}>
                  {/* Card header */}
                  <div className="h-20 flex items-center justify-between px-4 py-3" style={{ background:`${color}18` }}>
                    <span className="text-3xl">{catIcons[comp.category||""]||"🏆"}</span>
                    <span className={cn("text-xs px-2.5 py-1 rounded-full border font-bold", getStatusColor(comp.status))}>
                      {getStatusLabel(comp.status)}
                    </span>
                  </div>
                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-[#1C1917] font-black text-sm mb-1 group-hover:text-[#0891B2] transition-colors">{comp.name}</h3>
                    {comp.category && <p className="text-black text-xs mb-3 font-semibold">{comp.category}</p>}
                    <div className="flex items-center gap-3 text-xs text-black font-semibold mb-3">
                      <div className="flex items-center gap-1"><Users className="w-3 h-3"/>{comp.type==="TEAM"?comp._count.teams+" tim":comp._count.compParticipants+" peserta"}</div>
                      <div className="flex items-center gap-1"><Swords className="w-3 h-3"/>{comp._count.matches} match</div>
                    </div>
                    {champion && (
                      <div className="border-t-2 border-[#E7E5E4] pt-2 mt-auto flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-[#F59E0B]"/>
                        <span className="text-xs text-black font-bold truncate">{champion.team?.name||champion.participant?.name||champion.section}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[#0891B2] text-xs font-black mt-3">Lihat Detail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/></div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{opacity:0}} whileInView={{opacity:1}} className="text-center mt-8 sm:hidden">
          <Link href="/lomba" className="btn-neon text-sm px-6 py-2.5">Lihat Semua Lomba</Link>
        </motion.div>
      </div>
    </section>
  );
}
