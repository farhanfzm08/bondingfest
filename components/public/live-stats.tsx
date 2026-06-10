"use client";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Trophy, Users, Swords, Target } from "lucide-react";

interface Stats { competitions:number; participants:number; teams:number; matches:number; }

function AnimatedCounter({ value, duration=2 }: { value:number; duration?:number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once:true });
  useEffect(()=>{
    if(!inView) return;
    let start=0;
    const inc = value/(duration*60);
    const id = setInterval(()=>{ start+=inc; if(start>=value){setCount(value);clearInterval(id);}else{setCount(Math.floor(start));} },1000/60);
    return ()=>clearInterval(id);
  },[inView,value,duration]);
  return <span ref={ref}>{count.toLocaleString()}</span>;
}

const ITEMS = [
  { icon:Trophy, label:"Cabang Lomba",       key:"competitions"  as keyof Stats, color:"#0891B2", bg:"#ECFEFF" },
  { icon:Users,  label:"Total Peserta",      key:"participants"  as keyof Stats, color:"#10B981", bg:"#ECFDF5" },
  { icon:Target, label:"Total Tim",          key:"teams"         as keyof Stats, color:"#8B5CF6", bg:"#F5F3FF" },
  { icon:Swords, label:"Total Pertandingan", key:"matches"       as keyof Stats, color:"#F97316", bg:"#FFF7ED" },
];

export default function LiveStats({ stats }: { stats:Stats }) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5}} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full border-[2.5px] border-[#1C1917] bg-white shadow-[3px_3px_0_#1C1917] font-black text-sm text-[#1C1917]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"/>Live Statistics
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1C1917]">Event dalam <span className="text-[#0891B2]">Angka</span></h2>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ITEMS.map((item,i)=>(
            <motion.div key={item.key} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.4,delay:i*0.08}}
              className="p-6 text-center rounded-[6px] border-[2.5px] border-[#1C1917] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#1C1917] transition-all duration-100"
              style={{ background:item.bg, boxShadow:`4px 4px 0 ${item.color}` }}>
              <div className="w-12 h-12 rounded-[6px] border-[2.5px] border-[#1C1917] flex items-center justify-center mx-auto mb-4" style={{ background:item.color }}>
                <item.icon className="w-6 h-6 text-black"/>
              </div>
              <div className="stat-number text-4xl font-black text-[#1C1917] mb-1">
                <AnimatedCounter value={stats[item.key]}/><span className="text-black"></span>
              </div>
              <p className="text-black text-sm font-bold">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
