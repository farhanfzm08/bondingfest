"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Settings, Users, Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import TabInfo from "./TabInfo";
import TabPeserta from "./TabPeserta";
import TabBracket from "./TabBracket";
import TabJuara from "./TabJuara";

import TabJadwal from "./TabJadwal";

const TABS = [
  { key: "info",    label: "⚙️ Info & Konfigurasi", icon: Settings },
  { key: "peserta", label: "👥 Peserta & Tim",       icon: Users },
  { key: "bracket", label: "🏆 Bracket / Grup",      icon: Trophy },
  { key: "jadwal",  label: "📅 Jadwal & Skor",       icon: Calendar },
  { key: "juara",   label: "🏅 Tetapkan Juara",      icon: Trophy },
];

export interface Competition {
  id: string; name: string; slug: string; status: string;
  type: string; format: string; category: string | null;
  description: string | null; rules: string | null; venue: string | null;
  config: string | null; order: number;
}

export default function LombaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState("info");
  const [comp, setComp] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComp = useCallback(async () => {
    try {
      const r = await fetch(`/api/competitions/${id}`);
      if (!r.ok) { router.push("/admin/lomba"); return; }
      setComp(await r.json());
    } catch { toast.error("Gagal memuat lomba"); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { fetchComp(); }, [fetchComp]);

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 shimmer rounded w-1/3" />
      <div className="h-40 shimmer rounded" />
    </div>
  );

  if (!comp) return null;

  const tabLabel = { BRACKET: "🏆 Bracket", GROUP_STAGE: "📊 Tabel Grup", TIME_TRIAL: "⏱️ Ranking" }[comp.format] || "Jadwal";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/lomba" className="p-2 rounded-[6px] border-[2.5px] border-[#1C1917] bg-white hover:bg-[#FFFBEB] shadow-[2px_2px_0_#1C1917] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">
          <ArrowLeft className="w-4 h-4 text-[#1C1917]" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#1C1917]">{comp.name}</h1>
          <p className="text-black text-xs font-semibold">{comp.format} · {comp.type} · {comp.status}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b-[3px] border-[#1C1917] pb-0">
        {TABS.map(t => {
          const label = t.key === "bracket" ? tabLabel : t.label;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-black rounded-t-[6px] border-[2.5px] border-b-0 transition-all duration-100 ${
                tab === t.key
                  ? "bg-[#0891B2] text-white border-[#1C1917] -mb-[3px]"
                  : "bg-white text-[#1C1917] border-[#D4D0CA] hover:border-[#1C1917]"
              }`}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {tab === "info"    && <TabInfo    comp={comp} onSaved={fetchComp} />}
        {tab === "peserta" && <TabPeserta comp={comp} />}
        {tab === "bracket" && <TabBracket comp={comp} />}
        {tab === "jadwal"  && <TabJadwal  comp={comp} />}
        {tab === "juara"   && <TabJuara   comp={comp} onSaved={fetchComp} />}
      </div>
    </div>
  );
}
