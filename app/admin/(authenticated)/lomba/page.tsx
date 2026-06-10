"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, Eye, Swords, Trophy, Users, Timer, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { cn, getStatusColor, getStatusLabel } from "@/lib/utils";

// ─── Format definitions ────────────────────────────────────────────────────
const FORMAT_OPTIONS = [
  {
    value: "BRACKET",
    label: "Sistem Gugur",
    emoji: "🏆",
    desc: "Tim kalah langsung gugur. Berlanjut sampai final.",
    color: "#F97316",
    bg: "#FFF7ED",
    shadow: "3px 3px 0 #F97316",
  },
  {
    value: "GROUP_STAGE",
    label: "Fase Grup",
    emoji: "👥",
    desc: "Semua tim bertemu di grup. Terbaik lanjut ke knockout.",
    color: "#0891B2",
    bg: "#ECFEFF",
    shadow: "3px 3px 0 #0891B2",
  },
  {
    value: "TIME_TRIAL",
    label: "Time Trial / Ranking",
    emoji: "⏱️",
    desc: "Dinilai berdasar waktu, skor, atau nilai. Ranking menentukan juara.",
    color: "#10B981",
    bg: "#ECFDF5",
    shadow: "3px 3px 0 #10B981",
  },
];

const TYPE_OPTIONS = [
  { value: "INDIVIDUAL", label: "Perorangan", icon: "🧑", desc: "1 peserta mewakili seksinya" },
  { value: "DUO", label: "Duo / Berpasangan", icon: "👫", desc: "2 peserta dari 1 seksi" },
  { value: "TEAM", label: "Beregu / Tim", icon: "⚽", desc: "Tim dengan nama, mewakili 1 seksi" },
];

interface Competition {
  id: string;
  name: string;
  slug: string;
  status: string;
  type: string;
  format: string;
  category: string | null;
  _count: { teams: number; compParticipants: number; matches: number; champions: number };
}

const defaultForm = {
  name: "", description: "", status: "UPCOMING", type: "INDIVIDUAL",
  format: "BRACKET", category: "", venue: "", rules: "", order: "0",
};

export default function AdminLombaPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchCompetitions = async () => {
    try {
      const res = await fetch("/api/competitions");
      const data = await res.json();
      setCompetitions(Array.isArray(data) ? data : []);
    } catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompetitions(); }, []);

  const filtered = competitions.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/competitions/${editingId}` : "/api/competitions";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Lomba diperbarui!" : "Lomba baru ditambahkan!");
      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
      fetchCompetitions();
    } catch { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus lomba "${name}"?`)) return;
    try {
      await fetch(`/api/competitions/${id}`, { method: "DELETE" });
      toast.success("Lomba dihapus");
      fetchCompetitions();
    } catch { toast.error("Gagal menghapus"); }
  };

  const handleEdit = (comp: Competition) => {
    setEditingId(comp.id);
    setForm({ ...defaultForm, name: comp.name, status: comp.status, type: comp.type, format: comp.format || "BRACKET", category: comp.category || "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatInfo = (format: string) => FORMAT_OPTIONS.find(f => f.value === format) || FORMAT_OPTIONS[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">Kelola Lomba</h1>
          <p className="text-black text-sm font-medium">{competitions.length} lomba terdaftar</p>
        </div>
        <button
          id="add-lomba-btn"
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(defaultForm); }}
          className="btn-neon text-sm px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {showForm && !editingId ? "Batal" : "Tambah Lomba"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="neu-card p-6">
          <h2 className="text-[#1C1917] font-black text-lg mb-5 border-b-[3px] border-[#1C1917] pb-3">
            {editingId ? "✏️ Edit Lomba" : "➕ Tambah Lomba Baru"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nama & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Nama Lomba *</label>
                <input
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Lomba Futsal" required
                  className="neu-input"
                />
              </div>
              <div>
                <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Kategori</label>
                <input
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Olahraga, Seni, Kuliner..."
                  className="neu-input"
                />
              </div>
              <div>
                <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Venue / Lokasi</label>
                <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Lapangan A, Gedung B" className="neu-input" />
              </div>
              <div>
                <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="neu-input">
                  {["UPCOMING", "REGISTRATION", "ONGOING", "COMPLETED"].map((s) => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipe Peserta */}
            <div>
              <label className="block text-[#1C1917] text-xs font-black mb-3 uppercase tracking-wider">Tipe Peserta</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={cn(
                      "p-3 text-left rounded-[6px] border-[2.5px] transition-all duration-100",
                      form.type === t.value
                        ? "border-[#1C1917] bg-[#FEF3C7] shadow-[3px_3px_0_#1C1917] -translate-x-[1px] -translate-y-[1px]"
                        : "border-[#D4D0CA] bg-white hover:border-[#1C1917] hover:shadow-[2px_2px_0_#D4D0CA]"
                    )}
                  >
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="font-black text-sm text-[#1C1917]">{t.label}</div>
                    <div className="text-black text-xs mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Lomba — Visual Card Selector */}
            <div>
              <label className="block text-[#1C1917] text-xs font-black mb-3 uppercase tracking-wider">Format / Sistem Perlombaan</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setForm({ ...form, format: f.value })}
                    className={cn(
                      "p-4 text-left rounded-[6px] border-[2.5px] transition-all duration-100",
                      form.format === f.value
                        ? "border-[#1C1917] -translate-x-[2px] -translate-y-[2px]"
                        : "border-[#D4D0CA] bg-white hover:border-[#1C1917]"
                    )}
                    style={form.format === f.value
                      ? { backgroundColor: f.bg, boxShadow: f.shadow }
                      : {}}
                  >
                    <div className="text-3xl mb-2">{f.emoji}</div>
                    <div className="font-black text-sm text-[#1C1917] mb-1">{f.label}</div>
                    <div className="text-black text-xs leading-relaxed">{f.desc}</div>
                    {form.format === f.value && (
                      <div
                        className="mt-2 inline-block text-[10px] font-black px-2 py-0.5 rounded-[4px] border-2 border-[#1C1917] text-black uppercase"
                        style={{ backgroundColor: f.color }}
                      >
                        ✓ Dipilih
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Deskripsi & Peraturan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat lomba..." rows={3} className="neu-input resize-none" />
              </div>
              <div>
                <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Peraturan</label>
                <textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="Peraturan dan ketentuan..." rows={3} className="neu-input resize-none" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t-[2px] border-[#E7E5E4]">
              <button type="submit" disabled={saving} className="btn-neon px-6 py-2.5 text-sm disabled:opacity-50">
                {saving ? "Menyimpan..." : editingId ? "Perbarui Lomba" : "Simpan Lomba"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="neu-btn neu-btn-white px-6 py-2.5 text-sm">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari lomba..."
          className="neu-input pl-11"
        />
      </div>

      {/* Table */}
      <div className="neu-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-[2.5px] border-[#1C1917] bg-[#FFFBEB]">
              <th className="text-left px-5 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider">Lomba</th>
              <th className="text-left px-4 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider hidden sm:table-cell">Format</th>
              <th className="text-left px-4 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider hidden md:table-cell">Tipe</th>
              <th className="text-left px-4 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b-[2px] border-[#E7E5E4]">
                  <td className="px-5 py-4" colSpan={5}><div className="h-4 shimmer rounded" /></td>
                </tr>
              ))
            ) : filtered.map((comp) => {
              const fmt = formatInfo(comp.format);
              return (
                <tr key={comp.id} className="border-b-[2px] border-[#E7E5E4] hover:bg-[#FFFBEB] transition-colors">
                  <td className="px-5 py-4">
                    <div className="text-[#1C1917] font-black text-sm">{comp.name}</div>
                    {comp.category && <div className="text-black text-xs font-semibold">{comp.category}</div>}
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-[4px] border-2 border-[#1C1917]"
                      style={{ background: fmt.bg, color: fmt.color }}>
                      {fmt.emoji} {fmt.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-black text-xs font-bold">
                      {comp.type === "TEAM" ? "Beregu" : comp.type === "DUO" ? "Duo" : "Perorangan"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("text-xs font-black px-2.5 py-1 rounded-[4px] border-2 border-[#1C1917]", getStatusColor(comp.status))}>
                      {getStatusLabel(comp.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/lomba/${comp.id}`}
                        className="p-1.5 rounded-[4px] border-[2px] border-transparent text-[#0891B2] hover:border-[#0891B2] hover:bg-[#ECFEFF] transition-all duration-100" title="Kelola Lomba">
                        <LayoutList className="w-4 h-4" />
                      </Link>
                      <Link href={`/lomba/${comp.slug}`} target="_blank"
                        className="p-1.5 rounded-[4px] border-[2px] border-transparent text-black hover:border-[#1C1917] hover:text-[#1C1917] hover:bg-[#ECFEFF] transition-all duration-100" title="Lihat">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleEdit(comp)}
                        className="p-1.5 rounded-[4px] border-[2px] border-transparent text-black hover:border-[#0891B2] hover:text-[#0891B2] hover:bg-[#ECFEFF] transition-all duration-100" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(comp.id, comp.name)}
                        className="p-1.5 rounded-[4px] border-[2px] border-transparent text-black hover:border-[#C2410C] hover:text-[#C2410C] hover:bg-[#FFF7ED] transition-all duration-100" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center text-black">
            <Swords className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">Belum ada lomba. Tambahkan sekarang!</p>
          </div>
        )}
      </div>
    </div>
  );
}
