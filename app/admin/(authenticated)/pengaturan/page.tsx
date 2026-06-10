"use client";
import { useState, useEffect } from "react";
import { Save, RefreshCw, Palette, Trophy, Layers, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Section { id: string; name: string; color: string; order: number; }

const BEACH_COLORS = ["#0891B2","#10B981","#F97316","#F59E0B","#8B5CF6","#EC4899","#14B8A6","#6366F1"];

const TABS = [
  { key:"event",  label:"⚙️ Event" },
  { key:"seksi",  label:"🏢 Kelola Seksi" },
  { key:"sponsor",label:"🤝 Sponsor" },
  { key:"warna",  label:"🎨 Warna Tema" },
];

export default function AdminPengaturanPage() {
  const [activeTab, setActiveTab] = useState("event");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:"", description:"", location:"", startDate:"", endDate:"",
    status:"UPCOMING", themeColor:"#0891B2",
    pointFirst:100, pointSecond:70, pointThird:40,
  });
  // Seksi state
  const [sections, setSections] = useState<Section[]>([]);
  const [newSec, setNewSec] = useState({ name:"", color:"#0891B2" });
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState({ name:"", color:"" });
  // Sponsor state
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [newSponsor, setNewSponsor] = useState({ name:"", tier:"REGULAR", logoUrl:"", displayStyle:"TEXT_AND_LOGO" });

  useEffect(() => {
    Promise.all([
      fetch("/api/event").then(r=>r.json()),
      fetch("/api/sections").then(r=>r.json()),
      fetch("/api/sponsors").then(r=>r.json()),
    ]).then(([data, secs, spon]) => {
      const ps = typeof data.pointSystem==="string" ? JSON.parse(data.pointSystem) : data.pointSystem;
      setForm({
        name: data.name||"", description: data.description||"", location: data.location||"",
        startDate: new Date(data.startDate).toISOString().slice(0,16),
        endDate: new Date(data.endDate).toISOString().slice(0,16),
        status: data.status||"UPCOMING", themeColor: data.themeColor||"#0891B2",
        pointFirst: ps?.first||100, pointSecond: ps?.second||70, pointThird: ps?.third||40,
      });
      setSections(Array.isArray(secs)?secs:[]);
      setSponsors(Array.isArray(spon)?spon:[]);
    }).catch(()=>toast.error("Gagal memuat")).finally(()=>setLoading(false));
  }, []);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/webp", 0.8));
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    toast.info("Mengkompres gambar...");
    try {
      const base64 = await compressImage(file);
      setNewSponsor(prev => ({ ...prev, logoUrl: base64 }));
      toast.success("Gambar siap!");
    } catch {
      toast.error("Gagal memproses gambar");
    }
  };

  const handleSaveEvent = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/event", { method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...form, pointSystem:{first:form.pointFirst,second:form.pointSecond,third:form.pointThird} }) });
      if(!r.ok) throw new Error();
      toast.success("Pengaturan disimpan!");
    } catch { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const handleAddSection = async () => {
    if(!newSec.name.trim()) return;
    try {
      const r = await fetch("/api/sections", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(newSec) });
      if(!r.ok) { const e=await r.json(); throw new Error(e.error); }
      const created = await r.json();
      setSections(prev=>[...prev, created]);
      setNewSec({ name:"", color:"#0891B2" });
      toast.success("Seksi ditambahkan!");
    } catch(e:any) { toast.error(e.message||"Gagal menambahkan"); }
  };

  const handleUpdateSection = async (id:string) => {
    try {
      const r = await fetch(`/api/sections/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(editForm) });
      if(!r.ok) throw new Error();
      const updated = await r.json();
      setSections(prev=>prev.map(s=>s.id===id?updated:s));
      setEditingId(null);
      toast.success("Seksi diperbarui!");
    } catch { toast.error("Gagal memperbarui"); }
  };

  const handleDeleteSection = async (id:string, name:string) => {
    if(!confirm(`Hapus seksi "${name}"? Peserta dari seksi ini tidak akan terhapus.`)) return;
    try {
      await fetch(`/api/sections/${id}`, { method:"DELETE" });
      setSections(prev=>prev.filter(s=>s.id!==id));
      toast.success("Seksi dihapus");
    } catch { toast.error("Gagal menghapus"); }
  };

  const handleAddSponsor = async () => {
    if(!newSponsor.name.trim()) return;
    try {
      const r = await fetch("/api/sponsors", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(newSponsor) });
      if(!r.ok) throw new Error();
      const created = await r.json();
      setSponsors(prev=>[...prev, created]);
      setNewSponsor({ name:"", tier:"REGULAR", logoUrl:"" });
      toast.success("Sponsor ditambahkan!");
    } catch { toast.error("Gagal menambahkan"); }
  };

  const handleDeleteSponsor = async (id:string) => {
    if(!confirm("Hapus sponsor ini?")) return;
    try {
      await fetch(`/api/sponsors/${id}`, { method:"DELETE" });
      setSponsors(prev=>prev.filter(s=>s.id!==id));
      toast.success("Sponsor dihapus");
    } catch { toast.error("Gagal menghapus"); }
  };

  if (loading) return (
    <div className="space-y-4 max-w-3xl">
      {[1,2,3].map(i=><div key={i} className="neu-card p-6"><div className="h-4 shimmer rounded w-1/3 mb-4"/><div className="h-10 shimmer rounded"/></div>)}
    </div>
  );

  const inp = "neu-input";
  const lbl = "block text-[#1C1917] text-xs font-black mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-[#1C1917]">Pengaturan Event</h1>
        <p className="text-black text-sm font-semibold">Konfigurasi event, seksi, dan sistem poin</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-[3px] border-[#1C1917]">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-black rounded-t-[6px] border-[2.5px] border-b-0 transition-all ${
              activeTab===t.key ? "bg-[#0891B2] text-white border-[#1C1917] -mb-[3px]" : "bg-white text-white border-[#D4D0CA] hover:border-[#1C1917]"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Event */}
      {activeTab==="event" && (
        <div className="space-y-5">
          <div className="neu-card p-6">
            <h2 className="text-[#1C1917] font-black mb-4 flex items-center gap-2 border-b-[2px] border-[#E7E5E4] pb-3">
              <Trophy className="w-4 h-4 text-[#F59E0B]"/> Informasi Event
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className={lbl}>Nama Event</label><input id="event-name-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp}/></div>
              <div className="sm:col-span-2"><label className={lbl}>Deskripsi</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} className={`${inp} resize-none`}/></div>
              <div><label className={lbl}>Lokasi</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Area Plant, Jakarta" className={inp}/></div>
              <div>
                <label className={lbl}>Status Event</label>
                <select id="event-status-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>
                  <option value="UPCOMING">Akan Datang</option>
                  <option value="ONGOING">Sedang Berlangsung</option>
                  <option value="COMPLETED">Selesai</option>
                </select>
              </div>
              <div><label className={lbl}>Tanggal Mulai</label><input type="datetime-local" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className={inp}/></div>
              <div><label className={lbl}>Tanggal Selesai</label><input type="datetime-local" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className={inp}/></div>
            </div>
          </div>
          <div className="neu-card-sand p-6">
            <h2 className="text-[#1C1917] font-black mb-2 flex items-center gap-2 border-b-[2px] border-[#1C1917] pb-3">
              <RefreshCw className="w-4 h-4 text-[#F59E0B]"/> Sistem Poin Juara Umum
            </h2>
            <p className="text-black text-xs mb-4 font-semibold">Poin diberikan kepada seksi berdasarkan posisi juara per lomba.</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label:"🥇 Juara 1", key:"pointFirst",  bg:"#FFFBEB", border:"#F59E0B" },
                { label:"🥈 Juara 2", key:"pointSecond", bg:"#F8FAFC", border:"#6B7280" },
                { label:"🥉 Juara 3", key:"pointThird",  bg:"#FEF3C7", border:"#B45309" },
              ].map(({ label, key, bg, border }) => (
                <div key={key} className="text-center">
                  <label className="block text-[#1C1917] text-xs font-black mb-2">{label}</label>
                  <input id={`${key}-input`} type="number" value={form[key as keyof typeof form]}
                    onChange={e=>setForm({...form,[key]:parseInt(e.target.value)||0})}
                    className="w-full border-[3px] border-[#1C1917] rounded-[6px] px-4 py-3 text-[#1C1917] text-2xl font-black text-center focus:outline-none stat-number"
                    style={{ background:bg, boxShadow:`3px 3px 0 ${border}` }}/>
                  <div className="text-black text-xs mt-1 font-bold">poin</div>
                </div>
              ))}
            </div>
          </div>
          <button id="save-settings-btn" onClick={handleSaveEvent} disabled={saving}
            className="btn-neon px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4"/>{saving?"Menyimpan...":"Simpan Pengaturan"}
          </button>
        </div>
      )}

      {/* Tab: Seksi */}
      {activeTab==="seksi" && (
        <div className="space-y-4">
          {/* Add new section */}
          <div className="neu-card p-5">
            <h3 className="font-black text-[#1C1917] mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-[#0891B2]"/> Tambah Seksi Baru</h3>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-48">
                <label className={lbl}>Nama Seksi</label>
                <input value={newSec.name} onChange={e=>setNewSec({...newSec,name:e.target.value})}
                  placeholder="Seksi Produksi C" className={inp}
                  onKeyDown={e=>e.key==="Enter"&&handleAddSection()}/>
              </div>
              <div>
                <label className={lbl}>Warna</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={newSec.color} onChange={e=>setNewSec({...newSec,color:e.target.value})}
                    className="w-12 h-10 rounded-[6px] border-[2.5px] border-[#1C1917] cursor-pointer p-0.5"/>
                  <div className="flex gap-1">
                    {BEACH_COLORS.map(c=>(
                      <button key={c} onClick={()=>setNewSec({...newSec,color:c})}
                        className={`w-6 h-6 rounded-[3px] border-2 transition-all ${newSec.color===c?"border-[#1C1917]":"border-transparent"}`}
                        style={{ background:c }}/>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleAddSection} className="btn-neon px-4 py-2.5 text-sm flex items-center gap-2 flex-shrink-0">
                <Plus className="w-4 h-4"/> Tambah
              </button>
            </div>
          </div>

          {/* Sections list */}
          <div className="neu-card overflow-hidden">
            <div className="px-5 py-3 border-b-[2.5px] border-[#1C1917] bg-[#FFFBEB] flex items-center justify-between">
              <h3 className="font-black text-[#1C1917]">Daftar Seksi ({sections.length})</h3>
            </div>
            <div className="divide-y divide-[#E7E5E4]">
              {sections.map(sec=>(
                <div key={sec.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FFFBEB]">
                  <div className="w-8 h-8 rounded-[6px] border-2 border-[#1C1917] flex-shrink-0" style={{ background:editingId===sec.id?editForm.color:sec.color }}/>
                  {editingId===sec.id ? (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})}
                        className="neu-input py-1.5 text-sm flex-1 min-w-32"/>
                      <div className="flex gap-1">
                        {BEACH_COLORS.map(c=>(
                          <button key={c} onClick={()=>setEditForm({...editForm,color:c})}
                            className={`w-5 h-5 rounded-[3px] border-2 ${editForm.color===c?"border-[#1C1917]":"border-transparent"}`}
                            style={{ background:c }}/>
                        ))}
                      </div>
                      <button onClick={()=>handleUpdateSection(sec.id)} className="p-1.5 rounded border-2 border-[#10B981] text-[#10B981] hover:bg-[#ECFDF5]"><Check className="w-4 h-4"/></button>
                      <button onClick={()=>setEditingId(null)} className="p-1.5 rounded border-2 border-[#E7E5E4] text-black"><X className="w-4 h-4"/></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-black text-[#1C1917] text-sm flex-1">{sec.name}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={()=>{setEditingId(sec.id);setEditForm({name:sec.name,color:sec.color});}}
                          className="p-1.5 rounded border-2 border-transparent text-black hover:border-[#0891B2] hover:text-[#0891B2] transition-all">
                          <Pencil className="w-4 h-4"/>
                        </button>
                        <button onClick={()=>handleDeleteSection(sec.id,sec.name)}
                          className="p-1.5 rounded border-2 border-transparent text-black hover:border-[#C2410C] hover:text-[#C2410C] transition-all">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {sections.length===0 && <div className="px-5 py-8 text-center text-black font-bold">Belum ada seksi</div>}
            </div>
          </div>
          <p className="text-black text-xs font-semibold">💡 Seksi yang ditambahkan akan muncul sebagai opsi saat mendaftarkan peserta dan tim.</p>
        </div>
      )}

      {/* Tab: Sponsor */}
      {activeTab==="sponsor" && (
        <div className="space-y-4">
          <div className="neu-card p-5">
            <h3 className="font-black text-[#1C1917] mb-4 flex items-center gap-2">🤝 Tambah Sponsor</h3>
            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className={lbl}>Nama Sponsor</label>
                <input value={newSponsor.name} onChange={e=>setNewSponsor({...newSponsor,name:e.target.value})} placeholder="PT. Sponsor Keren" className={inp}/>
              </div>
              <div>
                <label className={lbl}>Level Sponsor</label>
                <select value={newSponsor.tier} onChange={e=>setNewSponsor({...newSponsor,tier:e.target.value})} className={inp}>
                  <option value="UTAMA">Sponsor Utama</option>
                  <option value="REGULAR">Sponsor Reguler</option>
                  <option value="SUPPORT">Media Partner / Support</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Gaya Tampilan</label>
                <select value={newSponsor.displayStyle} onChange={e=>setNewSponsor({...newSponsor,displayStyle:e.target.value})} className={inp}>
                  <option value="TEXT_AND_LOGO">Teks & Logo</option>
                  <option value="LOGO_ONLY">Logo Saja</option>
                  <option value="TEXT_ONLY">Teks Saja</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Logo (Upload)</label>
                <div className="flex gap-2 items-center">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-[4px] file:border-2 file:border-[#1C1917] file:text-xs file:font-black file:bg-[#F5F5F4] hover:file:bg-[#E7E5E4] cursor-pointer"/>
                  {newSponsor.logoUrl && <img src={newSponsor.logoUrl} className="h-8 w-8 object-contain border-2 border-[#1C1917] rounded-[4px]" />}
                </div>
              </div>
              <div className="sm:col-span-2 mt-2">
                <button onClick={handleAddSponsor} className="btn-neon px-6 py-2.5 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4"/> Tambah Sponsor
                </button>
              </div>
            </div>
          </div>

          <div className="neu-card overflow-hidden">
            <div className="px-5 py-3 border-b-[2.5px] border-[#1C1917] bg-[#FFFBEB] flex items-center justify-between">
              <h3 className="font-black text-[#1C1917]">Daftar Sponsor ({sponsors.length})</h3>
            </div>
            <div className="divide-y divide-[#E7E5E4]">
              {sponsors.map(sponsor=>(
                <div key={sponsor.id} className="flex items-center gap-3 px-5 py-4 hover:bg-[#FFFBEB]">
                  {sponsor.displayStyle !== "TEXT_ONLY" && sponsor.logoUrl ? (
                    <img src={sponsor.logoUrl} alt={sponsor.name} className="w-12 h-12 object-contain border-2 border-[#1C1917] bg-white rounded-[6px]" />
                  ) : (
                    <div className="w-12 h-12 rounded-[6px] border-2 border-[#1C1917] bg-[#F5F5F4] flex items-center justify-center font-black text-black">A</div>
                  )}
                  <div className="flex-1">
                    <div className="font-black text-[#1C1917]">
                      {sponsor.displayStyle === "LOGO_ONLY" ? <span className="text-xs font-normal italic text-gray-500">(Hanya menampilkan logo) - </span> : null}
                      {sponsor.name}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <div className="text-xs font-bold text-black border-2 border-[#1C1917] px-2 py-0.5 rounded-[4px] w-fit" style={{background: sponsor.tier==="UTAMA"?"#FEF3C7":sponsor.tier==="REGULAR"?"#ECFEFF":"#F5F5F4"}}>{sponsor.tier}</div>
                      <div className="text-xs font-bold text-black border-2 border-[#1C1917] px-2 py-0.5 rounded-[4px] w-fit bg-[#F3F4F6]">{sponsor.displayStyle}</div>
                    </div>
                  </div>
                  <button onClick={()=>handleDeleteSponsor(sponsor.id)} className="p-2 rounded-[6px] border-2 border-transparent text-black hover:border-[#C2410C] hover:text-[#C2410C] transition-all">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              ))}
              {sponsors.length===0 && <div className="px-5 py-8 text-center text-black font-bold">Belum ada sponsor</div>}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Warna */}
      {activeTab==="warna" && (
        <div className="neu-card p-6">
          <h2 className="text-[#1C1917] font-black mb-4 flex items-center gap-2 border-b-[2px] border-[#E7E5E4] pb-3">
            <Palette className="w-4 h-4 text-[#8B5CF6]"/> Warna Tema Event
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <input id="theme-color-picker" type="color" value={form.themeColor}
              onChange={e=>setForm({...form,themeColor:e.target.value})}
              className="w-16 h-16 rounded-[6px] border-[3px] border-[#1C1917] cursor-pointer shadow-[3px_3px_0_#1C1917]" style={{padding:"2px"}}/>
            <div>
              <div className="text-[#1C1917] font-black text-lg">{form.themeColor.toUpperCase()}</div>
              <div className="text-black text-xs font-semibold">Warna tema utama event</div>
            </div>
            <div className="ml-auto flex gap-2 flex-wrap justify-end">
              {BEACH_COLORS.map(color=>(
                <button key={color} onClick={()=>setForm({...form,themeColor:color})}
                  className="w-9 h-9 rounded-[6px] border-[2.5px] transition-all duration-100"
                  style={{ background:color, borderColor:form.themeColor===color?"#1C1917":"transparent", boxShadow:form.themeColor===color?"2px 2px 0 #1C1917":"none" }}/>
              ))}
            </div>
          </div>
          <button onClick={handleSaveEvent} disabled={saving}
            className="btn-neon px-5 py-2.5 text-sm flex items-center gap-2 mt-5 disabled:opacity-50">
            <Save className="w-4 h-4"/>{saving?"Menyimpan...":"Simpan Warna"}
          </button>
        </div>
      )}
    </div>
  );
}
