"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Trophy, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getMedalEmoji } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

interface Standing {
  id: string;
  section: string;
  totalPoints: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  rank: number;
}

const COLORS = ["#F59E0B", "#0891B2", "#10B981", "#F97316", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"];
const RANK_BG: Record<number, string> = { 1: "#FCD34D", 2: "#E2E8F0", 3: "#FDE68A" };

export default function AdminKlasemenPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchStandings = async () => {
    try {
      const res = await fetch("/api/overall-standings");
      const data = await res.json();
      setStandings(Array.isArray(data) ? data : []);
    } catch { toast.error("Gagal memuat"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStandings(); }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch("/api/overall-standings", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStandings(data);
      toast.success("Klasemen berhasil diperbarui!");
    } catch { toast.error("Gagal menghitung ulang"); }
    finally { setRecalculating(false); }
  };

  const shortName = (sec: string) => (sec || "").replace("Seksi ", "").split(" ").slice(0, 2).join(" ");

  const chartData = standings.map((s) => ({
    name: shortName(s.section),
    fullName: s.section,
    poin: s.totalPoints,
    emas: s.goldCount,
  }));

  const pieData = standings.slice(0, 8).map((s, i) => ({
    name: shortName(s.section),
    value: s.totalPoints,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">Klasemen Juara Umum</h1>
          <p className="text-black text-sm font-semibold">{standings.length} seksi dalam klasemen</p>
        </div>
        <button
          id="recalculate-btn"
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2 rounded-[6px] border-[2.5px] border-[#1C1917] bg-[#ECFEFF] text-[#0E7490] font-black text-sm shadow-[3px_3px_0_#0891B2] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`} />
          Hitung Ulang dari Juara
        </button>
      </div>

      {/* Podium */}
      {standings.length >= 3 && (
        <div className="neu-card p-6">
          <h2 className="text-[#1C1917] font-black mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#F59E0B]" /> Podium Juara Umum
          </h2>
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto items-end">
            {[standings[1], standings[0], standings[2]].map((s, displayIdx) => {
              const actualRank = displayIdx === 0 ? 2 : displayIdx === 1 ? 1 : 3;
              const heights = ["h-36", "h-48", "h-32"];
              const bgColor = actualRank === 1 ? "#FFFBEB" : actualRank === 2 ? "#F8FAFC" : "#FEF3C7";
              const shadowColor = actualRank === 1 ? "#F59E0B" : actualRank === 2 ? "#6B7280" : "#B45309";
              return (
                <div
                  key={s?.id || displayIdx}
                  className={`${heights[displayIdx]} rounded-[6px] border-[2.5px] border-[#1C1917] flex flex-col items-center pb-4 px-2 text-center`}
                  style={{ background: bgColor, boxShadow: `4px 4px 0 ${shadowColor}` }}
                >
                  <div className="text-3xl mt-3 mb-auto">{getMedalEmoji(actualRank)}</div>
                  <div className="text-[#1C1917] text-xs font-black leading-tight mb-1">{shortName(s?.section || "")}</div>
                  <div className="text-xl font-black stat-number leading-none" style={{ color: shadowColor }}>{s?.totalPoints || 0}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="neu-card p-5">
          <h2 className="text-[#1C1917] font-black mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0891B2]" /> Poin per Seksi
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis dataKey="name" tick={{ fill: "#78716C", fontSize: 10, fontWeight: 700 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: "#78716C", fontSize: 11, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{ background: "#FFFDF5", border: "2.5px solid #1C1917", borderRadius: "6px", boxShadow: "3px 3px 0 #1C1917", color: "#1C1917", fontWeight: 700 }}
                labelFormatter={(_, p) => p?.[0]?.payload?.fullName}
              />
              <Bar dataKey="poin" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#1C1917" strokeWidth={1.5} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="neu-card p-5">
          <h2 className="text-[#1C1917] font-black mb-4">Distribusi Poin</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent||0) * 100).toFixed(0)}%`}
                labelLine={false} fontSize={10}
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="#1C1917" strokeWidth={1.5} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#FFFDF5", border: "2.5px solid #1C1917", borderRadius: "6px", color: "#1C1917", fontWeight: 700 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="neu-card overflow-hidden">
        <div className="px-5 py-4 border-b-[2.5px] border-[#1C1917] bg-[#FFFBEB]">
          <h2 className="text-[#1C1917] font-black">Tabel Klasemen Lengkap</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b-[2px] border-[#E7E5E4] bg-[#FFFDF5]">
              <th className="text-left px-5 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider">Rank</th>
              <th className="text-left px-5 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider">Seksi</th>
              <th className="text-center px-4 py-3 text-[#F59E0B] text-xs font-black">🥇</th>
              <th className="text-center px-4 py-3 text-[#6B7280] text-xs font-black hidden sm:table-cell">🥈</th>
              <th className="text-center px-4 py-3 text-[#B45309] text-xs font-black hidden sm:table-cell">🥉</th>
              <th className="text-right px-5 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider">Total Poin</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b-[2px] border-[#E7E5E4]">
                  <td colSpan={6} className="px-5 py-4"><div className="h-4 shimmer rounded" /></td>
                </tr>
              ))
            ) : standings.map((s) => (
              <tr key={s.id} className="border-b-[2px] border-[#E7E5E4] hover:bg-[#FFFBEB] transition-colors">
                <td className="px-5 py-4">
                  <span className="w-8 h-8 rounded-[4px] border-2 border-[#1C1917] flex items-center justify-center font-black text-sm"
                    style={{ background: RANK_BG[s.rank] || "#FFFFFF" }}>
                    {s.rank <= 3 ? getMedalEmoji(s.rank) : `#${s.rank}`}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#1C1917] font-black text-sm">{s.section}</td>
                <td className="px-4 py-4 text-center text-[#F59E0B] font-black">{s.goldCount}</td>
                <td className="px-4 py-4 text-center text-[#6B7280] font-black hidden sm:table-cell">{s.silverCount}</td>
                <td className="px-4 py-4 text-center text-[#B45309] font-black hidden sm:table-cell">{s.bronzeCount}</td>
                <td className="px-5 py-4 text-right text-[#0891B2] font-black text-xl stat-number">{s.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && standings.length === 0 && (
          <div className="p-12 text-center text-black">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">Belum ada data klasemen. Tetapkan juara lomba terlebih dahulu.</p>
          </div>
        )}
      </div>
    </div>
  );
}
