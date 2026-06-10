"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { Competition } from "../page";
import { Match, TeamOrPart } from "../TabBracket";

const ROUND_NAMES: Record<number, string> = { 2:"Final", 4:"Semifinal", 8:"Perempat Final", 16:"16 Besar", 32:"32 Besar" };

export default function BracketKnockoutView({ comp, matches, teams, onRefresh }: { comp:Competition; matches:Match[]; teams:TeamOrPart[]; onRefresh:()=>void }) {
  const cfg = comp.config ? JSON.parse(comp.config) : {};
  const bracketSize: number = cfg.bracketSize || 8;
  const thirdPlace: boolean = cfg.thirdPlace ?? true;

  const [showAdd, setShowAdd] = useState(false);
  const [addRound, setAddRound] = useState("");
  const [p1, setP1] = useState(""); const [p2, setP2] = useState("");
  const [sched, setSched] = useState(""); const [venue, setVenue] = useState("");
  const [scoring, setScoring] = useState<string|null>(null);
  const [scores, setScores] = useState<Record<string,number>>({});
  const [saving, setSaving] = useState(false);

  const isTeam = comp.type==="TEAM"||comp.type==="DUO";

  // Build rounds from bracketSize: bracketSize -> bracketSize/2 -> ... -> 2
  const rounds: string[] = [];
  let r = bracketSize;
  while (r >= 2) { rounds.push(ROUND_NAMES[r] || `${r} Besar`); r = r/2; }
  if (thirdPlace) rounds.push("Perebutan Juara 3");

  const matchesByRound: Record<string, Match[]> = {};
  for (const round of rounds) matchesByRound[round] = [];
  for (const m of matches) {
    const rnd = m.round || "Lainnya";
    if (!matchesByRound[rnd]) matchesByRound[rnd] = [];
    matchesByRound[rnd].push(m);
  }

  const handleAddMatch = async () => {
    if (!addRound || !p1) { toast.error("Lengkapi data"); return; }
    setSaving(true);
    const pArr: any[] = [{ [isTeam?"teamId":"participantId"]: p1 }];
    if (p2) pArr.push({ [isTeam?"teamId":"participantId"]: p2 });
    const n1 = teams.find(t=>t.id===p1)?.name||"TBD";
    const n2 = p2 ? (teams.find(t=>t.id===p2)?.name||"TBD") : "TBD";
    await fetch("/api/matches",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      competitionId:comp.id, name:`${n1} vs ${n2}`, round:addRound, stage:"KNOCKOUT",
      scheduledAt:sched||null, venue:venue||null, participants:pArr,
    })});
    toast.success("Pertandingan ditambahkan!");
    setShowAdd(false); setP1(""); setP2(""); setSched(""); setVenue("");
    setSaving(false); onRefresh();
  };

  const handleSaveScore = async (m: Match) => {
    if (m.participants.length < 2) { toast.error("Pertandingan perlu 2 peserta"); return; }
    setSaving(true);
    const sA = scores[m.participants[0].id]??m.participants[0].score??0;
    const sB = scores[m.participants[1].id]??m.participants[1].score??0;
    const payload = [
      {id:m.participants[0].id, score:sA, result:sA>sB?"WIN":sA<sB?"LOSE":"DRAW"},
      {id:m.participants[1].id, score:sB, result:sB>sA?"WIN":sB<sA?"LOSE":"DRAW"},
    ];
    await fetch(`/api/matches/${m.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"COMPLETED",scores:payload})});
    toast.success("Skor disimpan!"); setScoring(null); setScores({});
    setSaving(false); onRefresh();
  };

  const handleDelete = async (id:string) => {
    if (!confirm("Hapus?")) return;
    await fetch(`/api/matches/${id}`,{method:"DELETE"});
    toast.success("Dihapus"); onRefresh();
  };

  const lbl = "block text-xs font-black text-[#1C1917] mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* Bracket info bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {rounds.map(rnd=>(
            <span key={rnd} className="px-3 py-1 text-xs font-black rounded-[4px] border-2 border-[#1C1917] bg-white shadow-[2px_2px_0_#1C1917]">
              {rnd} <span className="text-[#0891B2]">({matchesByRound[rnd]?.length||0})</span>
            </span>
          ))}
        </div>
        <button onClick={()=>setShowAdd(!showAdd)} className="ml-auto btn-neon px-4 py-2 text-xs flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5"/> Tambah Pertandingan
        </button>
      </div>

      {/* Add match form */}
      {showAdd && (
        <div className="neu-card p-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Babak</label>
              <select value={addRound} onChange={e=>setAddRound(e.target.value)} className="neu-input text-sm">
                <option value="">-- Pilih Babak --</option>
                {rounds.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Peserta 1</label>
              <select value={p1} onChange={e=>setP1(e.target.value)} className="neu-input text-sm">
                <option value="">-- Pilih --</option>
                {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                <option value="TBD">TBD (pemenang dari babak sebelumnya)</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Peserta 2</label>
              <select value={p2} onChange={e=>setP2(e.target.value)} className="neu-input text-sm">
                <option value="">-- Pilih / TBD --</option>
                {teams.filter(t=>t.id!==p1).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Tanggal & Jam</label>
              <input type="datetime-local" value={sched} onChange={e=>setSched(e.target.value)} className="neu-input text-sm"/>
            </div>
            <div>
              <label className={lbl}>Venue</label>
              <input value={venue} onChange={e=>setVenue(e.target.value)} className="neu-input text-sm" placeholder="Lapangan A..."/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddMatch} disabled={saving} className="btn-neon px-4 py-2 text-xs disabled:opacity-50">{saving?"...":"Tambah"}</button>
            <button onClick={()=>setShowAdd(false)} className="px-4 py-2 text-xs font-black border-2 border-[#D4D0CA] rounded-[4px] text-white">Batal</button>
          </div>
        </div>
      )}

      {/* Rounds — visual bracket column layout */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-2">
          {rounds.map((rnd,ri)=>(
            <div key={rnd} className="flex flex-col gap-3" style={{width:"220px"}}>
              {/* Round header */}
              <div className={`text-center py-2 px-3 rounded-[6px] border-[2.5px] font-black text-sm ${ri===0?"border-[#1C1917] bg-[#0891B2] text-white shadow-[3px_3px_0_#1C1917]":"border-[#D4D0CA] bg-[#F5F5F4] text-[#1C1917]"}`}>
                {rnd}
              </div>

              {/* Matches in this round */}
              <div className="space-y-3 flex-1">
                {(matchesByRound[rnd]||[]).map(m=>{
                  const pA=m.participants[0]; const pB=m.participants[1];
                  const nA=pA?.team?.name||pA?.participant?.name||"TBD";
                  const nB=pB?.team?.name||pB?.participant?.name||"TBD";
                  const isScoring = scoring===m.id;
                  return (
                    <div key={m.id} className={`rounded-[6px] border-[2.5px] border-[#1C1917] bg-white overflow-hidden ${m.status==="COMPLETED"?"shadow-[3px_3px_0_#10B981]":"shadow-[3px_3px_0_#D4D0CA]"}`}>
                      {/* Team A */}
                      <div className={`flex items-center justify-between px-3 py-2 border-b-2 border-[#E7E5E4] ${pA?.result==="WIN"?"bg-[#ECFDF5]":""}`}>
                        <span className={`text-xs font-black truncate max-w-[120px] ${pA?.result==="WIN"?"text-[#10B981]":pA?.result==="LOSE"?"text-black":"text-[#1C1917]"}`}>{nA}</span>
                        {isScoring ? (
                          <input type="number" min={0} value={scores[pA?.id]??pA?.score??0}
                            onChange={e=>setScores({...scores,[pA.id]:Number(e.target.value)})}
                            className="w-12 text-center text-xs font-black border-2 border-[#1C1917] rounded-[3px] py-0.5 bg-[#FFFBEB]"/>
                        ) : (
                          <span className={`text-sm font-black stat-number ${pA?.result==="WIN"?"text-[#10B981]":"text-[#1C1917]"}`}>
                            {m.status==="COMPLETED" ? pA?.score??0 : "-"}
                          </span>
                        )}
                      </div>
                      {/* Team B */}
                      <div className={`flex items-center justify-between px-3 py-2 ${pB?.result==="WIN"?"bg-[#ECFDF5]":""}`}>
                        <span className={`text-xs font-black truncate max-w-[120px] ${pB?.result==="WIN"?"text-[#10B981]":pB?.result==="LOSE"?"text-black":"text-[#1C1917]"}`}>{nB}</span>
                        {isScoring ? (
                          <input type="number" min={0} value={scores[pB?.id]??pB?.score??0}
                            onChange={e=>setScores({...scores,[pB.id]:Number(e.target.value)})}
                            className="w-12 text-center text-xs font-black border-2 border-[#1C1917] rounded-[3px] py-0.5 bg-[#FFFBEB]"/>
                        ) : (
                          <span className={`text-sm font-black stat-number ${pB?.result==="WIN"?"text-[#10B981]":"text-[#1C1917]"}`}>
                            {m.status==="COMPLETED" ? pB?.score??0 : "-"}
                          </span>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center justify-between px-3 py-1.5 bg-[#F5F5F4] border-t-2 border-[#E7E5E4]">
                        {m.scheduledAt&&<span className="text-[10px] text-black font-semibold">{new Date(m.scheduledAt).toLocaleString("id-ID",{dateStyle:"short",timeStyle:"short"})}</span>}
                        <div className="flex items-center gap-1 ml-auto">
                          {isScoring ? (
                            <>
                              <button onClick={()=>handleSaveScore(m)} disabled={saving} className="p-1 rounded border border-[#10B981] text-[#10B981] hover:bg-[#ECFDF5] disabled:opacity-50"><Check className="w-3 h-3"/></button>
                              <button onClick={()=>{setScoring(null);setScores({});}} className="p-1 rounded border border-[#D4D0CA] text-black"><X className="w-3 h-3"/></button>
                            </>
                          ) : (
                            <>
                              {m.status!=="COMPLETED"&&(
                                <button onClick={()=>{setScoring(m.id);const s:Record<string,number>={};m.participants.forEach(p=>s[p.id]=p.score);setScores(s);}}
                                  className="p-1 rounded border border-[#0891B2] text-[#0891B2] hover:bg-[#ECFEFF]"><Pencil className="w-3 h-3"/></button>
                              )}
                              <button onClick={()=>handleDelete(m.id)} className="p-1 rounded border border-transparent text-black hover:border-[#C2410C] hover:text-[#C2410C]"><Trash2 className="w-3 h-3"/></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(matchesByRound[rnd]||[]).length===0 && (
                  <div className="p-4 text-center text-black text-xs font-semibold border-2 border-dashed border-[#D4D0CA] rounded-[6px]">
                    Belum ada pertandingan
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
