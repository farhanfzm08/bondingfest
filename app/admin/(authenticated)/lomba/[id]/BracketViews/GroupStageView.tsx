"use client";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Competition } from "../page";
import { Match, TeamOrPart } from "../TabBracket";

const cfg = (comp: Competition) => comp.config ? JSON.parse(comp.config) : {};

function calcStandings(teams: TeamOrPart[], matches: Match[], config: any) {
  const ptsWin = config.pointsWin ?? 3;
  const ptsDraw = config.pointsDraw ?? 1;
  const ptsLoss = config.pointsLoss ?? 0;
  const stat: Record<string, { wins:number; draws:number; losses:number; gf:number; ga:number; pts:number; played:number }> = {};
  for (const t of teams) { stat[t.id] = { wins:0,draws:0,losses:0,gf:0,ga:0,pts:0,played:0 }; }

  for (const m of matches) {
    if (m.status !== "COMPLETED" || m.participants.length < 2) continue;
    const [pA, pB] = m.participants;
    const idA = pA.teamId || pA.participantId || "";
    const idB = pB.teamId || pB.participantId || "";
    if (!stat[idA] || !stat[idB]) continue;
    stat[idA].gf += pA.score; stat[idA].ga += pB.score; stat[idA].played++;
    stat[idB].gf += pB.score; stat[idB].ga += pA.score; stat[idB].played++;
    if (pA.score > pB.score) { stat[idA].wins++; stat[idA].pts+=ptsWin; stat[idB].losses++; stat[idB].pts+=ptsLoss; }
    else if (pB.score > pA.score) { stat[idB].wins++; stat[idB].pts+=ptsWin; stat[idA].losses++; stat[idA].pts+=ptsLoss; }
    else { stat[idA].draws++; stat[idA].pts+=ptsDraw; stat[idB].draws++; stat[idB].pts+=ptsDraw; }
  }
  return stat;
}

export default function GroupStageView({ comp, matches: initMatches, teams: initTeams, onRefresh }: { comp:Competition; matches:Match[]; teams:TeamOrPart[]; onRefresh:()=>void; }) {
  const config = cfg(comp);
  const numGroups = config.numGroups || 2;
  const groups = Array.from({length:numGroups},(_,i)=>`Grup ${String.fromCharCode(65+i)}`);
  const isTeam = comp.type === "TEAM" || comp.type === "DUO";

  // Local optimistic state — no reload needed
  const [localTeams, setLocalTeams] = useState<TeamOrPart[]>(initTeams);
  const [localMatches, setLocalMatches] = useState<Match[]>(initMatches);
  const [savingTeam, setSavingTeam] = useState<string | null>(null);
  const [addingMatch, setAddingMatch] = useState<string|null>(null);
  const [p1, setP1] = useState(""); const [p2, setP2] = useState("");
  const [savingMatch, setSavingMatch] = useState(false);

  const teamsInGroup = (g:string) => localTeams.filter(t => t.groupName === g);
  const matchesInGroup = (g:string) => localMatches.filter(m => m.groupName === g);
  const stat = calcStandings(localTeams, localMatches, config);
  const unassigned = localTeams.filter(t => !t.groupName);

  // ── Assign team/participant to group (optimistic) ──────────────────────────
  const handleAssignGroup = async (teamId: string, newGroup: string) => {
    const entry = localTeams.find(t => t.id === teamId);
    const prev = entry?.groupName;
    // Optimistic update immediately
    setLocalTeams(ts => ts.map(t => t.id === teamId ? { ...t, groupName: newGroup || null } : t));
    setSavingTeam(teamId);
    try {
      let res: Response;
      if (isTeam) {
        // Team-based competition: PATCH /api/teams/[teamId]
        res = await fetch(`/api/teams/${teamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupName: newGroup || null }),
        });
      } else {
        // Individual competition: PATCH /api/competitions/[compId]/participants/[participantId]
        // For individual, t.id = participant.id, and t.cpId = CompetitionParticipant.id (not used here)
        res = await fetch(`/api/competitions/${comp.id}/participants/${teamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupName: newGroup || null }),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memindahkan");
      }
      toast.success(newGroup ? `Dipindah ke ${newGroup}` : "Dilepas dari grup");
    } catch (e: any) {
      // Rollback on error
      setLocalTeams(ts => ts.map(t => t.id === teamId ? { ...t, groupName: prev ?? null } : t));
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSavingTeam(null);
    }
  };

  // ── Add match (optimistic) ─────────────────────────────────────────────────
  const handleAddMatch = async (group:string) => {
    if (!p1 || !p2 || p1===p2) { toast.error("Pilih 2 peserta berbeda"); return; }
    setSavingMatch(true);
    const n1 = localTeams.find(t=>t.id===p1)?.name||"?";
    const n2 = localTeams.find(t=>t.id===p2)?.name||"?";
    const pArr = [{ [isTeam?"teamId":"participantId"]: p1 }, { [isTeam?"teamId":"participantId"]: p2 }];

    // Optimistic placeholder
    const tempId = `temp_${Date.now()}`;
    const t1 = localTeams.find(t=>t.id===p1);
    const t2 = localTeams.find(t=>t.id===p2);
    const optimisticMatch: Match = {
      id: tempId, name: `${n1} vs ${n2}`, round: "Fase Grup", groupName: group,
      stage: "REGULAR", status: "SCHEDULED", scheduledAt: null, venue: null, bracketSlot: null,
      participants: [
        { id: `tp1_${Date.now()}`, score: 0, result: null, timeResult: null, teamId: p1, participantId: null, team: t1 ? { id: t1.id, name: t1.name, section: t1.section ?? null } : null, participant: null },
        { id: `tp2_${Date.now()}`, score: 0, result: null, timeResult: null, teamId: p2, participantId: null, team: t2 ? { id: t2.id, name: t2.name, section: t2.section ?? null } : null, participant: null },
      ],
    };
    setLocalMatches(ms => [...ms, optimisticMatch]);
    setAddingMatch(null); setP1(""); setP2("");

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId:comp.id, name:`${n1} vs ${n2}`, round:"Fase Grup", stage:"REGULAR", groupName:group, participants:pArr }),
      });
      const real = await res.json();
      // Replace temp with real data
      setLocalMatches(ms => ms.map(m => m.id === tempId ? real : m));
      toast.success("Pertandingan ditambahkan!");
    } catch {
      setLocalMatches(ms => ms.filter(m => m.id !== tempId));
      toast.error("Gagal menambahkan pertandingan");
    } finally {
      setSavingMatch(false);
    }
  };

  // ── Delete match (optimistic) ──────────────────────────────────────────────
  const handleDelete = async (id:string) => {
    if (!confirm("Hapus pertandingan?")) return;
    setLocalMatches(ms => ms.filter(m => m.id !== id));
    try {
      await fetch(`/api/matches/${id}`, { method:"DELETE" });
      toast.success("Dihapus");
    } catch {
      toast.error("Gagal menghapus"); onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Group Assignment Panel */}
      <div className="neu-card p-4">
        <div className="font-black text-sm text-[#1C1917] mb-3 flex items-center gap-2">
          🗂️ Atur Penempatan Grup
          {unassigned.length > 0 && <span className="px-2 py-0.5 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] text-[#C2410C] text-xs font-black">{unassigned.length} belum ditempatkan</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#FFFBEB] border-b-2 border-[#E7E5E4]">
              <th className="text-left px-3 py-2 text-xs font-black text-[#1C1917] uppercase">Tim / Peserta</th>
              <th className="text-left px-3 py-2 text-xs font-black text-black uppercase">Seksi</th>
              <th className="text-center px-3 py-2 text-xs font-black text-[#0891B2] uppercase">Grup Saat Ini</th>
              <th className="text-center px-3 py-2 text-xs font-black text-[#1C1917] uppercase">Pindahkan ke</th>
            </tr></thead>
            <tbody>
              {localTeams.map(t=>(
                <tr key={t.id} className="border-b border-[#E7E5E4] hover:bg-[#FFFBEB]">
                  <td className="px-3 py-2 font-black text-[#1C1917]">{t.name}</td>
                  <td className="px-3 py-2 text-black font-semibold text-xs">{t.section||"-"}</td>
                  <td className="px-3 py-2 text-center">
                    {t.groupName
                      ? <span className="px-3 py-1 text-xs font-black rounded-[4px] border-2 border-[#0891B2] text-[#0891B2] bg-[#ECFEFF]">{t.groupName}</span>
                      : <span className="text-xs text-black font-semibold">Belum</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <select
                        key={t.groupName ?? "none"}
                        defaultValue={t.groupName ?? ""}
                        onChange={e => handleAssignGroup(t.id, e.target.value)}
                        disabled={savingTeam === t.id}
                        className="text-xs border-[2.5px] border-[#1C1917] rounded-[4px] px-2 py-1 font-black bg-white focus:outline-none focus:shadow-[2px_2px_0_#0891B2] disabled:opacity-50"
                      >
                        <option value="">-- Tidak ada --</option>
                        {groups.map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                      {savingTeam === t.id && <span className="text-xs text-[#0891B2] animate-pulse font-bold">Menyimpan...</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {localTeams.length===0&&<tr><td colSpan={4} className="px-3 py-4 text-center text-black font-semibold text-sm">Belum ada peserta. Tambahkan di tab "Peserta & Tim".</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {groups.map(group => {
        const lbl = "block text-xs font-black text-[#1C1917] mb-1.5 uppercase tracking-wider";
        const grpTeams = teamsInGroup(group);
        const grpMatches = matchesInGroup(group);
        const isAdding = addingMatch === group;

        return (
          <div key={group} className="space-y-3">
            {/* Group header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 rounded-[6px] border-[2.5px] border-[#1C1917] bg-[#0891B2] text-white font-black shadow-[3px_3px_0_#1C1917]">{group}</span>
                <span className="text-white text-sm font-semibold">{grpTeams.length} tim · {grpMatches.length} pertandingan</span>
              </div>
              <button onClick={()=>{ setAddingMatch(isAdding?null:group); setP1(""); setP2(""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-[4px] border-2 border-[#0891B2] text-[#0891B2] bg-[#ECFEFF] hover:bg-[#0891B2] hover:text-white transition-all">
                <Plus className="w-3.5 h-3.5"/> Tambah Pertandingan
              </button>
            </div>

            {/* Standings table */}
            {grpTeams.length > 0 && (
              <div className="neu-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#FFFBEB] border-b-2 border-[#E7E5E4]">
                    <th className="text-left px-3 py-2 text-xs font-black text-[#1C1917] uppercase">Tim</th>
                    <th className="text-center px-2 py-2 text-xs font-black text-[#1C1917]">M</th>
                    <th className="text-center px-2 py-2 text-xs font-black text-[#10B981]">M</th>
                    <th className="text-center px-2 py-2 text-xs font-black text-black">S</th>
                    <th className="text-center px-2 py-2 text-xs font-black text-[#C2410C]">K</th>
                    <th className="text-center px-2 py-2 text-xs font-black text-[#1C1917]">GD</th>
                    <th className="text-center px-3 py-2 text-xs font-black text-[#0891B2]">Poin</th>
                  </tr></thead>
                  <tbody>
                    {grpTeams
                      .sort((a,b)=>(stat[b.id]?.pts||0)-(stat[a.id]?.pts||0))
                      .map((t,i)=>{
                        const s=stat[t.id]||{wins:0,draws:0,losses:0,gf:0,ga:0,pts:0,played:0};
                        return (
                          <tr key={t.id} className={`border-b border-[#E7E5E4] ${i<(config.advanceCount||2)?"bg-[#ECFEFF]":""}`}>
                            <td className="px-3 py-2 font-bold text-[#1C1917] flex items-center gap-2">
                              {i<(config.advanceCount||2)&&<span className="w-2 h-2 rounded-full bg-[#10B981]"/>}
                              {t.name}
                              {t.section&&<span className="text-[10px] text-black font-semibold">({t.section})</span>}
                            </td>
                            <td className="text-center px-2 py-2 text-black text-xs">{s.played}</td>
                            <td className="text-center px-2 py-2 text-[#10B981] font-black">{s.wins}</td>
                            <td className="text-center px-2 py-2 text-black font-black">{s.draws}</td>
                            <td className="text-center px-2 py-2 text-[#C2410C] font-black">{s.losses}</td>
                            <td className="text-center px-2 py-2 text-[#1C1917] font-semibold">{s.gf}-{s.ga}</td>
                            <td className="text-center px-3 py-2 text-[#0891B2] font-black text-base stat-number">{s.pts}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add match form */}
            {isAdding && (
              <div className="neu-card p-4 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Tim/Peserta 1</label>
                    <select value={p1} onChange={e=>setP1(e.target.value)} className="neu-input text-sm">
                      <option value="">-- Pilih --</option>
                      {grpTeams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Tim/Peserta 2</label>
                    <select value={p2} onChange={e=>setP2(e.target.value)} className="neu-input text-sm">
                      <option value="">-- Pilih --</option>
                      {grpTeams.filter(t=>t.id!==p1).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>handleAddMatch(group)} disabled={savingMatch} className="btn-neon px-4 py-2 text-xs disabled:opacity-50">{savingMatch?"Menyimpan...":"Tambah"}</button>
                  <button onClick={()=>setAddingMatch(null)} className="px-4 py-2 text-xs font-black border-2 border-[#D4D0CA] rounded-[4px] text-white">Batal</button>
                </div>
              </div>
            )}

            {/* Match list */}
            <div className="space-y-2">
              {grpMatches.map(m => {
                const pA=m.participants[0]; const pB=m.participants[1];
                const nA=pA?.team?.name||pA?.participant?.name||"TBD";
                const nB=pB?.team?.name||pB?.participant?.name||"TBD";
                const isTemp = m.id.startsWith("temp_");
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-3 rounded-[6px] border-[2.5px] border-[#1C1917] bg-white ${m.status==="COMPLETED"?"shadow-[3px_3px_0_#10B981]":"shadow-[3px_3px_0_#D4D0CA]"} ${isTemp?"opacity-60":""}`}>
                    <div className="flex-1 flex items-center gap-3 justify-center text-sm">
                      <span className={`font-black ${pA?.result==="WIN"?"text-[#10B981]":pA?.result==="LOSE"?"text-[#C2410C]":"text-[#1C1917]"}`}>{nA}</span>
                      <span className="px-3 py-1 rounded border-2 border-[#D4D0CA] bg-[#F5F5F4] text-[#1C1917] font-black text-sm min-w-[60px] text-center">
                        {m.status==="COMPLETED" ? `${pA?.score??0} – ${pB?.score??0}` : "vs"}
                      </span>
                      <span className={`font-black ${pB?.result==="WIN"?"text-[#10B981]":pB?.result==="LOSE"?"text-[#C2410C]":"text-[#1C1917]"}`}>{nB}</span>
                    </div>
                    {m.scheduledAt&&<span className="text-[10px] text-black font-semibold hidden sm:block">{new Date(m.scheduledAt).toLocaleString("id-ID",{dateStyle:"short",timeStyle:"short",timeZone:"Asia/Jakarta"})}</span>}
                    {!isTemp && (
                      <button onClick={()=>handleDelete(m.id)} className="p-1.5 rounded border-2 border-transparent text-black hover:border-[#C2410C] hover:text-[#C2410C]"><Trash2 className="w-3.5 h-3.5"/></button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="text-xs font-bold text-gray-500 mt-4 bg-gray-50 p-3 rounded border border-gray-200">
        💡 <strong>Tips:</strong> Untuk mengatur skor dan tanggal pertandingan antar tim, silakan gunakan tab <strong>Jadwal & Skor</strong>.
      </div>
    </div>
  );
}
