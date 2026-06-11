"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2, Users, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: string;
  name: string;
  npk: string | null;
  section: string | null;
  createdAt: string;
}



export default function AdminPesertaPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [dbSections, setDbSections] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [form, setForm] = useState({ name: "", npk: "", section: "" });
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [resParts, resSecs] = await Promise.all([
        fetch("/api/participants"),
        fetch("/api/sections")
      ]);
      const dataParts = await resParts.json();
      const dataSecs = await resSecs.json();
      setParticipants(Array.isArray(dataParts) ? dataParts : []);
      setDbSections(Array.isArray(dataSecs) ? dataSecs : []);
    } catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const sections = [...new Set(participants.map(p => p.section).filter(Boolean))] as string[];

  const filtered = participants.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.npk?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchSection = !filterSection || p.section === filterSection;
    return matchSearch && matchSection;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (isBulk) {
        if (!bulkText.trim()) throw new Error("Data bulk kosong");
        const rows = bulkText.trim().split("\n");
        let successCount = 0;
        
        for (const row of rows) {
          const [name, npk, section] = row.split("\t").map(s => s?.trim());
          if (!name) continue;
          
          await fetch("/api/participants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, npk: npk || "", section: section || "" }),
          });
          successCount++;
        }
        toast.success(`${successCount} peserta berhasil ditambahkan!`);
      } else {
        if (!form.name.trim()) throw new Error("Nama wajib diisi");
        const res = await fetch("/api/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        toast.success("Peserta berhasil ditambahkan!");
      }
      
      setShowForm(false);
      setForm({ name: "", npk: "", section: "" });
      setBulkText("");
      fetchData();
    } catch (e: any) { toast.error(e.message || "Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus peserta "${name}"?`)) return;
    try {
      await fetch(`/api/participants/${id}`, { method: "DELETE" });
      toast.success("Peserta dihapus");
      fetchData();
    } catch { toast.error("Gagal menghapus"); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">Peserta & Tim</h1>
          <p className="text-black text-sm font-medium">{participants.length} peserta terdaftar</p>
        </div>
        <button
          id="add-peserta-btn"
          onClick={() => setShowForm(!showForm)}
          className="btn-neon text-sm px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Peserta
        </button>
      </div>

      {/* Stats by section */}
      {sections.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sections.slice(0, 8).map((sec) => {
            const count = participants.filter(p => p.section === sec).length;
            return (
              <button
                key={sec}
                onClick={() => setFilterSection(filterSection === sec ? "" : sec)}
                className={`p-3 rounded-[6px] border-[2.5px] text-left transition-all duration-100 ${
                  filterSection === sec
                    ? "border-[#1C1917] bg-[#ECFEFF] shadow-[3px_3px_0_#0891B2] -translate-x-[1px] -translate-y-[1px]"
                    : "border-[#D4D0CA] bg-white hover:border-[#1C1917] hover:shadow-[2px_2px_0_#1C1917]"
                }`}
              >
                <div className="text-lg font-black text-[#0891B2]">{count}</div>
                <div className="text-[#1C1917] text-xs font-bold leading-tight mt-0.5 truncate">{sec.replace("Seksi ", "")}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="neu-card p-6">
          <div className="flex justify-between items-center mb-4 border-b-[3px] border-[#1C1917] pb-3">
            <h2 className="text-[#1C1917] font-black text-lg">➕ Tambah Peserta Baru</h2>
            <div className="flex bg-[#F5F5F4] p-1 rounded-[6px] border-2 border-[#1C1917]">
              <button
                type="button"
                onClick={() => setIsBulk(false)}
                className={`px-3 py-1 text-xs font-bold rounded-[4px] ${!isBulk ? "bg-white border-2 border-[#1C1917] shadow-[1px_1px_0_#1C1917]" : "text-gray-500 hover:text-black"}`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setIsBulk(true)}
                className={`px-3 py-1 text-xs font-bold rounded-[4px] ${isBulk ? "bg-white border-2 border-[#1C1917] shadow-[1px_1px_0_#1C1917]" : "text-gray-500 hover:text-black"}`}
              >
                Bulk (Excel)
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
            {isBulk ? (
              <div className="col-span-3">
                <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Paste Data dari Excel (Copy-Paste)</label>
                <p className="text-xs text-gray-600 mb-2 font-medium">Format kolom (tanpa header): <strong>Nama Lengkap [TAB] NPK [TAB] Asal Seksi</strong></p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Budi Santoso&#9;12345&#9;Seksi Produksi A&#10;Siti Aminah&#9;67890&#9;Seksi Finance"
                  className="neu-input font-mono text-sm min-h-[150px] whitespace-pre"
                  required
                />
              </div>
            ) : (
              <>
                {/* Nama */}
                <div>
                  <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Nama Lengkap *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    required
                    className="neu-input"
                  />
                </div>

                {/* NPK */}
                <div>
                  <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">NPK</label>
                  <input
                    value={form.npk}
                    onChange={(e) => setForm({ ...form, npk: e.target.value })}
                    placeholder="Contoh: 12345"
                    className="neu-input"
                  />
                  <p className="text-black text-xs mt-1">Nomor Pokok Karyawan</p>
                </div>

                {/* Seksi */}
                <div>
                  <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Asal Seksi *</label>
                  <select
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    required
                    className="neu-input"
                  >
                    <option value="">-- Pilih Seksi --</option>
                    {dbSections.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="sm:col-span-3 flex gap-3 mt-2">
              <button type="submit" disabled={saving} className="btn-neon px-6 py-2.5 text-sm disabled:opacity-50">
                {saving ? "Menyimpan..." : isBulk ? "Simpan Semua" : "Tambah Peserta"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="neu-btn neu-btn-white px-6 py-2.5 text-sm">
                Batal
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau NPK..."
            className="neu-input pl-11"
          />
        </div>
        {filterSection && (
          <button onClick={() => setFilterSection("")} className="neu-btn neu-btn-coral text-xs px-3 py-2 whitespace-nowrap">
            {filterSection.replace("Seksi ", "")} ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="neu-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-[2.5px] border-[#1C1917] bg-[#FFFBEB]">
              <th className="text-left px-5 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider">#</th>
              <th className="text-left px-5 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider">Nama</th>
              <th className="text-left px-4 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider hidden sm:table-cell">NPK</th>
              <th className="text-left px-4 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider hidden md:table-cell">Asal Seksi</th>
              <th className="text-right px-5 py-3 text-[#1C1917] text-xs font-black uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b-[2px] border-[#E7E5E4]">
                  <td className="px-5 py-4" colSpan={5}><div className="h-4 shimmer rounded" /></td>
                </tr>
              ))
            ) : filtered.map((p, i) => (
              <tr key={p.id} className="border-b-[2px] border-[#E7E5E4] hover:bg-[#FFFBEB] transition-colors">
                <td className="px-5 py-3 text-black text-sm font-bold">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[6px] bg-[#0891B2] border-[2.5px] border-[#1C1917] shadow-[2px_2px_0_#1C1917] flex items-center justify-center text-white text-sm font-black">
                      {p.name[0].toUpperCase()}
                    </div>
                    <div className="font-black text-[#1C1917] text-sm">{p.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {p.npk ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-[4px] border-2 border-[#1C1917] bg-[#ECFEFF] text-[#0E7490]">
                      <BadgeCheck className="w-3 h-3" /> {p.npk}
                    </span>
                  ) : <span className="text-[#D4D0CA] text-xs">-</span>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {p.section ? (
                    <span className="text-xs font-bold text-black bg-[#FEF3C7] border-2 border-[#1C1917] px-2 py-0.5 rounded-[4px]">
                      {p.section}
                    </span>
                  ) : <span className="text-[#D4D0CA] text-xs">-</span>}
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleDelete(p.id, p.name)}
                    className="p-1.5 rounded-[4px] border-2 border-transparent text-black hover:border-[#C2410C] hover:text-[#C2410C] hover:bg-[#FFF7ED] transition-all duration-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center text-black">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">Belum ada peserta.</p>
          </div>
        )}
      </div>
    </div>
  );
}
