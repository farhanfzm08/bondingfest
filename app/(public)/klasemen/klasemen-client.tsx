"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Trophy, BarChart2, List, TrendingUp } from "lucide-react";
import { getMedalEmoji, cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Standing { id:string; section:string; totalPoints:number; goldCount:number; silverCount:number; bronzeCount:number; rank:number; }
interface Competition {
  id:string; name:string; status:string;
  champions: Array<{ position:number; section:string|null; team:{name:string}|null; participant:{name:string}|null; }>;
}
interface PointSystem { first:number; second:number; third:number; }

const COLORS = ["#F59E0B","#6B7280","#B45309","#0891B2","#8B5CF6","#10B981","#F97316","#EC4899"];
const podiumColors = ["#6B7280","#F59E0B","#B45309"];
const podiumBg = ["#F8FAFC","#FFFBEB","#FEF3C7"];
const podiumHeights = ["h-48","h-64","h-44"];

export default function KlasemenClient({ standings, competitions, pointSystem }: { standings:Standing[]; competitions:Competition[]; pointSystem:PointSystem; }) {
  const [view, setView] = useState<"table"|"chart">("table");
  const shortSec = (sec:string) => (sec||"").replace("Seksi ","").split(" ").slice(0,2).join(" ");

  const chartData = standings.slice(0,10).map(s=>({
    name: shortSec(s.section), fullName: s.section,
    poin: s.totalPoints, emas: s.goldCount, perak: s.silverCount, perunggu: s.bronzeCount,
  }));

  const podiumOrder = [standings[1], standings[0], standings[2]];
  const podiumRank = [2,1,3];

  return (
    <div className="min-h-screen pt-24" style={{ background:"linear-gradient(135deg,#ECFEFF 0%,#FFFBEB 40%,#ECFDF5 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Header */}
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full border-[2.5px] border-[#1C1917] bg-[#FFFBEB] shadow-[3px_3px_0_#F59E0B] font-black text-sm text-[#92400E]">
            <Trophy className="w-4 h-4 text-[#F59E0B]"/> Klasemen Resmi
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1C1917] mb-4">
            🏆 Juara <span className="text-[#F59E0B]">Umum</span>
          </h1>
          <p className="text-black font-semibold max-w-xl mx-auto">
            Akumulasi poin dari seluruh cabang perlombaan. Juara 1 = {pointSystem.first} poin, Juara 2 = {pointSystem.second} poin, Juara 3 = {pointSystem.third} poin.
          </p>
        </motion.div>

        {/* View toggle */}
        <div className="flex justify-center gap-2 mb-8">
          {[{key:"table",icon:List,label:"Tabel"},{key:"chart",icon:BarChart2,label:"Grafik"}].map(({key,icon:Icon,label})=>(
            <button key={key} onClick={()=>setView(key as "table"|"chart")}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-[6px] border-[2.5px] text-sm font-black transition-all",
                view===key ? "bg-[#0891B2] text-white border-[#0891B2] shadow-[3px_3px_0_#F59E0B]" : "bg-white text-[#0891B2] border-[#D4D0CA] hover:border-[#0891B2]")}>
              <Icon className="w-4 h-4"/>{label}
            </button>
          ))}
        </div>

        {/* Podium Top 3 */}
        {standings.length >= 3 && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="grid grid-cols-3 gap-4 mb-8 items-end max-w-2xl mx-auto">
            {podiumOrder.map((s,i)=>{
              if(!s) return <div key={i}/>;
              const rank = podiumRank[i];
              return (
                <div key={s.id}
                  className={cn("relative rounded-[6px] border-[3px] border-[#1C1917] flex flex-col items-center pb-4 px-2 text-center", podiumHeights[i])}
                  style={{ background:podiumBg[i], boxShadow:`4px 4px 0 ${podiumColors[i]}` }}>
                  <div className="text-4xl mt-4 mb-auto">{getMedalEmoji(rank)}</div>
                  <div className="text-[#1C1917] font-black text-xs sm:text-sm leading-tight mb-1 line-clamp-2 px-1">{shortSec(s.section)}</div>
                  <div className={cn("text-2xl sm:text-3xl font-black stat-number leading-none", rank===1?"text-[#F59E0B]":"text-[#1C1917]")}>{s.totalPoints}</div>
                  <div className="text-black text-[10px] font-bold uppercase tracking-wider mb-1">poin</div>
                  <div className="flex gap-2 mt-1 text-xs font-black bg-white/50 px-2 py-1 rounded-full border border-[#1C1917]/10">
                    <span className="text-[#F59E0B] flex items-center gap-0.5">🥇 {s.goldCount}</span>
                    <span className="text-[#6B7280] flex items-center gap-0.5">🥈 {s.silverCount}</span>
                    <span className="text-[#B45309] flex items-center gap-0.5">🥉 {s.bronzeCount}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Table View */}
        {view==="table" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="neu-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[2px] border-[#E7E5E4] bg-[#FFFBEB]">
                    <th className="text-left px-6 py-4 text-[#1C1917] text-xs font-black uppercase tracking-wider w-16">Rank</th>
                    <th className="text-left px-6 py-4 text-[#1C1917] text-xs font-black uppercase tracking-wider">Seksi</th>
                    <th className="text-center px-4 py-4 text-[#1C1917] text-xs font-black uppercase">🥇 Emas</th>
                    <th className="text-center px-4 py-4 text-[#1C1917] text-xs font-black uppercase hidden sm:table-cell">🥈 Perak</th>
                    <th className="text-center px-4 py-4 text-[#1C1917] text-xs font-black uppercase hidden sm:table-cell">🥉 Perunggu</th>
                    <th className="text-right px-6 py-4 text-[#1C1917] text-xs font-black uppercase tracking-wider">Total Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s,i)=>(
                    <motion.tr key={s.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                      className={cn("border-b-[2px] border-[#E7E5E4] hover:bg-[#FFFBEB] transition-colors", s.rank<=3?"bg-[#FFFBEB]/50":"")}>
                      <td className="px-6 py-4">
                        {s.rank<=3 ? <span className="text-xl">{getMedalEmoji(s.rank)}</span>
                          : <span className="text-black font-black text-sm">#{s.rank}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("font-black text-sm", s.rank===1?"text-[#F59E0B]":s.rank<=3?"text-[#1C1917]":"text-[#1C1917]")}>{s.section}</span>
                      </td>
                      <td className="px-4 py-4 text-center"><span className="text-[#F59E0B] font-black">{s.goldCount}</span></td>
                      <td className="px-4 py-4 text-center hidden sm:table-cell"><span className="text-[#6B7280] font-black">{s.silverCount}</span></td>
                      <td className="px-4 py-4 text-center hidden sm:table-cell"><span className="text-[#B45309] font-black">{s.bronzeCount}</span></td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn("text-lg font-black stat-number", s.rank===1?"text-[#F59E0B]":"text-[#0891B2]")}>{s.totalPoints}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Chart View */}
        {view==="chart" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="neu-card p-6">
            <h3 className="text-[#1C1917] font-black mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0891B2]"/> Distribusi Poin per Seksi
            </h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={chartData} margin={{top:5,right:20,left:0,bottom:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4"/>
                <XAxis dataKey="name" tick={{fill:"#78716C",fontSize:12}} angle={-45} textAnchor="end" interval={0}/>
                <YAxis tick={{fill:"#78716C",fontSize:12}}/>
                <Tooltip contentStyle={{ background:"#FFFDF5", border:"2.5px solid #1C1917", borderRadius:"6px", color:"#1C1917", fontWeight:"bold" }}
                  formatter={(val,name)=>[val, name==="poin"?"Total Poin":name]}
                  labelFormatter={(label,payload)=>payload?.[0]?.payload?.fullName||label}/>
                <Bar dataKey="poin" radius={[4,4,0,0]}>
                  {chartData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Per-Competition Champions */}
        <div className="mt-16">
          <h2 className="text-2xl font-black text-[#1C1917] mb-6">🏅 Juara Per Cabang</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {competitions.filter(c=>c.champions.length>0).map((comp,i)=>(
              <motion.div key={comp.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
                className="neu-card p-5">
                <h3 className="text-[#1C1917] font-black mb-3 text-sm">{comp.name}</h3>
                <div className="space-y-2">
                  {comp.champions.map(champ=>(
                    <div key={champ.position} className="flex items-center gap-3">
                      <span className="text-lg w-6">{getMedalEmoji(champ.position)}</span>
                      <span className="text-[#1C1917] font-bold text-sm">{champ.team?.name||champ.participant?.name||champ.section||"-"}</span>
                      {champ.section&&champ.team&&<span className="text-black text-xs ml-auto font-semibold">{champ.section}</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
