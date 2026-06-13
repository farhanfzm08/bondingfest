"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";
import { Competition } from "./page";

interface Participant { id: string; name: string; npk: string|null; section: string|null; }
interface Section { id: string; name: string; color: string; }
interface Team {
  id: string; name: string; section: string|null; groupName: string|null;
  isCollaboration: boolean; sections: string|null; sectionWeights: string|null;
  members: { participant: Participant; role: string }[];
}
interface IndividualReg { id: string; participant: Participant; }

export default function TabPeserta({ comp }: { comp: Competition }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [individuals, setIndividuals] = useState<IndividualReg[]>([]);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode] = useState<"single"|"bulk">("single");
  const [saving, setSaving] = useState(false);

  // Bulk add state (individual only)
  const [bulkText, setBulkText] = useState("");
  const [bulkSection, setBulkSection] = useState("");
  const [bulkResults, setBulkResults] = useState<{name:string; found:boolean; id?:string; alreadyIn?:boolean}[]>([]);
  const [bulkParsed, setBulkParsed] = useState(false);

  // Team form
  const [teamName, setTeamName] = useState("");
  const [teamSection, setTeamSection] = useState("");
  const [teamGroup, setTeamGroup] = useState("Grup A");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [isCollab, setIsCollab] = useState(false);
  const [collabSections, setCollabSections] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string,number>>({});

  const cfg = comp.config ? JSON.parse(comp.config) : {};
  const numGroups = cfg.numGroups || 2;
  const groupOptions = Array.from({length:numGroups},(_,i)=>`Grup ${String.fromCharCode(65+i)}`);

  const fetchData = useCallback(async () => {
    const [regRes, partRes, secRes] = await Promise.all([
      fetch(`/api/competitions/${comp.id}/participants`),
      fetch(`/api/participants`),
      fetch(`/api/sections`),
    ]);
    const reg = await regRes.json();
    setTeams(reg.teams || []);
    setIndividuals(reg.individuals || []);
    const parts = await partRes.json();
    setAllParticipants(Array.isArray(parts) ? parts : []);
    const secs = await secRes.json();
    setSections(Array.isArray(secs) ? secs : []);
  }, [comp.id]);

  useEffect(()=>{ fetchData(); },[fetchData]);

  const totalWeight = collabSections.reduce((s,sec)=>(s + (weights[sec]||0)),0);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const body = comp.type === "TEAM" || comp.type === "DUO"
        ? {
            teamName: teamName||`Tim ${teamSection}`,
            section: isCollab ? null : teamSection,
            groupName: comp.format==="GROUP_STAGE" ? teamGroup : null,
            memberIds,
            isCollaboration: isCollab,
            sections: isCollab ? collabSections : null,
            sectionWeights: isCollab ? weights : null,
          }
        : { participantId: memberIds[0] };

      const r = await fetch(`/api/competitions/${comp.id}/participants`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body),
      });
      if (!r.ok) { const e=await r.json(); throw new Error(e.error); }
      toast.success("Peserta ditambahkan!");
      setShowForm(false);
      setTeamName(""); setTeamSection(""); setMemberIds([]); setIsCollab(false); setCollabSections([]); setWeights({});
      fetchData();
    } catch(e:any) { toast.error(e.message||"Gagal menambahkan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (teamId?: string, participantId?: string) => {
    if (!confirm("Hapus peserta/tim ini?")) return;
    const q = teamId ? `?teamId=${teamId}` : `?participantId=${participantId}`;
    await fetch(`/api/competitions/${comp.id}/participants${q}`, { method:"DELETE" });
    toast.success("Dihapus"); fetchData();
  };

  // Bulk: parse names against allParticipants list
  const handleBulkParse = () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    const registeredIds = new Set(individuals.map(r => r.participant.id));
    const results = lines.map(name => {
      const found = allParticipants.find(p =>
        p.name.toLowerCase() === name.toLowerCase() &&
        (!bulkSection || p.section === bulkSection)
      );
      return { name, found: !!found, id: found?.id, alreadyIn: found ? registeredIds.has(found.id) : false };
    });
    setBulkResults(results);
    setBulkParsed(true);
  };

  const handleBulkRegister = async () => {
    const toAdd = bulkResults.filter(r => r.found && !r.alreadyIn && r.id);
    if (toAdd.length === 0) { toast.error("Tidak ada peserta baru yang bisa ditambahkan"); return; }
    setSaving(true);
    let added = 0;
    for (const r of toAdd) {
      try {
        const res = await fetch(`/api/competitions/${comp.id}/participants`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: r.id }),
        });
        if (res.ok) added++;
      } catch {}
    }
    toast.success(`${added} peserta berhasil ditambahkan!`);
    setBulkText(""); setBulkParsed(false); setBulkResults([]); setShowForm(false);
    setSaving(false);
    fetchData();
  };

  const toggleWeight = (sec: string, val: number) => {
    setWeights(prev => ({...prev, [sec]: Math.max(0, Math.min(100, val))}));
  };

  const isTeam = comp.type === "TEAM" || comp.type === "DUO";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-black text-sm font-semibold">
          {isTeam ? `${teams.length} tim terdaftar` : `${individuals.length} peserta terdaftar`}
        </p>
        <div className="flex gap-2">
          {!isTeam && (
            <button onClick={() => { setShowForm(true); setAddMode("bulk"); }}
              className="neu-btn neu-btn-white px-4 py-2 text-sm flex items-center gap-2">
              ⚡ Bulk Add
            </button>
          )}
          <button onClick={() => { setShowForm(!showForm); setAddMode("single"); setBulkParsed(false); setBulkText(""); setBulkResults([]); }}
            className="btn-neon px-4 py-2 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4"/> Tambah {isTeam?"Tim":"Peserta"}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="neu-card p-5 space-y-4">
          {/* Mode switcher for individual */}
          {!isTeam && (
            <div className="flex gap-1 p-1 bg-[#F5F5F4] rounded-[6px] border-2 border-[#1C1917] w-fit">
              <button onClick={() => { setAddMode("single"); setBulkParsed(false); }}
                className={`px-3 py-1 text-xs font-black rounded-[4px] transition-all ${addMode==="single"?"bg-[#0891B2] text-white":"text-[#1C1917] hover:bg-white"}`}>
                ➕ Satu per Satu
              </button>
              <button onClick={() => setAddMode("bulk")}
                className={`px-3 py-1 text-xs font-black rounded-[4px] transition-all ${addMode==="bulk"?"bg-[#0891B2] text-white":"text-[#1C1917] hover:bg-white"}`}>
                ⚡ Bulk (Banyak Sekaligus)
              </button>
            </div>
          )}

          {/* Bulk add mode */}
          {!isTeam && addMode === "bulk" && (
            <div className="space-y-3">
              <h3 className="font-black text-[#1C1917]">⚡ Tambah Banyak Peserta Sekaligus</h3>
              <p className="text-xs text-gray-600">Tempel daftar nama peserta, satu per baris. Sistem akan mencocokkan dengan database peserta yang sudah terdaftar di event.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1C1917] mb-1.5 uppercase tracking-wider">Filter Seksi (Opsional)</label>
                  <select value={bulkSection} onChange={e=>setBulkSection(e.target.value)} className="neu-input text-sm">
                    <option value="">-- Semua Seksi --</option>
                    {sections.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-[#1C1917] mb-1.5 uppercase tracking-wider">Daftar Nama (satu per baris)</label>
                <textarea
                  value={bulkText}
                  onChange={e=>{setBulkText(e.target.value); setBulkParsed(false); setBulkResults([]);}}
                  placeholder={`Budi Santoso\nSiti Rahayu\nAhmad Fauzi\n...`}
                  rows={8}
                  className="w-full border-[2.5px] border-[#1C1917] rounded-[6px] px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:shadow-[2px_2px_0_#0891B2] resize-y"
                />
                <p className="text-xs text-gray-500 mt-1">{bulkText.split("\n").filter(l=>l.trim()).length} baris terdeteksi</p>
              </div>

              {/* Parse result */}
              {bulkParsed && bulkResults.length > 0 && (
                <div className="border-[2.5px] border-[#1C1917] rounded-[6px] overflow-hidden">
                  <div className="bg-[#FFFBEB] px-4 py-2 flex items-center justify-between text-xs font-black text-[#1C1917] border-b-2 border-[#E7E5E4]">
                    <span>Hasil Pencocokan: {bulkResults.filter(r=>r.found&&!r.alreadyIn).length} bisa ditambahkan</span>
                    <span className="text-gray-500">{bulkResults.filter(r=>!r.found).length} tidak ditemukan · {bulkResults.filter(r=>r.alreadyIn).length} sudah terdaftar</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-[#E7E5E4]">
                    {bulkResults.map((r, i) => (
                      <div key={i} className={`flex items-center gap-3 px-4 py-2 text-sm ${
                        r.alreadyIn ? "bg-gray-50 text-gray-400" : r.found ? "bg-[#ECFDF5]" : "bg-[#FEF2F2]"
                      }`}>
                        <span className="text-base">{r.alreadyIn ? "✅" : r.found ? "🟢" : "🔴"}</span>
                        <span className="font-semibold flex-1">{r.name}</span>
                        <span className="text-xs text-gray-500">
                          {r.alreadyIn ? "Sudah terdaftar" : r.found ? "Ditemukan" : "Tidak ditemukan di database"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t-2 border-[#E7E5E4]">
                {!bulkParsed ? (
                  <button onClick={handleBulkParse} disabled={!bulkText.trim()}
                    className="btn-neon px-5 py-2 text-sm disabled:opacity-50">🔍 Cek & Cocokkan</button>
                ) : (
                  <button onClick={handleBulkRegister} disabled={saving || bulkResults.filter(r=>r.found&&!r.alreadyIn).length===0}
                    className="btn-neon px-5 py-2 text-sm disabled:opacity-50">
                    {saving ? "Mendaftarkan..." : `✅ Daftarkan ${bulkResults.filter(r=>r.found&&!r.alreadyIn).length} Peserta`}
                  </button>
                )}
                <button onClick={()=>setShowForm(false)} className="neu-btn neu-btn-white px-5 py-2 text-sm">Batal</button>
              </div>
            </div>
          )}

          {/* Single add mode */}
          {(isTeam || addMode === "single") && (
            <>
              <h3 className="font-black text-[#1C1917]">➕ {isTeam?"Tim Baru":"Daftarkan Peserta"}</h3>

          {isTeam && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#1C1917] mb-1.5 uppercase tracking-wider">Nama Tim</label>
                  <input value={teamName} onChange={e=>setTeamName(e.target.value)} className="neu-input" placeholder="Tim Futsal Produksi A"/>
                </div>
                {comp.format==="GROUP_STAGE" && (
                  <div>
                    <label className="block text-xs font-black text-[#1C1917] mb-1.5 uppercase tracking-wider">Grup</label>
                    <select value={teamGroup} onChange={e=>setTeamGroup(e.target.value)} className="neu-input">
                      {groupOptions.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Kolaborasi Toggle */}
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-[6px] border-2 border-[#D4D0CA] hover:border-[#F97316] w-fit">
                <input type="checkbox" checked={isCollab} onChange={e=>setIsCollab(e.target.checked)} className="w-4 h-4 accent-[#F97316]"/>
                <span className="text-sm font-black text-[#1C1917]">🤝 Tim Kolaborasi Antar-Seksi</span>
              </label>

              {isCollab && (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#1C1917] uppercase tracking-wider">Seksi yang Terlibat + Bobot Poin</label>
                  <div className="space-y-2">
                    {sections.map(s=>{
                      const checked = collabSections.includes(s.name);
                      return (
                        <div key={s.id} className={`flex items-center gap-3 p-2.5 rounded-[6px] border-2 transition-all ${checked?"border-[#1C1917] bg-[#FFFBEB]":"border-[#E7E5E4]"}`}>
                          <input type="checkbox" checked={checked}
                            onChange={e=>{
                              if(e.target.checked){ setCollabSections(prev=>[...prev,s.name]); setWeights(prev=>({...prev,[s.name]:Math.floor(100/(collabSections.length+1))})); }
                              else { setCollabSections(prev=>prev.filter(x=>x!==s.name)); setWeights(prev=>{const n={...prev};delete n[s.name];return n;}); }
                            }}
                            className="w-4 h-4 accent-[#0891B2]"
                          />
                          <span className="text-sm font-black text-[#1C1917] flex-1">{s.name}</span>
                          {checked && (
                            <div className="flex items-center gap-1">
                              <input type="number" value={weights[s.name]||0} min={0} max={100}
                                onChange={e=>toggleWeight(s.name,Number(e.target.value))}
                                className="w-16 text-center text-sm font-black border-2 border-[#1C1917] rounded-[4px] py-1 bg-white"/>
                              <span className="text-xs font-black text-black">%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {collabSections.length > 0 && (
                    <div className={`text-xs font-black px-3 py-1 rounded-[4px] border-2 w-fit ${totalWeight===100?"border-[#10B981] text-[#10B981] bg-[#ECFDF5]":"border-[#F97316] text-[#F97316] bg-[#FFF7ED]"}`}>
                      Total bobot: {totalWeight}% {totalWeight===100?"✅":"(harus 100%)"}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!isCollab && (
            <div>
              <label className="block text-xs font-black text-[#1C1917] mb-1.5 uppercase tracking-wider">
                {isTeam ? "Seksi Tim & Filter Peserta" : "Filter Seksi / Asal Seksi"}
              </label>
              <select value={teamSection} onChange={e=>setTeamSection(e.target.value)} className="neu-input">
                <option value="">{isTeam ? "-- Pilih Seksi Tim --" : "-- Semua Seksi --"}</option>
                {sections.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* Pilih Anggota */}
          <div>
            <label className="block text-xs font-black text-[#1C1917] mb-1.5 uppercase tracking-wider">
              {isTeam?"Pilih Anggota Tim":"Pilih Peserta"}
            </label>
            <div className="max-h-48 overflow-y-auto border-[2.5px] border-[#1C1917] rounded-[6px] divide-y divide-[#E7E5E4]">
              {allParticipants
                .filter(p => {
                  if (isCollab) {
                    return collabSections.length === 0 || collabSections.includes(p.section || "");
                  } else {
                    return !teamSection || p.section === teamSection;
                  }
                })
                .map(p=>{
                const selected = memberIds.includes(p.id);
                return (
                  <label key={p.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#FFFBEB] ${selected?"bg-[#ECFEFF]":""}`}>
                    <input type={isTeam?"checkbox":"radio"} name="participants" checked={selected}
                      onChange={e=>{ if(isTeam){ setMemberIds(prev=>e.target.checked?[...prev,p.id]:prev.filter(x=>x!==p.id)); }else{ setMemberIds([p.id]); }}}
                      className="w-4 h-4 accent-[#0891B2]"
                    />
                    <span className="text-sm text-[#1C1917] font-semibold">{p.name}</span>
                    <span className="text-xs text-black ml-auto">{p.section}</span>
                  </label>
                );
              })}
              {allParticipants.filter(p => {
                  if (isCollab) return collabSections.length === 0 || collabSections.includes(p.section || "");
                  return !teamSection || p.section === teamSection;
                }).length === 0 && (
                <div className="p-4 text-center text-sm font-bold text-gray-500">
                  Tidak ada peserta di seksi ini.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t-2 border-[#E7E5E4]">
            <button onClick={handleAdd} disabled={saving||memberIds.length===0||(isCollab&&totalWeight!==100)}
              className="btn-neon px-5 py-2 text-sm disabled:opacity-50">
              {saving?"Menyimpan...":"Tambahkan"}
            </button>
            <button onClick={()=>setShowForm(false)} className="neu-btn neu-btn-white px-5 py-2 text-sm">Batal</button>
          </div>
            </>
          )}
        </div>
      )}

      {/* Teams List */}
      {isTeam ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {teams.map(t=>(
            <div key={t.id} className={`p-4 rounded-[6px] border-[2.5px] border-[#1C1917] bg-white shadow-[3px_3px_0_${t.isCollaboration?"#F97316":"#1C1917"}]`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-black text-[#1C1917] text-sm">{t.name}</div>
                  {t.isCollaboration
                    ? <div className="text-xs font-bold text-[#F97316] mt-0.5">🤝 Kolaborasi: {t.sections ? JSON.parse(t.sections).join(", ") : "-"}</div>
                    : <div className="text-xs text-black font-semibold mt-0.5">{t.section}</div>
                  }
                  {t.groupName && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-[3px] border border-[#1C1917] bg-[#FFFBEB]">{t.groupName}</span>}
                </div>
                <button onClick={()=>handleDelete(t.id)} className="text-black hover:text-[#C2410C] p-1">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.members.map(m=>(
                  <span key={m.participant.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F4] text-black font-semibold">
                    {m.role==="CAPTAIN"?"©":""}  {m.participant.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="neu-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-[#FFFBEB] border-b-2 border-[#E7E5E4]">
              <th className="text-left px-4 py-3 text-xs font-black text-[#1C1917] uppercase">Peserta</th>
              <th className="text-left px-4 py-3 text-xs font-black text-[#1C1917] uppercase hidden sm:table-cell">NPK</th>
              <th className="text-left px-4 py-3 text-xs font-black text-[#1C1917] uppercase">Seksi</th>
              <th className="px-4 py-3"/>
            </tr></thead>
            <tbody>
              {individuals.map(reg=>(
                <tr key={reg.id} className="border-b-2 border-[#E7E5E4] hover:bg-[#FFFBEB]">
                  <td className="px-4 py-3 text-sm font-black text-[#1C1917]">{reg.participant.name}</td>
                  <td className="px-4 py-3 text-xs text-black hidden sm:table-cell">{reg.participant.npk}</td>
                  <td className="px-4 py-3 text-xs text-black font-semibold">{reg.participant.section}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={()=>handleDelete(undefined,reg.participant.id)} className="text-black hover:text-[#C2410C]"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
              {individuals.length===0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-black font-bold"><Users className="w-8 h-8 mx-auto mb-2 opacity-30"/>Belum ada peserta terdaftar</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
