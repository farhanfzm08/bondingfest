"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Trophy, Users, Swords, ArrowRight } from "lucide-react";
import { cn, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Competition {
  id:string; name:string; slug:string; description:string|null; status:string; type:string; category:string|null;
  _count:{ teams:number; compParticipants:number; matches:number; champions:number };
  champions: Array<{ position:number; team:{name:string}|null; participant:{name:string}|null; section:string|null; }>;
}

const catIcons: Record<string,string> = { Olahraga:"⚽", Esports:"🎮", Akademik:"📚", Seni:"🎨", "Seni Budaya":"🎭", Kreativitas:"🎨", Kuliner:"🍳" };
const catColors: Record<string,string> = { Olahraga:"#0891B2", Esports:"#8B5CF6", Akademik:"#F59E0B", Seni:"#EC4899", Kreativitas:"#10B981", Kuliner:"#F97316" };
const statusFilters = ["Semua","UPCOMING","ONGOING","COMPLETED"];

export default function LombaListClient({ competitions }: { competitions:Competition[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeStatus, setActiveStatus] = useState("Semua");

  const uniqueCategories = Array.from(new Set(competitions.map(c => c.category).filter(Boolean))) as string[];
  const activeCategories = ["Semua", ...uniqueCategories];

  const filtered = competitions.filter(c=>{
    const ms = c.name.toLowerCase().includes(search.toLowerCase())||(c.description?.toLowerCase().includes(search.toLowerCase())??false);
    const mc = activeCategory==="Semua"||c.category===activeCategory;
    const mst = activeStatus==="Semua"||c.status===activeStatus;
    return ms&&mc&&mst;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 px-4" style={{background:"linear-gradient(135deg,#ECFEFF 0%,#FFFBEB 40%,#ECFDF5 100%)"}}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full border-[2.5px] border-[#1C1917] bg-[#ECFEFF] shadow-[3px_3px_0_#0891B2] font-black text-sm text-[#0E7490]">
            <Swords className="w-3.5 h-3.5 text-[#0891B2]"/> Perlombaan
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1C1917] mb-3">Semua <span className="text-[#0891B2]">Lomba</span></h1>
          <p className="text-black font-semibold">{competitions.length} cabang perlombaan tersedia</p>
        </motion.div>

        {/* Search & Filter */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black"/>
            <input type="text" placeholder="Cari lomba..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full border-[2.5px] border-[#1C1917] rounded-[6px] pl-11 pr-4 py-3 text-[#1C1917] placeholder:text-black font-semibold bg-white focus:outline-none focus:shadow-[3px_3px_0_#0891B2] transition-all"/>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCategories.map(cat=>(
              <button key={cat} onClick={()=>setActiveCategory(cat)}
                className={cn("px-4 py-1.5 rounded-[4px] border-2 text-xs font-black transition-all",
                  activeCategory===cat ? "bg-[#0891B2] text-white border-[#0891B2]" : "bg-white text-[#0891B2] border-[#D4D0CA] hover:border-[#0891B2]")}>
                {catIcons[cat]&&<span className="mr-1">{catIcons[cat]}</span>}{cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {statusFilters.map(s=>(
              <button key={s} onClick={()=>setActiveStatus(s)}
                className={cn("px-3 py-1 rounded-[4px] border-2 text-xs font-black transition-all",
                  activeStatus===s ? "bg-[#0891B2] text-white border-[#0891B2]" : "bg-white text-[#0891B2] border-[#D4D0CA] hover:border-[#0891B2]")}>
                {s==="Semua"?"Semua Status":getStatusLabel(s)}
              </button>
            ))}
          </div>
        </motion.div>

        <p className="text-black font-bold text-sm mb-6">{filtered.length} lomba ditemukan</p>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div key={`${activeCategory}-${activeStatus}-${search}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((comp,i)=>{
              const champion = comp.champions[0];
              const color = catColors[comp.category||""]||"#1C1917";
              return (
                <motion.div key={comp.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
                  <Link href={`/lomba/${comp.slug}`}
                    className="flex flex-col h-full rounded-[6px] border-[2.5px] border-[#1C1917] bg-white overflow-hidden hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#1C1917] transition-all duration-100 group"
                    style={{boxShadow:`4px 4px 0 ${color}`}}>
                    {/* Header */}
                    <div className="relative h-28 p-5" style={{background:`${color}18`}}>
                      <div className="flex items-start justify-between">
                        <span className="text-4xl">{catIcons[comp.category||""]||"🏆"}</span>
                        <span className={cn("text-xs px-2.5 py-1 rounded-full border font-bold", getStatusColor(comp.status))}>
                          {getStatusLabel(comp.status)}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="text-[#1C1917] font-black text-base mb-1 group-hover:text-[#0891B2] transition-colors">{comp.name}</h2>
                      <p className="text-black text-xs mb-4 line-clamp-2 font-semibold">{comp.description||"Lomba bergengsi BONDING FEST 2026"}</p>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          {label: comp.type==="TEAM"?"Tim":"Peserta", value: comp.type==="TEAM"?comp._count.teams:comp._count.compParticipants, icon:Users},
                          {label:"Match", value:comp._count.matches, icon:Swords},
                          {label:"Juara", value:comp._count.champions>0?"✅":"Belum", icon:Trophy},
                        ].map(({label,value,icon:Icon})=>(
                          <div key={label} className="rounded-[4px] border-2 border-[#E7E5E4] p-2 text-center bg-[#FFFDF5]">
                            <Icon className="w-3 h-3 text-[#0891B2] mx-auto mb-1"/>
                            <div className="text-[#1C1917] text-sm font-black">{value}</div>
                            <div className="text-black text-[10px] font-semibold">{label}</div>
                          </div>
                        ))}
                      </div>

                      {champion && (
                        <div className="flex items-center gap-2 border-t-2 border-[#E7E5E4] pt-3 mb-3 mt-auto">
                          <span className="text-[#F59E0B]">🥇</span>
                          <span className="text-black text-xs truncate font-bold">{champion.team?.name||champion.participant?.name||champion.section}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[#0891B2] text-xs font-black mt-auto">
                        Lihat Detail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filtered.length===0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-black font-bold">Tidak ada lomba yang sesuai filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
