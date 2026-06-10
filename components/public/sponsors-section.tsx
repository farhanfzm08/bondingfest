"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: string;
}

const tierConfig = {
  PLATINUM: { label: "Platinum Sponsor", order: 1, size: "text-xl font-bold", color: "text-black" },
  GOLD: { label: "Gold Sponsor", order: 2, size: "text-base font-semibold", color: "text-amber-400" },
  SILVER: { label: "Silver Sponsor", order: 3, size: "text-sm font-medium", color: "text-black" },
  REGULAR: { label: "Supported By", order: 4, size: "text-sm", color: "text-black" },
};

export default function SponsorsSection({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null;

  const tiers = Object.entries(tierConfig).sort(([, a], [, b]) => a.order - b.order);

  return (
    <section className="py-20 px-4 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass border border-white/10 rounded-full px-4 py-2 mb-3">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-black text-xs font-semibold uppercase tracking-wider">Didukung Oleh</span>
          </div>
          <h2 className="text-3xl font-bold text-black">
            Mitra & <span className="gradient-text">Sponsor</span>
          </h2>
        </motion.div>

        {tiers.map(([tier, config]) => {
          const tierSponsors = sponsors.filter((s) => s.tier === tier);
          if (tierSponsors.length === 0) return null;

          return (
            <div key={tier} className="mb-10">
              <p className="text-center text-black text-xs uppercase tracking-widest mb-6">{config.label}</p>
              <div className="flex flex-wrap justify-center gap-4">
                {tierSponsors.map((sponsor, i) => (
                  <motion.div
                    key={sponsor.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {sponsor.websiteUrl ? (
                      <a
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block glass rounded-xl px-6 py-4 hover:bg-white/[0.05] transition-all card-hover"
                      >
                        <span className={cn(config.size, config.color)}>{sponsor.name}</span>
                      </a>
                    ) : (
                      <div className="glass rounded-xl px-6 py-4">
                        <span className={cn(config.size, config.color)}>{sponsor.name}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
