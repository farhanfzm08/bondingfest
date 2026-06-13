"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { Pencil, Save, X, Calendar, MapPin, Clock, Timer } from "lucide-react";
import { Competition } from "./page";

// ── Time helpers ─────────────────────────────────────────────────────────────
// Parse "HH:MM:SS.mmm" → total milliseconds (for sorting)
function timeStrToMs(s: string): number {
  if (!s) return Infinity;
  const parts = s.replace(",", ".").split(":");
  if (parts.length === 3) {
    const [h, m, secMs] = parts;
    const [sec, ms = "0"] = secMs.split(".");
    return (Number(h) * 3600 + Number(m) * 60 + Number(sec)) * 1000 + Number(ms.padEnd(3, "0").slice(0, 3));
  }
  if (parts.length === 2) {
    const [m, secMs] = parts;
    const [sec, ms = "0"] = secMs.split(".");
    return (Number(m) * 60 + Number(sec)) * 1000 + Number(ms.padEnd(3, "0").slice(0, 3));
  }
  return parseFloat(s) * 1000;
}

// Format ms → "HH:MM:SS.mmm"
function msToTimeStr(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mil = ms % 1000;
  const pad = (n: number, d = 2) => String(n).padStart(d, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(mil, 3)}`;
  return `${pad(m)}:${pad(s)}.${pad(mil, 3)}`;
}

export default function TabJadwal({ comp, onScoreSaved }: { comp: Competition; onScoreSaved?: () => void }) {
  const cfg = useMemo(() => comp.config ? JSON.parse(comp.config) : {}, [comp.config]);
  const isTimeTrial = comp.format === "TIME_TRIAL";
  const sortFastest = isTimeTrial && (cfg.sortOrder === "ASC" || cfg.sortOrder === "FASTEST");

  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<{
    scheduledAt: string;
    venue: string;
    status: string;
    scores: Record<string, number>;
    timeInputs: Record<string, string>; // "MM:SS.mmm" raw input for Time Trial
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
    const timeInputs: Record<string, string> = {};
    match.participants.forEach((p: any) => {
      scores[p.id] = p.score || 0;
      timeInputs[p.id] = p.timeResult || "";
    });

    let dateStr = "";
    if (match.scheduledAt) {
      const d = new Date(match.scheduledAt);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      dateStr = d.toISOString().slice(0, 16);
    }

    setEditForm({ scheduledAt: dateStr, venue: match.venue || "", status: match.status, scores, timeInputs });
    setEditingId(match.id);
  };

  const handleSave = async (match: any) => {
    if (!editForm) return;

    try {
      let payloadScores;

      if (isTimeTrial) {
        // Time Trial: use timeInputs to derive numeric score (ms) for sorting
        payloadScores = match.participants.map((p: any) => {
          const raw = editForm.timeInputs[p.id] || "";
          const ms = raw ? timeStrToMs(raw) : 0;
          return {
            id: p.id,
            score: ms,
            timeResult: raw || null,
            result: null,
          };
        });
      } else {
        // Bracket / Group Stage: numeric scores, auto-determine winner for 1v1
        payloadScores = match.participants.map((p: any) => {
          const s = editForm.scores[p.id] ?? 0;
          let result = "DRAW";
          if (editForm.status === "COMPLETED" && match.participants.length === 2) {
            const other = match.participants.find((op: any) => op.id !== p.id);
            const otherS = editForm.scores[other?.id] ?? 0;
            if (s > otherS) result = "WIN";
            else if (s < otherS) result = "LOSE";
          }
          return { id: p.id, score: s, result: editForm.status === "COMPLETED" ? result : null };
        });
      }

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
      toast.success("✅ Jadwal dan skor berhasil disimpan!");
      setEditingId(null);
      fetchMatches();
      onScoreSaved?.();
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Memuat jadwal...</div>;
  if (matches.length === 0) return <div className="neu-card p-8 text-center text-gray-500 font-bold">Belum ada pertandingan. Tambahkan peserta atau generate bagan terlebih dahulu.</div>;

  // For Time Trial: sort by best time
  const displayMatches = isTimeTrial
    ? [...matches].sort((a, b) => {
        const msA = a.participants.map((p: any) => timeStrToMs(p.timeResult || "") || Infinity).reduce((mn: number, v: number) => Math.min(mn, v), Infinity);
        const msB = b.participants.map((p: any) => timeStrToMs(p.timeResult || "") || Infinity).reduce((mn: number, v: number) => Math.min(mn, v), Infinity);
        return sortFastest ? msA - msB : msB - msA;
      })
    : matches;

  return (
    <div className="space-y-4 pb-12">
      {isTimeTrial && (
        <div className="text-xs text-gray-500 font-semibold bg-[#FFF7ED] border border-[#FDBA74] px-4 py-2 rounded-[6px]">
          ⏱️ Format waktu: <strong>MM:SS.mmm</strong> atau <strong>HH:MM:SS.mmm</strong> &nbsp;· Contoh: <code>01:10.250</code> = 1 menit 10 detik 250 ms
        </div>
      )}

      {displayMatches.map((m, matchIdx) => {
        const isEditing = editingId === m.id;
        const isCompleted = m.status === "COMPLETED";
        const medal = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

        return (
          <div key={m.id} className={`neu-card p-4 transition-all duration-200 ${isCompleted ? "border-[#10B981] bg-[#ECFDF5]" : ""}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

              {/* Left: Match info + participants */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-black bg-[#1C1917] text-white px-2 py-0.5 rounded-[4px] uppercase">{m.round || m.stage}</span>
                  {isTimeTrial && isCompleted && <span className="text-xs font-black text-[#F97316]">#{matchIdx + 1}</span>}
                  <span className="text-sm font-black text-[#1C1917]">{m.name}</span>
                  {m.groupName && <span className="text-xs font-bold bg-[#E7E5E4] px-2 py-0.5 rounded-[4px]">{m.groupName}</span>}
                </div>

                {/* Participants grid */}
                {isTimeTrial ? (
                  // ── Time Trial layout: stacked list with time input
                  <div className="space-y-2">
                    {m.participants.map((p: any, i: number) => {
                      const sortedByTime = [...m.participants].sort((a: any, b: any) => {
                        const ma = timeStrToMs(a.timeResult || "") || Infinity;
                        const mb = timeStrToMs(b.timeResult || "") || Infinity;
                        return sortFastest ? ma - mb : mb - ma;
                      });
                      const rank = sortedByTime.findIndex((x: any) => x.id === p.id);
                      const name = p.team?.name || p.participant?.name || "TBD";
                      const displayMedal = isCompleted && p.timeResult ? medal(rank) : null;

                      return (
                        <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-[6px] border-2 ${isCompleted && p.timeResult ? "border-[#10B981] bg-white" : "border-[#E7E5E4] bg-white"}`}>
                          <span className="text-base w-8 text-center">{displayMedal || <span className="text-xs text-gray-400 font-bold">#{i+1}</span>}</span>
                          <span className="flex-1 text-sm font-black text-[#1C1917] truncate">{name}</span>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Timer className="w-4 h-4 text-[#F97316]" />
                              <input
                                type="text"
                                placeholder="MM:SS.mmm"
                                value={editForm!.timeInputs[p.id] || ""}
                                onChange={e => setEditForm({ ...editForm!, timeInputs: { ...editForm!.timeInputs, [p.id]: e.target.value } })}
                                className="w-32 font-mono text-sm text-center border-[2.5px] border-[#1C1917] rounded-[4px] py-1 px-2 bg-[#FFFBEB] focus:outline-none focus:border-[#F97316]"
                                autoFocus={i === 0}
                              />
                            </div>
                          ) : (
                            <span className="font-mono font-black text-[#0891B2] text-sm min-w-[80px] text-right">
                              {p.timeResult || <span className="text-gray-400 text-xs">Belum</span>}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // ── Bracket / Group Stage: 2-column score grid
                  <div className={`grid gap-3 ${m.participants.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                    {m.participants.map((p: any, idx: number) => (
                      <div key={p.id} className={`p-3 border-2 border-[#1C1917] rounded-[6px] bg-white ${p.result === "WIN" ? "border-[#10B981] shadow-[2px_2px_0_#10B981]" : ""}`}>
                        <div className="text-xs font-bold text-gray-500 mb-1">Tim {idx + 1}</div>
                        <div className="font-black text-sm text-[#1C1917] truncate mb-2" title={p.team?.name || p.participant?.name || "TBD"}>
                          {p.team?.name || p.participant?.name || "TBD"}
                        </div>
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={editForm!.scores[p.id] ?? 0}
                            onChange={e => setEditForm({ ...editForm!, scores: { ...editForm!.scores, [p.id]: Number(e.target.value) } })}
                            className="w-full text-center font-black border-2 border-[#1C1917] rounded-[4px] p-1 bg-[#FFFBEB] focus:outline-none focus:border-[#0891B2]"
                          />
                        ) : (
                          <div className="text-2xl font-black text-[#0891B2]">{p.score ?? "-"}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Schedule + actions */}
              <div className="md:w-[240px] flex flex-col gap-3 border-t-2 md:border-t-0 md:border-l-2 border-[#E7E5E4] pt-3 md:pt-0 md:pl-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Jadwal</label>
                      <input
                        type="datetime-local"
                        value={editForm!.scheduledAt}
                        onChange={e => setEditForm({ ...editForm!, scheduledAt: e.target.value })}
                        className="w-full text-xs font-bold border-2 border-[#1C1917] rounded-[4px] p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Venue</label>
                      <input
                        type="text"
                        value={editForm!.venue}
                        onChange={e => setEditForm({ ...editForm!, venue: e.target.value })}
                        placeholder="Lapangan Utama"
                        className="w-full text-xs font-bold border-2 border-[#1C1917] rounded-[4px] p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Status</label>
                      <select
                        value={editForm!.status}
                        onChange={e => setEditForm({ ...editForm!, status: e.target.value })}
                        className="w-full text-xs font-bold border-2 border-[#1C1917] rounded-[4px] p-1.5 bg-white"
                      >
                        <option value="SCHEDULED">Akan Datang</option>
                        <option value="ONGOING">Sedang Berlangsung</option>
                        <option value="COMPLETED">Selesai</option>
                        <option value="CANCELLED">Batal</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleSave(m)} className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white border-[2px] border-[#1C1917] shadow-[2px_2px_0_#1C1917] py-1.5 rounded-[4px] flex items-center justify-center gap-1 text-xs font-black transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                        <Save className="w-3.5 h-3.5" /> Simpan
                      </button>
                      <button onClick={() => setEditingId(null)} className="bg-red-500 hover:bg-red-600 text-white border-[2px] border-[#1C1917] shadow-[2px_2px_0_#1C1917] px-2 rounded-[4px] flex items-center justify-center transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
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
                        <span className={m.status === "COMPLETED" ? "text-[#10B981]" : m.status === "ONGOING" ? "text-[#F97316]" : "text-gray-500"}>
                          {m.status === "COMPLETED" ? "✅ Selesai" : m.status === "ONGOING" ? "🔴 Live" : m.status === "SCHEDULED" ? "📅 Terjadwal" : m.status}
                        </span>
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
