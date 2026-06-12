"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { Pencil, Save, X, Calendar, MapPin, Clock } from "lucide-react";
import { Competition } from "./page";

export default function TabJadwal({ comp }: { comp: Competition }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [editForm, setEditForm] = useState<{
    scheduledAt: string;
    venue: string;
    status: string;
    scores: Record<string, number>;
  } | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches?competitionId=${comp.id}`);
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch { toast.error("Gagal memuat jadwal"); }
    finally { setLoading(false); }
  }, [comp.id]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const handleEdit = (match: any) => {
    const scores: Record<string, number> = {};
    match.participants.forEach((p: any) => scores[p.id] = p.score || 0);
    
    // Convert date for datetime-local input
    let dateStr = "";
    if (match.scheduledAt) {
      const d = new Date(match.scheduledAt);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      dateStr = d.toISOString().slice(0, 16);
    }

    setEditForm({
      scheduledAt: dateStr,
      venue: match.venue || "",
      status: match.status,
      scores,
    });
    setEditingId(match.id);
  };

  const handleSave = async (match: any) => {
    if (!editForm) return;
    
    try {
      // Determine winner if completed
      const payloadScores = match.participants.map((p: any) => {
        const s = editForm.scores[p.id] || 0;
        let result = "DRAW";
        if (editForm.status === "COMPLETED") {
           // For simple 1v1 bracket/group stage
           if (match.participants.length === 2) {
             const otherP = match.participants.find((op: any) => op.id !== p.id);
             const otherS = editForm.scores[otherP?.id] || 0;
             if (s > otherS) result = "WIN";
             else if (s < otherS) result = "LOSE";
           }
        }
        return { id: p.id, score: s, result: editForm.status === "COMPLETED" ? result : null };
      });

      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: editForm.scheduledAt ? new Date(editForm.scheduledAt).toISOString() : null,
          venue: editForm.venue,
          status: editForm.status,
          scores: payloadScores,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("Jadwal dan skor berhasil disimpan!");
      setEditingId(null);
      fetchMatches();
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Memuat jadwal...</div>;
  if (matches.length === 0) return <div className="neu-card p-8 text-center text-gray-500 font-bold">Belum ada pertandingan di kompetisi ini.</div>;

  return (
    <div className="space-y-4 pb-12">
      {matches.map(m => {
        const isEditing = editingId === m.id;
        
        return (
          <div key={m.id} className={`neu-card p-4 transition-all duration-200 ${m.status==="COMPLETED"?"border-[#10B981] bg-[#ECFDF5]":""}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              
              {/* Left Side: Match Info & Participants */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-black bg-[#1C1917] text-white px-2 py-0.5 rounded-[4px] uppercase">{m.round || m.stage}</span>
                  <span className="text-sm font-black text-[#1C1917]">{m.name}</span>
                  {m.groupName && <span className="text-xs font-bold bg-[#E7E5E4] px-2 py-0.5 rounded-[4px]">Grup {m.groupName}</span>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Team A */}
                  <div className={`p-3 border-2 border-[#1C1917] rounded-[6px] bg-white ${m.participants[0]?.result==="WIN"?"border-[#10B981] shadow-[2px_2px_0_#10B981]":""}`}>
                    <div className="text-xs font-bold text-gray-500 mb-1">Tim 1</div>
                    <div className="font-black text-sm text-[#1C1917] truncate mb-2">
                      {m.participants[0]?.team?.name || m.participants[0]?.participant?.name || "TBD"}
                    </div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editForm!.scores[m.participants[0]?.id] || 0}
                        onChange={e => setEditForm({...editForm!, scores: {...editForm!.scores, [m.participants[0]?.id]: Number(e.target.value)}})}
                        className="w-full text-center font-black border-2 border-[#1C1917] rounded-[4px] p-1 bg-[#FFFBEB]"
                      />
                    ) : (
                      <div className="text-2xl font-black text-[#0891B2]">{m.participants[0]?.score ?? "-"}</div>
                    )}
                  </div>

                  {/* Team B */}
                  {m.participants.length > 1 && (
                    <div className={`p-3 border-2 border-[#1C1917] rounded-[6px] bg-white ${m.participants[1]?.result==="WIN"?"border-[#10B981] shadow-[2px_2px_0_#10B981]":""}`}>
                      <div className="text-xs font-bold text-gray-500 mb-1">Tim 2</div>
                      <div className="font-black text-sm text-[#1C1917] truncate mb-2">
                        {m.participants[1]?.team?.name || m.participants[1]?.participant?.name || "TBD"}
                      </div>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editForm!.scores[m.participants[1]?.id] || 0}
                          onChange={e => setEditForm({...editForm!, scores: {...editForm!.scores, [m.participants[1]?.id]: Number(e.target.value)}})}
                          className="w-full text-center font-black border-2 border-[#1C1917] rounded-[4px] p-1 bg-[#FFFBEB]"
                        />
                      ) : (
                        <div className="text-2xl font-black text-[#0891B2]">{m.participants[1]?.score ?? "-"}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Schedule & Actions */}
              <div className="md:w-[250px] flex flex-col gap-3 border-t-2 md:border-t-0 md:border-l-2 border-[#E7E5E4] pt-3 md:pt-0 md:pl-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Jadwal</label>
                      <input 
                        type="datetime-local" 
                        value={editForm!.scheduledAt}
                        onChange={e => setEditForm({...editForm!, scheduledAt: e.target.value})}
                        className="w-full text-xs font-bold border-2 border-[#1C1917] rounded-[4px] p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Venue</label>
                      <input 
                        type="text" 
                        value={editForm!.venue}
                        onChange={e => setEditForm({...editForm!, venue: e.target.value})}
                        placeholder="Lapangan Utama"
                        className="w-full text-xs font-bold border-2 border-[#1C1917] rounded-[4px] p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Status</label>
                      <select 
                        value={editForm!.status}
                        onChange={e => setEditForm({...editForm!, status: e.target.value})}
                        className="w-full text-xs font-bold border-2 border-[#1C1917] rounded-[4px] p-1.5 bg-white"
                      >
                        <option value="SCHEDULED">Akan Datang</option>
                        <option value="ONGOING">Sedang Berlangsung</option>
                        <option value="COMPLETED">Selesai</option>
                        <option value="CANCELLED">Batal</option>
                      </select>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleSave(m)} className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white border-[2px] border-[#1C1917] shadow-[2px_2px_0_#1C1917] py-1.5 rounded-[4px] flex items-center justify-center gap-1 text-xs font-black transition-all">
                        <Save className="w-3.5 h-3.5" /> Simpan
                      </button>
                      <button onClick={() => setEditingId(null)} className="bg-red-500 hover:bg-red-600 text-white border-[2px] border-[#1C1917] shadow-[2px_2px_0_#1C1917] px-2 rounded-[4px] flex items-center justify-center transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {m.scheduledAt ? formatDateTime(m.scheduledAt) : "Belum diatur"}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        <MapPin className="w-3.5 h-3.5" />
                        {m.venue || "Belum diatur"}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        Status: <span className={m.status==="COMPLETED"?"text-[#10B981]":""}>{m.status}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEdit(m)}
                      className="mt-auto neu-btn neu-btn-white text-xs py-1.5 flex justify-center w-full"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Atur Jadwal & Skor
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
