"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Timer } from "lucide-react";
import { Competition } from "../page";
import { Match, TeamOrPart } from "../TabBracket";

export default function TimeTrialView({ comp, matches: initMatches, teams: initTeams, onRefresh }: { comp:Competition; matches:Match[]; teams:TeamOrPart[]; onRefresh:()=>void }) {
  const cfg = comp.config ? JSON.parse(comp.config) : {};
  const unit: string = cfg.scoreUnit || "nilai";
  const sortOrder: string = cfg.sortOrder || "DESC";
  const isTeam = comp.type==="TEAM"||comp.type==="DUO";

  // Optimistic local state
  const [localMatches, setLocalMatches] = useState<Match[]>(initMatches);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Build ranking from local matches
  type Entry = { name:string; score:number|null; timeResult:string|null; matchId:string; partId:string; section?:string|null };
  const entries: Entry[] = [];
  for (const m of localMatches) {
    for (const p of m.participants) {
      const name = p.team?.name||p.participant?.name||"?";
      const section = p.team?.section||p.participant?.section||null;
      entries.push({ name, score:p.score, timeResult:p.timeResult, matchId:m.id, partId:p.id, section });
    }
  }

  const ranked = [...entries].sort((a,b)=>{
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return sortOrder==="DESC" ? b.score-a.score : a.score-b.score;
  });

  // Registered IDs to filter "Add" list
  const registeredIds = new Set<string>();
  for(const m of localMatches) for(const p of m.participants) {
    const id=p.teamId||p.participantId||""; if(id) registeredIds.add(id);
  }
  const unregistered = initTeams.filter(t=>!registeredIds.has(t.id));

  const handleAddEntries = async () => {
    if (selectedTeams.length===0) { toast.error("Pilih peserta"); return; }
    setSaving(true);
    const parts = selectedTeams.map(id=>({ [isTeam?"teamId":"participantId"]:id }));
    const names = selectedTeams.map(id=>initTeams.find(t=>t.id===id)?.name||"?").join(", ");

    // Optimistic: add a temporary match
    const tempId = `temp_${Date.now()}`;
    const tempMatch: Match = {
      id: tempId,
      name: `Time Trial: ${names}`,
      round: "Time Trial", stage: "REGULAR",
      status: "SCHEDULED", scheduledAt: null, venue: null, groupName: null, bracketSlot: null,
      participants: selectedTeams.map((id, i) => {
        const t = initTeams.find(x => x.id === id);
        return {
          id: `tp_${Date.now()}_${i}`, score: 0, result: null, timeResult: null,
          teamId: isTeam ? id : null, participantId: !isTeam ? id : null,
          team: (isTeam && t) ? { id: t.id, name: t.name, section: t.section ?? null } : null,
          participant: (!isTeam && t) ? { id: t.id, name: t.name, section: t.section ?? null } : null,
        };
      }),
    };
    setLocalMatches(ms => [...ms, tempMatch]);
    setShowAdd(false); setSelectedTeams([]);

    try {
      const res = await fetch("/api/matches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId:comp.id, name:`Time Trial: ${names}`, round:"Time Trial", stage:"REGULAR", participants:parts }),
      });
      const real = await res.json();
      setLocalMatches(ms => ms.map(m => m.id === tempId ? real : m));
      toast.success("Peserta ditambahkan ke ranking!");
    } catch {
      setLocalMatches(ms => ms.filter(m => m.id !== tempId));
      toast.error("Gagal menambahkan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (matchId:string) => {
    if (!confirm("Hapus dari ranking?")) return;
    setLocalMatches(ms => ms.filter(m => m.id !== matchId));
    try {
      await fetch(`/api/matches/${matchId}`,{method:"DELETE"});
      toast.success("Dihapus");
    } catch {
      toast.error("Gagal menghapus"); onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-[6px] border-[2.5px] border-[#1C1917] bg-[#FFF7ED] shadow-[3px_3px_0_#F97316] font-black text-sm text-[#9A3412]">
            <Timer className="inline w-4 h-4 mr-1 text-[#F97316]"/>
            Time Trial · Satuan: {unit} · Urutan: {sortOrder==="DESC"?"Tertinggi Terbaik":"Terendah Terbaik"}
          </div>
        </div>
        <button onClick={()=>setShowAdd(!showAdd)} className="btn-neon px-4 py-2 text-xs flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5"/> Tambah Peserta
        </button>
      </div>

      {/* Add entries */}
      {showAdd && (
        <div className="neu-card p-4 space-y-3">
          <div className="text-xs font-black text-[#1C1917] uppercase tracking-wider mb-2">Pilih Peserta yang Akan Dinilai</div>
          <div className="max-h-48 overflow-y-auto border-[2.5px] border-[#1C1917] rounded-[6px] divide-y divide-[#E7E5E4]">
            {unregistered.length===0 ? (
              <div className="px-4 py-3 text-sm text-black font-semibold">Semua peserta sudah terdaftar</div>
            ) : unregistered.map(t=>(
              <label key={t.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#FFFBEB] ${selectedTeams.includes(t.id)?"bg-[#ECFEFF]":""}`}>
                <input type="checkbox" checked={selectedTeams.includes(t.id)}
                  onChange={e=>setSelectedTeams(prev=>e.target.checked?[...prev,t.id]:prev.filter(x=>x!==t.id))}
                  className="w-4 h-4 accent-[#0891B2]"/>
                <span className="text-sm font-black text-[#1C1917]">{t.name}</span>
                {t.section&&<span className="text-xs text-black font-semibold ml-auto">{t.section}</span>}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddEntries} disabled={saving||selectedTeams.length===0} className="btn-neon px-4 py-2 text-xs disabled:opacity-50">{saving?"Menyimpan...":"Tambahkan"}</button>
            <button onClick={()=>setShowAdd(false)} className="px-4 py-2 text-xs font-black border-2 border-[#D4D0CA] rounded-[4px] text-white">Batal</button>
          </div>
        </div>
      )}

      {/* Ranking table */}
      {ranked.length > 0 ? (
        <div className="neu-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-[#FFFBEB] border-b-2 border-[#E7E5E4]">
              <th className="text-center px-4 py-3 text-xs font-black text-[#1C1917] uppercase w-16">Rank</th>
              <th className="text-left px-4 py-3 text-xs font-black text-[#1C1917] uppercase">Peserta</th>
              <th className="text-left px-4 py-3 text-xs font-black text-black uppercase hidden sm:table-cell">Seksi</th>
              <th className="text-center px-4 py-3 text-xs font-black text-[#0891B2] uppercase">{unit}</th>
              <th className="px-4 py-3 w-16"/>
            </tr></thead>
            <tbody>
              {ranked.map((e,i)=>{
                const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
                const isTemp = e.matchId.startsWith("temp_");
                return (
                  <tr key={e.partId} className={`border-b-2 border-[#E7E5E4] hover:bg-[#FFFBEB] ${i<3?"font-black":""} ${isTemp?"opacity-60":""}`}>
                    <td className="px-4 py-3 text-center">{medal?<span className="text-lg">{medal}</span>:<span className="text-black font-bold text-sm">#{i+1}</span>}</td>
                    <td className="px-4 py-3 text-sm font-black text-[#1C1917]">{e.name}</td>
                    <td className="px-4 py-3 text-xs text-black font-semibold hidden sm:table-cell">{e.section||"-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`stat-number font-black text-lg ${i<3?"text-[#0891B2]":"text-[#1C1917]"}`}>
                        {e.score!==null && e.score!==0 ? (e.timeResult||String(e.score)) : <span className="text-black text-sm">Belum dinilai</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!isTemp && (
                        <button onClick={()=>handleDelete(e.matchId)} className="p-1.5 rounded border-2 border-transparent text-black hover:border-[#C2410C] hover:text-[#C2410C]"><Trash2 className="w-3.5 h-3.5"/></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="neu-card p-12 text-center text-black">
          <Timer className="w-10 h-10 mx-auto mb-3 opacity-30"/>
          <p className="font-bold">Belum ada peserta di ranking</p>
          <p className="text-xs mt-1">Klik "Tambah Peserta" untuk mulai mencatat nilai/waktu</p>
        </div>
      )}

      <div className="text-xs font-bold text-gray-500 mt-4 bg-gray-50 p-3 rounded border border-gray-200">
        💡 <strong>Tips:</strong> Untuk mengatur skor (nilai/waktu) dan menjadwalkan perlombaan Time Trial ini, silakan masuk ke tab <strong>Jadwal & Skor</strong>.
      </div>
    </div>
  );
}
