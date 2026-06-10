"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Media {
  id: string;
  title: string | null;
  url: string;
  thumbnailUrl: string | null;
  type: string;
  competition: { name: string } | null;
}

interface Comp {
  id: string;
  name: string;
}

export default function GaleriAdminClient({ 
  media, 
  competitions, 
  addMedia, 
  deleteMedia 
}: { 
  media: Media[]; 
  competitions: Comp[]; 
  addMedia: (data: FormData) => Promise<void>; 
  deleteMedia: (id: string) => Promise<void>; 
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await addMedia(formData);
        toast.success("Media berhasil ditambahkan");
        setShowForm(false);
      } catch (error) {
        toast.error("Gagal menambahkan media");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Yakin ingin menghapus media ini?")) return;
    startTransition(async () => {
      try {
        await deleteMedia(id);
        toast.success("Media dihapus");
      } catch (error) {
        toast.error("Gagal menghapus media");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">Kelola Galeri</h1>
          <p className="text-black text-sm font-semibold">Tambahkan foto/video untuk ditampilkan di halaman galeri</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-neon text-sm px-4 py-2 flex items-center gap-2">
          {showForm ? <XIcon /> : <Plus className="w-4 h-4" />} {showForm ? "Tutup" : "Tambah Media"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="neu-card p-6 bg-white space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-black text-[#1C1917] uppercase mb-1">Judul (Opsional)</label>
              <input type="text" name="title" className="neu-input w-full" placeholder="Contoh: Keseruan Lomba Futsal" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-black text-[#1C1917] uppercase mb-1">Tipe</label>
              <select name="type" className="neu-input w-full">
                <option value="IMAGE">Foto</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-black text-[#1C1917] uppercase mb-1 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Link Tujuan (Google Drive)</label>
              <input type="url" name="url" required className="neu-input w-full" placeholder="https://drive.google.com/..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-black text-[#1C1917] uppercase mb-1 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Link Gambar Preview (Thumbnail)</label>
              <input type="url" name="thumbnailUrl" required className="neu-input w-full" placeholder="https://i.imgur.com/... atau link gambar drive" />
              <p className="text-[10px] text-gray-500 mt-1">Gambar ini yang akan ditampilkan di web. Saat diklik, user akan diarahkan ke Link Tujuan.</p>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-black text-[#1C1917] uppercase mb-1">Terkait Lomba (Opsional)</label>
              <select name="competitionId" className="neu-input w-full">
                <option value="">-- Pilih Lomba --</option>
                {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={isPending} className="btn-neon w-full py-3 flex justify-center mt-4">
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Media"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map(m => (
          <div key={m.id} className="neu-card p-3 bg-white flex flex-col group">
            <div className="aspect-video bg-gray-100 rounded-[4px] border-2 border-[#1C1917] mb-3 overflow-hidden relative">
              {m.thumbnailUrl || m.url ? (
                <img src={m.thumbnailUrl || m.url} alt={m.title || "Media"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300"/></div>
              )}
              <div className="absolute top-1 left-1 bg-[#1C1917] text-white text-[10px] font-black px-1.5 py-0.5 rounded-[3px]">
                {m.type === "VIDEO" ? "🎥 VIDEO" : "📷 FOTO"}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-sm text-[#1C1917] line-clamp-1">{m.title || "Tanpa Judul"}</h3>
              {m.competition && <p className="text-[10px] font-bold text-[#0891B2] mt-0.5 truncate">{m.competition.name}</p>}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t-2 border-gray-100">
              <a href={m.url} target="_blank" rel="noreferrer" className="flex-1 text-center py-1.5 bg-[#ECFEFF] text-[#0891B2] border-2 border-[#1C1917] rounded-[4px] text-xs font-black hover:bg-[#0891B2] hover:text-white transition-colors">
                Buka Link
              </a>
              <button onClick={() => handleDelete(m.id)} disabled={isPending} className="w-8 h-8 flex items-center justify-center bg-[#FEF2F2] text-red-600 border-2 border-[#1C1917] rounded-[4px] hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full neu-card p-8 text-center text-black font-bold">
            Belum ada media di galeri.
          </div>
        )}
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
