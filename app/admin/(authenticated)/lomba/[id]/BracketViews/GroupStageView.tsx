"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Competition } from "../page";
import { Match, MatchPart, TeamOrPart } from "../TabBracket";

const cfg = (comp: Competition) => comp.config ? JSON.parse(comp.config) : {};

// Group standings calculator
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

export default function GroupStageView({ comp, matches, teams, onRefresh }: { comp:Competition; matches:Match[]; teams:TeamOrPart[]; onRefresh:()=>void; }) {
  const config = cfg(comp);
  const numGroups = config.numGroups || 2;
  const groups = Array.from({length:numGroups},(_,i)=>`Grup ${String.fromCharCode(65+i)}`);

  const [addingMatch, setAddingMatch] = useState<string|null>(null);
  const [p1, setP1] = useState(""); const [p2, setP2] = useState("");
  const [sched, setSched] = useState(""); const [venue, setVenue] = useState("");
  const [saving, setSaving] = useState(false);

  const teamsInGroup = (g:string) => teams.filter(t => t.groupName === g);
  const matchesInGroup = (g:string) => matches.filter(m => m.groupName === g);
  const stat = calcStandings(teams, matches, config);
  const isTeam = comp.type === "TEAM" || comp.type === "DUO";

  const handleAddMatch = async (group:string) => {
    if (!p1 || !p2 || p1===p2) { toast.error("Pilih 2 peserta berbeda"); return; }
    setSaving(true);
    const pArr = [{ [isTeam?"teamId":"participantId"]: p1 }, { [isTeam?"teamId":"participantId"]: p2 }];
    const n1 = teams.find(t=>t.id===p1)?.name||"?";
    const n2 = teams.find(t=>t.id===p2)?.name||"?";
    await fetch("/api/matches", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({
      competitionId:comp.id, name:`${n1} vs ${n2}`,
      round:"Fase Grup", stage:"REGULAR", groupName:group,
      scheduledAt:sched||null, venue:venue||null, participants:pArr,
    })});
    toast.success("Pertandingan ditambahkan!");
    setAddingMatch(null); setP1(""); setP2(""); setSched(""); setVenue("");
    setSaving(false); onRefresh();
  };

  const handleDelete = async (id:string) => {
    if (!confirm("Hapus pertandingan?")) return;
    await fetch(`/api/matches/${id}`, {method:"DELETE"});
    toast.success("Dihapus"); onRefresh();
  };

  const [assigningGroup, setAssigningGroup] = useState<Record<string,string>>({});
  const [assignSaving, setAssignSaving] = useState(false);

  const unassigned = teams.filter(t => !t.groupName);

  const handleAssignGroup = async (teamId: string, group: string) => {
    setAssignSaving(true);
    await fetch(`/api/teams/${teamId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ groupName: group||null }) });
    toast.success(group ? `Tim dipindah ke ${group}` : "Tim dilepas dari grup");
    setAssignSaving(false); onRefresh();
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
              {teams.map(t=>(
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
                        defaultValue={t.groupName||""}
                        onChange={e=>handleAssignGroup(t.id, e.target.value)}
                        disabled={assignSaving}
                        className="text-xs border-[2.5px] border-[#1C1917] rounded-[4px] px-2 py-1 font-black bg-white focus:outline-none focus:shadow-[2px_2px_0_#0891B2] disabled:opacity-50">
                        <option value="">-- Tidak ada --</option>
                        {groups.map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {teams.length===0&&<tr><td colSpan={4} className="px-3 py-4 text-center text-black font-semibold text-sm">Belum ada peserta. Tambahkan di tab "Peserta & Tim".</td></tr>}
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
                  <div>
                    <label className={lbl}>Tanggal & Jam</label>
                    <input type="datetime-local" value={sched} onChange={e=>setSched(e.target.value)} className="neu-input text-sm"/>
                  </div>
                  <div>
                    <label className={lbl}>Venue</label>
                    <input value={venue} onChange={e=>setVenue(e.target.value)} placeholder="Lapangan A..." className="neu-input text-sm"/>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>handleAddMatch(group)} disabled={saving} className="btn-neon px-4 py-2 text-xs disabled:opacity-50">{saving?"...":"Tambah"}</button>
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
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-3 rounded-[6px] border-[2.5px] border-[#1C1917] bg-white ${m.status==="COMPLETED"?"shadow-[3px_3px_0_#10B981]":"shadow-[3px_3px_0_#D4D0CA]"}`}>
                        <div className="flex-1 flex items-center gap-3 justify-center text-sm">
                          <span className={`font-black ${pA?.result==="WIN"?"text-[#10B981]":pA?.result==="LOSE"?"text-[#C2410C]":"text-[#1C1917]"}`}>{nA}</span>
                          <span className="px-3 py-1 rounded border-2 border-[#D4D0CA] bg-[#F5F5F4] text-[#1C1917] font-black text-sm min-w-[60px] text-center">
                            {m.status==="COMPLETED" ? `${pA?.score??0} – ${pB?.score??0}` : "vs"}
                          </span>
                          <span className={`font-black ${pB?.result==="WIN"?"text-[#10B981]":pB?.result==="LOSE"?"text-[#C2410C]":"text-[#1C1917]"}`}>{nB}</span>
                        </div>
                        {m.scheduledAt&&<span className="text-[10px] text-black font-semibold hidden sm:block">{new Date(m.scheduledAt).toLocaleString("id-ID",{dateStyle:"short",timeStyle:"short"})}</span>}
                        <div className="flex items-center gap-1 ml-auto">
                          <button onClick={()=>handleDelete(m.id)} className="p-1.5 rounded border-2 border-transparent text-black hover:border-[#C2410C] hover:text-[#C2410C]"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
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
