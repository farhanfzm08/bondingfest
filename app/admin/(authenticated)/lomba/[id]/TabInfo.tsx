"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Competition } from "./page";

const STATUS_OPTS = ["UPCOMING","REGISTRATION","ONGOING","COMPLETED"];
const STATUS_LABEL: Record<string,string> = { UPCOMING:"Akan Datang", REGISTRATION:"Pendaftaran", ONGOING:"Berlangsung", COMPLETED:"Selesai" };

export default function TabInfo({ comp, onSaved }: { comp: Competition; onSaved: () => void }) {
  const cfg = comp.config ? JSON.parse(comp.config) : {};
  const [form, setForm] = useState({
    name: comp.name, description: comp.description||"", rules: comp.rules||"",
    venue: comp.venue||"", status: comp.status, category: comp.category||"",
  });
  const [config, setConfig] = useState({
    // BRACKET
    bracketSize: cfg.bracketSize || 8,
    thirdPlace: cfg.thirdPlace ?? true,
    bestOf: cfg.bestOf || 1,
    // GROUP_STAGE
    numGroups: cfg.numGroups || 2,
    teamsPerGroup: cfg.teamsPerGroup || 4,
    advanceCount: cfg.advanceCount || 2,
    pointsWin: cfg.pointsWin ?? 3,
    pointsDraw: cfg.pointsDraw ?? 1,
    pointsLoss: cfg.pointsLoss ?? 0,
    // TIME_TRIAL
    scoreUnit: cfg.scoreUnit || "nilai",
    sortOrder: cfg.sortOrder || "DESC",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const configPayload =
        comp.format === "BRACKET"
          ? { bracketSize: Number(config.bracketSize), thirdPlace: config.thirdPlace, bestOf: Number(config.bestOf) }
          : comp.format === "GROUP_STAGE"
          ? { numGroups: Number(config.numGroups), teamsPerGroup: Number(config.teamsPerGroup), advanceCount: Number(config.advanceCount), pointsWin: Number(config.pointsWin), pointsDraw: Number(config.pointsDraw), pointsLoss: Number(config.pointsLoss) }
          : { scoreUnit: config.scoreUnit, sortOrder: config.sortOrder, bestOf: Number(config.bestOf) };

      const r = await fetch(`/api/competitions/${comp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, config: JSON.stringify(configPayload) }),
      });
      if (!r.ok) throw new Error();
      toast.success("Lomba diperbarui!");
      onSaved();
    } catch { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const inp = "neu-input";
  const label = "block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider";
  const num = (k: keyof typeof config) => (
    <input type="number" value={config[k] as number}
      onChange={e => setConfig({...config, [k]: e.target.value})}
      className={`${inp} text-center font-black`} min={0} />
  );

  return (
    <div className="space-y-5">
      {/* Basic Info */}
      <div className="neu-card p-5">
        <h3 className="font-black text-[#1C1917] mb-4 border-b-2 border-[#E7E5E4] pb-2">Informasi Dasar</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={label}>Nama Lomba</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp}/></div>
          <div><label className={label}>Kategori</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className={inp} placeholder="Olahraga, Seni..."/></div>
          <div><label className={label}>Venue / Lokasi</label><input value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} className={inp} placeholder="Lapangan A..."/></div>
          <div>
            <label className={label}>Status</label>
            <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>
              {STATUS_OPTS.map(s=><option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className={label}>Deskripsi</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} className={`${inp} resize-none`}/></div>
          <div className="sm:col-span-2"><label className={label}>Peraturan</label><textarea value={form.rules} onChange={e=>setForm({...form,rules:e.target.value})} rows={3} className={`${inp} resize-none`}/></div>
        </div>
      </div>

      {/* Format Config */}
      <div className="neu-card-sand p-5">
        <h3 className="font-black text-[#1C1917] mb-4 border-b-2 border-[#E7E5E4] pb-2">
          ⚙️ Konfigurasi Format — {comp.format === "BRACKET" ? "Sistem Gugur" : comp.format === "GROUP_STAGE" ? "Fase Grup" : "Time Trial"}
        </h3>

        {comp.format === "BRACKET" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={label}>Ukuran Bracket</label>
              <select value={config.bracketSize} onChange={e=>setConfig({...config,bracketSize:Number(e.target.value)})} className={inp}>
                {[4,8,16,32].map(n=><option key={n} value={n}>{n} peserta</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Best of</label>
              <select value={config.bestOf} onChange={e=>setConfig({...config,bestOf:Number(e.target.value)})} className={inp}>
                {[1,3,5].map(n=><option key={n} value={n}>Best of {n}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-[6px] border-2 border-[#D4D0CA] hover:border-[#1C1917] w-full">
                <input type="checkbox" checked={config.thirdPlace} onChange={e=>setConfig({...config,thirdPlace:e.target.checked})} className="w-4 h-4 accent-[#0891B2]"/>
                <span className="text-[#1C1917] text-sm font-black">Babak Perebutan Juara 3</span>
              </label>
            </div>
          </div>
        )}

        {comp.format === "GROUP_STAGE" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className={label}>Jumlah Grup</label>{num("numGroups")}</div>
            <div><label className={label}>Tim per Grup</label>{num("teamsPerGroup")}</div>
            <div><label className={label}>Lolos Playoff</label>{num("advanceCount")}</div>
            <div><label className={label}>Poin Menang</label>{num("pointsWin")}</div>
            <div><label className={label}>Poin Seri</label>{num("pointsDraw")}</div>
            <div><label className={label}>Poin Kalah</label>{num("pointsLoss")}</div>
          </div>
        )}

        {comp.format === "TIME_TRIAL" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={label}>Satuan Skor</label>
              <input value={config.scoreUnit} onChange={e=>setConfig({...config,scoreUnit:e.target.value})} className={inp} placeholder="nilai / detik / meter"/>
            </div>
            <div>
              <label className={label}>Urutan Ranking</label>
              <select value={config.sortOrder} onChange={e=>setConfig({...config,sortOrder:e.target.value})} className={inp}>
                <option value="DESC">Tertinggi = Terbaik (nilai/poin)</option>
                <option value="ASC">Terendah = Terbaik (waktu/lari)</option>
              </select>
            </div>
            <div>
              <label className={label}>Best of</label>
              <select value={config.bestOf} onChange={e=>setConfig({...config,bestOf:Number(e.target.value)})} className={inp}>
                {[1,2,3].map(n=><option key={n} value={n}>Best of {n}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-neon px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
        <Save className="w-4 h-4"/>{saving?"Menyimpan...":"Simpan Perubahan"}
      </button>
    </div>
  );
}
