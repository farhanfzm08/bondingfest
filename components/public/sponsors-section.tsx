"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: string;
  displayStyle: string;
}

const tierConfig: Record<string, { label: string; order: number; cardClass: string; textClass: string }> = {
  UTAMA: { label: "Sponsor Utama", order: 1, cardClass: "p-6 sm:p-8 bg-white border-[3px] border-[#1C1917] shadow-[4px_4px_0_#1C1917]", textClass: "text-2xl sm:text-3xl font-black text-[#1C1917]" },
  REGULAR: { label: "Sponsor", order: 2, cardClass: "p-4 sm:p-5 bg-white border-[2.5px] border-[#1C1917] shadow-[3px_3px_0_#1C1917]", textClass: "text-lg sm:text-xl font-black text-[#1C1917]" },
  SUPPORT: { label: "Media Partner & Support", order: 3, cardClass: "p-3 sm:p-4 bg-white border-[2px] border-[#1C1917] shadow-[2px_2px_0_#1C1917]", textClass: "text-base sm:text-lg font-bold text-[#1C1917]" },
};

export default function SponsorsSection({ sponsors }: { sponsors: Sponsor[] }) {
  if (!sponsors || sponsors.length === 0) return null;

  const tiers = Object.entries(tierConfig).sort(([, a], [, b]) => a.order - b.order);

  return (
    <section className="py-20 px-4 border-t-[3px] border-[#1C1917] bg-[#FFFBEB]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white border-2 border-[#1C1917] shadow-[2px_2px_0_#1C1917] rounded-full px-4 py-2 mb-3">
            <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="text-[#1C1917] text-xs font-black uppercase tracking-wider">Didukung Oleh</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1C1917]">
            Mitra & Sponsor
          </h2>
        </motion.div>

        {tiers.map(([tier, config]) => {
          const tierSponsors = sponsors.filter((s) => s.tier === tier);
          if (tierSponsors.length === 0) return null;

          return (
            <div key={tier} className="mb-14 last:mb-0">
              <p className="text-center text-[#1C1917] text-sm font-black uppercase tracking-widest mb-6">{config.label}</p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {tierSponsors.map((sponsor, i) => {
                  const content = (
                    <div className={cn("flex flex-col items-center justify-center gap-3 text-center transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0_#1C1917]", config.cardClass)}>
                      {sponsor.displayStyle !== "TEXT_ONLY" && sponsor.logoUrl && (
                        <img 
                          src={sponsor.logoUrl} 
                          alt={sponsor.name} 
                          className="max-w-[120px] max-h-[80px] sm:max-w-[160px] sm:max-h-[100px] object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      {sponsor.displayStyle !== "LOGO_ONLY" && (
                        <span className={config.textClass}>{sponsor.name}</span>
                      )}
                    </div>
                  );

                  return (
                    <motion.div
                      key={sponsor.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="w-[45%] sm:w-auto"
                    >
                      {sponsor.websiteUrl ? (
                        <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                          {content}
                        </a>
                      ) : (
                        <div className="w-full">
                          {content}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
