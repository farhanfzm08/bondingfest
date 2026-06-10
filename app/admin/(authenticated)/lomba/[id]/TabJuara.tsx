"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { Competition } from "./page";

interface TeamOrPart { id:string; name:string; section?:string|null; isCollaboration?:boolean; sections?:string|null; sectionWeights?:string|null; }
interface Champion { id:string; position:number; section:string|null; teamId?:string|null; participantId?:string|null; team?:{name:string}|null; participant?:{name:string}|null; awardPoints:number; }

const POSITIONS = [
  { pos:1, emoji:"🥇", label:"Juara 1", bg:"#FFFBEB", border:"#F59E0B" },
  { pos:2, emoji:"🥈", label:"Juara 2", bg:"#F8FAFC", border:"#6B7280" },
  { pos:3, emoji:"🥉", label:"Juara 3", bg:"#FEF3C7", border:"#B45309" },
];

export default function TabJuara({ comp, onSaved }: { comp:Competition; onSaved:()=>void }) {
  const [registered, setRegistered] = useState<{ teams:any[]; individuals:any[] }>({ teams:[], individuals:[] });
  const [existing, setExisting] = useState<Champion[]>([]);
  const [selected, setSelected] = useState<Record<number,string>>({});
  const [sections, setSections] = useState<Record<string,string>>({}); // id->section for individual override
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const [rRes, cRes] = await Promise.all([
      fetch(`/api/competitions/${comp.id}/participants`),
      fetch(`/api/competitions/${comp.id}/champions`),
    ]);
    const reg = await rRes.json();
    setRegistered(reg);
    const champs: Champion[] = await cRes.json();
    setExisting(champs);
    // Pre-fill selections from existing
    const sel: Record<number,string> = {};
    for(const ch of champs) {
      sel[ch.position] = ch.teamId || ch.participantId || "";
    }
    setSelected(sel);
  }, [comp.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const participants: TeamOrPart[] = comp.type==="TEAM"||comp.type==="DUO"
    ? registered.teams.map((t:any) => ({ id:t.id, name:t.name, section:t.section, isCollaboration:t.isCollaboration, sections:t.sections, sectionWeights:t.sectionWeights }))
    : registered.individuals.map((r:any) => ({ id:r.participant.id, name:r.participant.name, section:r.participant.section }));

  const isTeam = comp.type==="TEAM"||comp.type==="DUO";

  const getPoinPreview = (pos: number, id: string) => {
    if(!id) return null;
    // Fetch event point system from API (simplified: use known values)
    const base: Record<number,number> = {1:100,2:70,3:40};
    const pts = base[pos] || 0;
    const p = participants.find(x=>x.id===id) as any;
    if(!p) return null;
    if(p.isCollaboration && p.sections) {
      const secs: string[] = JSON.parse(p.sections);
      const weights: Record<string,number> = p.sectionWeights ? JSON.parse(p.sectionWeights) : Object.fromEntries(secs.map((s:string)=>[s,100/secs.length]));
      return secs.map(s => `${s}: ${Math.round(pts*(weights[s]||0)/100)} poin`).join(" | ");
    }
    return `${p.section||"-"}: ${pts} poin`;
  };

  const handleSave = async () => {
    if(Object.keys(selected).length===0) { toast.error("Pilih minimal 1 juara"); return; }
    setSaving(true);
    try {
      const champions = Object.entries(selected)
        .filter(([,id])=>id)
        .map(([pos,id])=>{
          const p = participants.find(x=>x.id===id) as any;
          return {
            position: Number(pos),
            ...(isTeam ? { teamId:id } : { participantId:id, section:p?.section||null }),
          };
        });

      const r = await fetch(`/api/competitions/${comp.id}/champions`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ champions }),
      });
      if(!r.ok) throw new Error();
      toast.success("🏆 Juara ditetapkan! Klasemen diperbarui otomatis.");
      onSaved();
      fetchData();
    } catch { toast.error("Gagal menetapkan juara"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Existing champions */}
      {existing.length>0 && (
        <div className="neu-card-seafoam p-5">
          <h3 className="font-black text-[#1C1917] mb-3">✅ Juara Saat Ini</h3>
          <div className="space-y-2">
            {existing.map(ch=>(
              <div key={ch.id} className="flex items-center gap-3">
                <span className="text-xl">{ch.position===1?"🥇":ch.position===2?"🥈":"🥉"}</span>
                <span className="font-black text-[#1C1917] text-sm">{ch.team?.name||ch.participant?.name}</span>
                <span className="text-xs text-black font-semibold">{ch.section||"-"}</span>
                <span className="ml-auto text-xs font-black text-[#0891B2]">{ch.awardPoints} poin</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="neu-card p-5">
        <h3 className="font-black text-[#1C1917] mb-4 border-b-2 border-[#E7E5E4] pb-2">
          🏆 Tetapkan Juara
        </h3>
        <p className="text-black text-xs font-semibold mb-4">
          Pilih pemenang untuk tiap posisi. Klasemen juara umum akan diperbarui otomatis setelah disimpan.
        </p>

        <div className="space-y-4">
          {POSITIONS.map(({ pos, emoji, label, bg, border }) => {
            const selId = selected[pos]||"";
            const preview = getPoinPreview(pos, selId);
            return (
              <div key={pos} className="p-4 rounded-[6px] border-[2.5px] border-[#1C1917]"
                style={{ background:bg, boxShadow:`3px 3px 0 ${border}` }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{emoji}</span>
                  <span className="font-black text-[#1C1917]">{label}</span>
                </div>
                <select value={selId}
                  onChange={e=>setSelected({...selected,[pos]:e.target.value})}
                  className="neu-input">
                  <option value="">-- Belum Ditentukan --</option>
                  {participants.map(p=>(
                    <option key={p.id} value={p.id}>{p.name} {p.section?`(${p.section})`:""}</option>
                  ))}
                </select>
                {preview && (
                  <p className="text-xs mt-2 font-black text-[#0891B2] bg-white rounded px-2 py-1 border border-[#0891B2]">
                    💰 {preview}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t-2 border-[#E7E5E4]">
          <button onClick={handleSave} disabled={saving}
            className="btn-neon px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
            <Trophy className="w-4 h-4"/>
            {saving?"Menyimpan...":"Tetapkan & Perbarui Klasemen"}
          </button>
          <p className="text-black text-xs mt-2">* Menetapkan juara akan mengubah status lomba menjadi Selesai</p>
        </div>
      </div>

      {participants.length===0 && (
        <div className="p-8 text-center text-black">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30"/>
          <p className="font-bold text-sm">Daftarkan peserta di tab "Peserta & Tim" terlebih dahulu</p>
        </div>
      )}
    </div>
  );
}
