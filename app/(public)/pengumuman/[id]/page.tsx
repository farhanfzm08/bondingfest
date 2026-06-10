import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Pin, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ann = await prisma.announcement.findUnique({ where: { id } });
  return { title: ann?.title || "Pengumuman" };
}

const typeConfig = {
  SUCCESS: { icon: CheckCircle, color: "text-green-400", bg: "border-green-500/30 bg-green-500/[0.05]" },
  WARNING: { icon: AlertTriangle, color: "text-amber-400", bg: "border-amber-500/30 bg-amber-500/[0.05]" },
  URGENT: { icon: AlertTriangle, color: "text-red-400", bg: "border-red-500/30 bg-red-500/[0.05]" },
  INFO: { icon: Info, color: "text-blue-400", bg: "border-blue-500/30 bg-blue-500/[0.03]" },
};

export default async function AnnouncementDetailPage({ params }: Props) {
  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: { competition: { select: { name: true, slug: true } }, event: { select: { name: true } } },
  });

  if (!announcement) notFound();

  const config = typeConfig[announcement.type as keyof typeof typeConfig] || typeConfig.INFO;
  const Icon = config.icon;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/pengumuman" className="inline-flex items-center gap-2 text-black hover:text-black text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Pengumuman
        </Link>

        <article className={cn("glass rounded-2xl p-8 border", config.bg)}>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-white/[0.05] flex-shrink-0">
              <Icon className={cn("w-6 h-6", config.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {announcement.isPinned && <Pin className="w-3.5 h-3.5 text-indigo-400" />}
                <span className="text-xs text-black">{announcement.type}</span>
                {announcement.competition && (
                  <Link href={`/lomba/${announcement.competition.slug}`} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20">
                    {announcement.competition.name}
                  </Link>
                )}
              </div>
              <h1 className="text-2xl font-black text-black mb-2">{announcement.title}</h1>
              <div className="flex items-center gap-2 text-black text-xs">
                <Clock className="w-3 h-3" />
                <span>{formatDateTime(announcement.publishedAt)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-6">
            <p className="text-black leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-black text-xs">{announcement.event.name}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
