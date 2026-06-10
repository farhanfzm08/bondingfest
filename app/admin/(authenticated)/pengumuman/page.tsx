"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Megaphone, Trash2, Pin } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime, cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  isPinned: boolean;
  isRunningText: boolean;
  isPublished: boolean;
  publishedAt: string;
}

const TYPE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  INFO:    { bg: "#EFF6FF", color: "#1D4ED8", label: "ℹ️ Info" },
  SUCCESS: { bg: "#ECFDF5", color: "#065F46", label: "✅ Sukses" },
  WARNING: { bg: "#FFFBEB", color: "#92400E", label: "⚠️ Peringatan" },
  URGENT:  { bg: "#FEF2F2", color: "#991B1B", label: "🚨 Urgent" },
};

export default function AdminPengumumanPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", type: "INFO", priority: "NORMAL",
    isPinned: false, isRunningText: false, isPublished: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements?limit=50");
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch { toast.error("Gagal memuat"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Pengumuman berhasil diterbitkan!");
      setShowForm(false);
      setForm({ title: "", content: "", type: "INFO", priority: "NORMAL", isPinned: false, isRunningText: false, isPublished: true });
      fetchAnnouncements();
    } catch { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    try {
      await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      toast.success("Pengumuman dihapus");
      fetchAnnouncements();
    } catch { toast.error("Gagal menghapus"); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">Pengumuman</h1>
          <p className="text-black text-sm font-semibold">{announcements.length} pengumuman aktif</p>
        </div>
        <button
          id="add-announcement-btn"
          onClick={() => setShowForm(!showForm)}
          className="btn-neon text-sm px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Buat Pengumuman
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="neu-card p-6">
          <h2 className="text-[#1C1917] font-black text-lg mb-4 border-b-[3px] border-[#1C1917] pb-3">📢 Pengumuman Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Judul *</label>
              <input
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul pengumuman" required className="neu-input"
              />
            </div>
            <div>
              <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Konten *</label>
              <textarea
                value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Isi pengumuman..." required rows={4} className="neu-input resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Tipe</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="neu-input">
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider">Prioritas</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="neu-input">
                  {["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { key: "isPinned",      label: "📌 Pin di Atas" },
                { key: "isRunningText", label: "📺 Running Text" },
                { key: "isPublished",   label: "✅ Publikasikan" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer p-3 rounded-[6px] border-2 border-[#D4D0CA] hover:border-[#1C1917] transition-all">
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="w-4 h-4 border-[2px] border-[#1C1917] rounded-[3px] accent-[#0891B2]"
                  />
                  <span className="text-[#1C1917] text-sm font-bold">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 pt-2 border-t-[2px] border-[#E7E5E4]">
              <button type="submit" disabled={saving} className="btn-neon px-6 py-2.5 text-sm disabled:opacity-50">
                {saving ? "Menerbitkan..." : "Terbitkan"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="neu-btn neu-btn-white px-6 py-2.5 text-sm">Batal</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="neu-card p-5">
              <div className="h-4 shimmer rounded mb-2 w-3/4" />
              <div className="h-3 shimmer rounded w-1/2" />
            </div>
          ))
        ) : announcements.length === 0 ? (
          <div className="neu-card p-12 text-center text-black">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">Belum ada pengumuman</p>
          </div>
        ) : announcements.map((ann) => {
          const tc = TYPE_CONFIG[ann.type] || TYPE_CONFIG.INFO;
          return (
            <div key={ann.id}
              className={cn("p-5 rounded-[6px] border-[2.5px] border-[#1C1917] transition-all", ann.isPinned ? "shadow-[4px_4px_0_#F59E0B]" : "shadow-[3px_3px_0_#1C1917]")}
              style={{ background: tc.bg }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {ann.isPinned && <Pin className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />}
                    <span className="text-xs font-black px-2 py-0.5 rounded-[4px] border-2 border-[#1C1917]"
                      style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                    {ann.isRunningText && (
                      <span className="text-xs font-black px-2 py-0.5 rounded-[4px] border-2 border-[#1C1917] bg-[#EDE9FE] text-[#5B21B6]">📺 Running Text</span>
                    )}
                    {!ann.isPublished && (
                      <span className="text-xs font-black px-2 py-0.5 rounded-[4px] border-2 border-[#1C1917] bg-[#F5F5F4] text-black">Draft</span>
                    )}
                  </div>
                  <h3 className="text-[#1C1917] font-black text-sm">{ann.title}</h3>
                  <p className="text-black text-xs mt-1 line-clamp-2 font-medium">{ann.content}</p>
                  <p className="text-black text-xs mt-2 font-semibold">{formatDateTime(ann.publishedAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1.5 rounded-[4px] border-2 border-transparent text-black hover:border-[#C2410C] hover:text-[#C2410C] hover:bg-white transition-all duration-100 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
