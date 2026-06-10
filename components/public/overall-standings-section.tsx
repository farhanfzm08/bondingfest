"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, ArrowRight, TrendingUp } from "lucide-react";
import { getMedalEmoji } from "@/lib/utils";

interface Standing {
  id:string; section?:string; institution?:string;
  totalPoints:number; goldCount:number; silverCount:number; bronzeCount:number; rank:number;
}

export default function OverallStandingsSection({ standings }: { standings:Standing[] }) {
  if(standings.length===0) return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-black text-[#1C1917] mb-4">Klasemen Juara Umum</h2>
        <p className="text-black font-semibold">Belum ada data klasemen.</p>
      </div>
    </section>
  );

  const getSectionName = (s:Standing) => s.section || s.institution || "-";
  const topThree = standings.slice(0,3);
  const rest = standings.slice(3);
  const podiumOrder = [topThree[1],topThree[0],topThree[2]];
  const podiumHeight = ["h-48","h-64","h-44"];
  const podiumColor = ["#6B7280","#F59E0B","#B45309"];
  const podiumBg = ["#F8FAFC","#FFFBEB","#FEF3C7"];
  const podiumRank = [2,1,3];

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="flex items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-3 rounded-full border-[2.5px] border-[#1C1917] bg-[#FFFBEB] shadow-[3px_3px_0_#F59E0B] font-black text-sm text-[#92400E]">
              <Trophy className="w-3.5 h-3.5 text-[#F59E0B]"/> Klasemen Utama
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1C1917]">Juara <span className="text-[#F59E0B]">Umum</span></h2>
          </div>
          <Link href="/klasemen" className="hidden sm:flex items-center gap-2 text-[#0891B2] hover:text-[#0E7490] text-sm font-black transition-colors group">
            Lihat Semua <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
          </Link>
        </motion.div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-4 mb-6 items-end">
          {podiumOrder.map((standing,i)=>{
            if(!standing) return <div key={i}/>;
            const rank = podiumRank[i];
            return (
              <motion.div key={standing.id} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                className={`relative rounded-[6px] border-[3px] border-[#1C1917] text-center flex flex-col items-center pb-4 px-2 ${podiumHeight[i]}`}
                style={{ background:podiumBg[i], boxShadow:`4px 4px 0 ${podiumColor[i]}` }}>
                <div className="absolute top-2 right-2 w-7 h-7 rounded-[4px] border-2 border-[#1C1917] flex items-center justify-center text-black text-xs font-black"
                  style={{ background:podiumColor[i] }}>{rank}</div>
                <div className="text-4xl mt-5 mb-auto">{getMedalEmoji(rank)}</div>
                <div className="text-[#1C1917] font-black text-xs sm:text-sm leading-tight mb-1 line-clamp-2 px-1">{getSectionName(standing)}</div>
                <div className="text-2xl sm:text-3xl font-black stat-number leading-none text-[#1C1917]">{standing.totalPoints}</div>
                <div className="text-black text-[10px] font-bold uppercase tracking-wider mb-1">poin</div>
                <div className="flex gap-2 mt-1 text-xs font-black bg-white/50 px-2 py-1 rounded-full border border-[#1C1917]/10">
                  <span className="text-[#F59E0B] flex items-center gap-0.5">🥇 {standing.goldCount}</span>
                  <span className="text-[#6B7280] flex items-center gap-0.5">🥈 {standing.silverCount}</span>
                  <span className="text-[#B45309] flex items-center gap-0.5">🥉 {standing.bronzeCount}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rest */}
        {rest.length>0 && (
          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="neu-card overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-[#FFFBEB] border-b-[2px] border-[#E7E5E4]">
                <th className="text-left px-5 py-3 text-[#1C1917] text-xs font-black uppercase">Rank</th>
                <th className="text-left px-5 py-3 text-[#1C1917] text-xs font-black uppercase">Seksi</th>
                <th className="text-center px-3 py-3 text-[#1C1917] text-xs font-black">🥇</th>
                <th className="text-center px-3 py-3 text-[#1C1917] text-xs font-black hidden sm:table-cell">🥈</th>
                <th className="text-center px-3 py-3 text-[#1C1917] text-xs font-black hidden sm:table-cell">🥉</th>
                <th className="text-right px-5 py-3 text-[#1C1917] text-xs font-black uppercase">Poin</th>
              </tr></thead>
              <tbody>
                {rest.map((s,i)=>(
                  <motion.tr key={s.id} initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.05}}
                    className="border-b-[2px] border-[#E7E5E4] hover:bg-[#FFFBEB] transition-colors">
                    <td className="px-5 py-3"><span className="text-black font-black text-sm">#{s.rank}</span></td>
                    <td className="px-5 py-3"><span className="text-[#1C1917] font-bold text-sm">{getSectionName(s)}</span></td>
                    <td className="px-3 py-3 text-center text-[#F59E0B] font-black">{s.goldCount}</td>
                    <td className="px-3 py-3 text-center text-[#6B7280] font-black hidden sm:table-cell">{s.silverCount}</td>
                    <td className="px-3 py-3 text-center text-[#B45309] font-black hidden sm:table-cell">{s.bronzeCount}</td>
                    <td className="px-5 py-3 text-right"><span className="text-[#0891B2] font-black stat-number">{s.totalPoints}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        <motion.div initial={{opacity:0}} whileInView={{opacity:1}} className="text-center mt-6">
          <Link href="/klasemen" className="inline-flex items-center gap-2 text-[#0891B2] hover:text-[#0E7490] text-sm font-black transition-colors">
            <TrendingUp className="w-4 h-4"/> Lihat Klasemen Lengkap & Grafik
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
