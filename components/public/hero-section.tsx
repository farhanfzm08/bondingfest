"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Trophy, Calendar, MapPin, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EventData {
  name: string; description: string|null;
  startDate: Date | string; endDate: Date | string;
  location: string|null; status: string;
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [t, setT] = useState({ days:0, hours:0, minutes:0, seconds:0 });
  useEffect(() => {
    const calc = () => {
      const d = targetDate.getTime() - Date.now();
      if(d>0) setT({ days:Math.floor(d/86400000), hours:Math.floor((d%86400000)/3600000), minutes:Math.floor((d%3600000)/60000), seconds:Math.floor((d%60000)/1000) });
      else setT({ days:0, hours:0, minutes:0, seconds:0 });
    };
    calc();
    const id = setInterval(calc,1000);
    return ()=>clearInterval(id);
  }, [targetDate]);
  const units = [{ label:"Hari", value:t.days },{ label:"Jam", value:t.hours },{ label:"Menit", value:t.minutes },{ label:"Detik", value:t.seconds }];
  return (
    <div className="flex items-center gap-3">
      {units.map((u,i)=>(
        <div key={u.label} className="flex items-center gap-3">
          <div className="rounded-[6px] border-[3px] border-[#1C1917] bg-white p-3 text-center min-w-[70px] shadow-[4px_4px_0_#0891B2]">
            <div className="stat-number text-2xl sm:text-3xl font-black text-[#1C1917] tabular-nums">{String(u.value).padStart(2,"0")}</div>
            <div className="text-xs text-black font-bold mt-1">{u.label}</div>
          </div>
          {i<units.length-1 && <span className="text-[#1C1917] text-2xl font-black">:</span>}
        </div>
      ))}
    </div>
  );
}

export default function HeroSection({ event }: { event: EventData }) {
  const isUpcoming = event.status==="UPCOMING";
  const startDate = new Date(event.startDate);
  const statusConfig: Record<string,{label:string;bg:string;color:string}> = {
    UPCOMING: { label:"Event Akan Datang", bg:"#FFFBEB", color:"#92400E" },
    ONGOING:  { label:"Event Sedang Berlangsung", bg:"#ECFDF5", color:"#065F46" },
    COMPLETED:{ label:"Event Telah Selesai", bg:"#EFF6FF", color:"#1E40AF" },
  };
  const sc = statusConfig[event.status]||statusConfig.UPCOMING;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-32 pb-20"
      style={{ background:"linear-gradient(135deg, #ECFEFF 0%, #FFFBEB 40%, #ECFDF5 100%)" }}>
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage:"radial-gradient(circle,#0891B2 1px,transparent 1px)", backgroundSize:"28px 28px" }}/>
      {/* Accent bars */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#0891B2]"/>
      <div className="absolute top-2 left-0 w-full h-1 bg-[#F97316]"/>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Status badge */}
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 border-[2.5px] border-[#1C1917] font-black text-sm"
          style={{ background:sc.bg, color:sc.color, boxShadow:"3px 3px 0 #1C1917" }}>
          <Zap className="w-3.5 h-3.5"/>{sc.label}
          {event.status==="ONGOING" && <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"/>}
        </motion.div>

        {/* Trophy */}
        <motion.div initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}} transition={{duration:0.7,type:"spring",bounce:0.4}} className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-[12px] border-[3px] border-[#1C1917] bg-[#0891B2] flex items-center justify-center shadow-[6px_6px_0_#1C1917] trophy-bounce">
            <Trophy className="w-12 h-12 text-white"/>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.2}}
          className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#1C1917] tracking-tight leading-tight mb-4">
          {event.name.split(" ").map((word,i,arr)=>(
            <span key={i} className={i===arr.length-1 ? "text-[#0891B2]" : ""}>{word} </span>
          ))}
        </motion.h1>

        {event.description && (
          <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.3}}
            className="text-black text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed font-semibold">
            {event.description}
          </motion.p>
        )}

        {/* Event info */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}
          className="flex flex-wrap justify-center gap-4 mb-10 text-sm text-black font-bold">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border-2 border-[#1C1917] bg-white shadow-[2px_2px_0_#1C1917]">
            <Calendar className="w-4 h-4 text-[#0891B2]"/>
            <span>{formatDate(event.startDate)} — {formatDate(event.endDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border-2 border-[#1C1917] bg-white shadow-[2px_2px_0_#1C1917]">
              <MapPin className="w-4 h-4 text-[#F97316]"/>
              <span>{event.location}</span>
            </div>
          )}
        </motion.div>

        {/* Countdown */}
        {isUpcoming && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}} className="flex flex-col items-center gap-4 mb-12">
            <p className="text-black text-sm font-black uppercase tracking-widest">Dimulai Dalam</p>
            <CountdownTimer targetDate={startDate}/>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.6}} className="flex flex-wrap justify-center gap-4">
          <Link href="/klasemen" className="btn-neon text-base px-8 py-3.5">🏆 Lihat Klasemen</Link>
          <Link href="/lomba" className="px-8 py-3.5 rounded-[6px] border-[2.5px] border-[#1C1917] text-[#1C1917] font-black text-base bg-white hover:bg-[#FFFBEB] shadow-[3px_3px_0_#1C1917] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">
            Semua Lomba →
          </Link>
        </motion.div>
      </div>

      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2}}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-black">
        <span className="text-xs uppercase tracking-widest font-bold">Scroll</span>
        <motion.div animate={{y:[0,6,0]}} transition={{repeat:Infinity,duration:1.5}}>
          <ChevronDown className="w-5 h-5"/>
        </motion.div>
      </motion.div>
    </section>
  );
}
