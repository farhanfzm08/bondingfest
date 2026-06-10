"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, X, ChevronLeft, ChevronRight } from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  type: string;
  competition: { name: string; slug: string } | null;
}

export default function GaleriClient({ media }: { media: MediaItem[] }) {
  const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");
  const filtered = media.filter((m) => filter === "ALL" || m.type === filter);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 glass border border-white/10 rounded-full px-4 py-2 mb-4">
            <Image className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-black text-xs font-semibold uppercase tracking-wider">Galeri</span>
          </div>
          <h1 className="text-4xl font-black text-black mb-3">
            Galeri <span className="gradient-text">Foto & Video</span>
          </h1>
          <p className="text-black">{media.length} media tersedia</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-8">
          {(["ALL", "IMAGE", "VIDEO"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                filter === f ? "bg-[#0891B2] text-white border-[#0891B2]" : "glass text-[#0891B2] hover:text-[#0891B2] border-transparent hover:border-[#0891B2]"
              }`}
            >
              {f === "ALL" ? "Semua" : f === "IMAGE" ? "📷 Foto" : "🎥 Video"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center text-black">
            <div className="text-5xl mb-4">📷</div>
            <p>Belum ada galeri</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative"
                onClick={() => window.open(item.url, "_blank")}
              >
                {item.type === "IMAGE" || item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.title || ""}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full aspect-video bg-black/50 flex items-center justify-center glass">
                    <span className="text-4xl">▶️</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                  {item.title && (
                    <div className="p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-black text-xs font-medium">{item.title}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
