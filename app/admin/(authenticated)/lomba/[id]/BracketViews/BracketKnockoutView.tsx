"use client";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Competition } from "../page";
import { Match, TeamOrPart } from "../TabBracket";

const ROUND_NAMES: Record<number, string> = { 2:"Final", 4:"Semifinal", 8:"Perempat Final", 16:"16 Besar", 32:"32 Besar", 64:"64 Besar" };

export default function BracketKnockoutView({ comp, matches, teams, onRefresh }: { comp:Competition; matches:Match[]; teams:TeamOrPart[]; onRefresh:()=>void }) {
  const cfg = comp.config ? JSON.parse(comp.config) : {};
  const bracketSize: number = cfg.bracketSize || 8;
  const thirdPlace: boolean = cfg.thirdPlace ?? true;
  const isTeam = comp.type==="TEAM"||comp.type==="DUO";

  // localMatches is kept in sync with prop, allows optimistic updates for team assignment
  const [localMatches, setLocalMatches] = useState<Match[]>(matches);
  const [saving, setSaving] = useState(false);
  
  // Sync when parent provides new data (after tab switch + refetch)
  useEffect(() => { setLocalMatches(matches); }, [matches]);

  // Edit team mode
  const [editingTeam, setEditingTeam] = useState<{matchId:string, participantIndex:number, currentTeamId:string|null}|null>(null);

  // Rounds logic
  const rounds: number[] = [];
  let r = bracketSize;
  while (r >= 2) { rounds.push(r); r /= 2; }

  const handleGenerate = async () => {
    if (!confirm(`Generate bagan otomatis untuk ${bracketSize} tim?`)) return;
    setSaving(true);
    try {
      // Create bracket matches
      let slot = 1;
      for (const rSize of rounds) {
        const matchCount = rSize / 2;
        const roundName = ROUND_NAMES[rSize] || `${rSize} Besar`;
        for (let i = 0; i < matchCount; i++) {
          await fetch("/api/matches", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
              competitionId: comp.id,
              name: `${roundName} - Match ${i+1}`,
              round: roundName,
              stage: "KNOCKOUT",
              bracketSlot: slot++,
              participants: [{ teamId: null, participantId: null }, { teamId: null, participantId: null }]
            })
          });
        }
      }
      if (thirdPlace) {
        await fetch("/api/matches", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({
            competitionId: comp.id,
            name: "Perebutan Juara 3",
            round: "Perebutan Juara 3",
            stage: "KNOCKOUT",
            bracketSlot: slot++,
            participants: [{ teamId: null, participantId: null }, { teamId: null, participantId: null }]
          })
        });
      }
      toast.success("Bagan berhasil dibuat!");
      onRefresh(); // Need real data after generation
    } catch { toast.error("Gagal membuat bagan"); }
    finally { setSaving(false); }
  };

  const handleUpdateTeam = async (matchId: string, participantId: string, newTeamId: string) => {
    const selectedTeam = teams.find(t => t.id === newTeamId) || null;
    // Optimistic update immediately
    setLocalMatches(ms => ms.map(m => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        participants: m.participants.map(p => {
          if (p.id !== participantId) return p;
          return {
            ...p,
            teamId: isTeam ? (newTeamId || null) : p.teamId,
            participantId: !isTeam ? (newTeamId || null) : p.participantId,
            team: (isTeam && selectedTeam) ? { id: selectedTeam.id, name: selectedTeam.name, section: selectedTeam.section ?? null } : p.team,
            participant: (!isTeam && selectedTeam) ? { id: selectedTeam.id, name: selectedTeam.name, section: selectedTeam.section ?? null } : p.participant,
          };
        }),
      };
    }));
    setEditingTeam(null);
    // Background save
    try {
      const payloadParticipants = [
        { id: participantId, [isTeam ? "teamId" : "participantId"]: newTeamId || null }
      ];
      await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: payloadParticipants })
      });
      toast.success("Tim diperbarui!");
    } catch { toast.error("Gagal memperbarui"); onRefresh(); }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Hapus seluruh bagan? Ini akan menghapus semua pertandingan.")) return;
    setSaving(true);
    try {
      for (const m of localMatches) await fetch(`/api/matches/${m.id}`, { method: "DELETE" });
      setLocalMatches([]);
      toast.success("Bagan dihapus");
    } catch { toast.error("Gagal menghapus"); onRefresh(); }
    finally { setSaving(false); }
  };

  if (localMatches.length === 0) {
    return (
      <div className="neu-card p-12 text-center flex flex-col items-center justify-center">
        <h2 className="text-xl font-black text-[#1C1917] mb-2">Bagan Belum Dibuat</h2>
        <p className="text-sm font-bold text-gray-600 mb-6">Sistem akan meng-generate {bracketSize} slot otomatis sesuai pengaturan format.</p>
        <button onClick={handleGenerate} disabled={saving} className="btn-neon px-6 py-3 flex items-center gap-2">
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Generate Bagan ({bracketSize} Tim)
        </button>
      </div>
    );
  }

  // Organize matches by bracketSlot
  const matchBySlot = useMemo(() => {
    const map = new Map<number, Match>();
    localMatches.forEach(m => { if (m.bracketSlot) map.set(m.bracketSlot, m); });
    return map;
  }, [localMatches]);

  const renderMatchCard = (m: Match | undefined) => {
    if (!m) return <div className="w-[200px] h-[80px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-[6px] flex items-center justify-center text-xs text-gray-400 font-bold">Slot Kosong</div>;
    
    const pA = m.participants[0];
    const pB = m.participants[1];
    const tA_id = pA?.teamId || pA?.participantId;
    const tB_id = pB?.teamId || pB?.participantId;
    const nA = pA?.team?.name || pA?.participant?.name || "TBD";
    const nB = pB?.team?.name || pB?.participant?.name || "TBD";

    return (
      <div className={`w-[200px] rounded-[6px] border-[2.5px] border-[#1C1917] bg-white overflow-hidden ${m.status==="COMPLETED"?"shadow-[3px_3px_0_#10B981]":"shadow-[3px_3px_0_#D4D0CA]"} z-10 relative`}>
        {/* Team A */}
        <div className={`flex items-center justify-between px-2 py-1.5 border-b-2 border-[#E7E5E4] ${pA?.result==="WIN"?"bg-[#ECFDF5]":""} group`}>
          {editingTeam?.matchId === m.id && editingTeam.participantIndex === 0 ? (
            <select autoFocus onBlur={()=>setEditingTeam(null)} onChange={(e)=>handleUpdateParticipant(m.id, pA.id, e.target.value)} value={tA_id||""} className="text-xs font-bold bg-white border border-[#1C1917] rounded w-full">
              <option value="">TBD</option>
              {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ) : (
            <span onClick={()=>setEditingTeam({matchId:m.id, participantIndex:0, currentTeamId:tA_id||null})} className={`text-xs font-black truncate max-w-[120px] cursor-pointer hover:text-[#0891B2] ${pA?.result==="WIN"?"text-[#10B981]":pA?.result==="LOSE"?"text-black":"text-[#1C1917]"}`}>{nA}</span>
          )}
          <span className={`text-sm font-black stat-number ${pA?.result==="WIN"?"text-[#10B981]":"text-[#1C1917]"}`}>{m.status==="COMPLETED" ? pA?.score??0 : "-"}</span>
        </div>
        {/* Team B */}
        <div className={`flex items-center justify-between px-2 py-1.5 ${pB?.result==="WIN"?"bg-[#ECFDF5]":""} group`}>
          {editingTeam?.matchId === m.id && editingTeam.participantIndex === 1 ? (
            <select autoFocus onBlur={()=>setEditingTeam(null)} onChange={(e)=>handleUpdateParticipant(m.id, pB.id, e.target.value)} value={tB_id||""} className="text-xs font-bold bg-white border border-[#1C1917] rounded w-full">
              <option value="">TBD</option>
              {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ) : (
            <span onClick={()=>setEditingTeam({matchId:m.id, participantIndex:1, currentTeamId:tB_id||null})} className={`text-xs font-black truncate max-w-[120px] cursor-pointer hover:text-[#0891B2] ${pB?.result==="WIN"?"text-[#10B981]":pB?.result==="LOSE"?"text-black":"text-[#1C1917]"}`}>{nB}</span>
          )}
          <span className={`text-sm font-black stat-number ${pB?.result==="WIN"?"text-[#10B981]":"text-[#1C1917]"}`}>{m.status==="COMPLETED" ? pB?.score??0 : "-"}</span>
        </div>
      </div>
    );
  };

  const handleUpdateParticipant = (matchId: string, partId: string, teamId: string) => {
     handleUpdateTeam(matchId, partId, teamId);
  }

  // Draw recursive node
  const BracketNode = ({ slot, roundIndex }: { slot: number, roundIndex: number }) => {
    const isFirstRound = roundIndex === 0;
    const match = matchBySlot.get(slot);
    
    return (
      <div className="flex items-center">
        {/* Children (Previous round matches) */}
        {!isFirstRound && (
          <div className="flex flex-col justify-center relative">
            {/* Connecting bracket line */}
            <div className="absolute right-0 top-[25%] bottom-[25%] w-[20px] border-r-[2.5px] border-t-[2.5px] border-b-[2.5px] border-[#1C1917] rounded-r-[6px]" />
            <div className="flex flex-col gap-y-6 pr-5">
              <BracketNode slot={2 * slot - bracketSize - 1} roundIndex={roundIndex - 1} />
              <BracketNode slot={2 * slot - bracketSize} roundIndex={roundIndex - 1} />
            </div>
          </div>
        )}

        {/* Current Match */}
        <div className="relative pl-5">
          {!isFirstRound && (
            <div className="absolute left-0 top-1/2 w-[20px] h-[2.5px] bg-[#1C1917] -translate-y-1/2" />
          )}
          {renderMatchCard(match)}
        </div>
      </div>
    );
  };

  // The root slot is the Final match.
  // Number of matches = bracketSize - 1. So the Final is slot (bracketSize - 1).
  const finalSlot = bracketSize - 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={handleDeleteAll} disabled={saving} className="neu-btn neu-btn-white text-xs px-4 py-2 text-red-600 border-red-600 shadow-[2px_2px_0_#DC2626] hover:shadow-[1px_1px_0_#DC2626]">
          <Trash2 className="w-3.5 h-3.5 inline mr-1"/> Hapus Bagan
        </button>
      </div>

      <div className="overflow-x-auto pb-8 pt-4">
        <div className="min-w-max flex gap-8">
          {/* Main Championship Bracket */}
          <BracketNode slot={finalSlot} roundIndex={rounds.length - 1} />
          
          {/* Third Place Match (if applicable) */}
          {thirdPlace && (
             <div className="ml-12 border-l-4 border-dashed border-[#E7E5E4] pl-12 flex flex-col justify-center">
               <h3 className="text-xs font-black text-[#1C1917] uppercase tracking-wider mb-3 bg-[#FFFBEB] px-3 py-1 border-[2.5px] border-[#1C1917] shadow-[2px_2px_0_#1C1917] inline-block rounded-[4px]">
                 Perebutan Juara 3
               </h3>
               {renderMatchCard(matchBySlot.get(bracketSize))}
             </div>
          )}
        </div>
      </div>
      
      <div className="text-xs font-bold text-gray-500 mt-4 bg-gray-50 p-3 rounded border border-gray-200">
        💡 <strong>Tips:</strong> Klik nama tim (TBD) di dalam bagan untuk memasukkan/mengganti tim. <strong>Atur skor dan jadwal pertandingan melalui tab "Jadwal & Skor".</strong>
      </div>
    </div>
  );
}
