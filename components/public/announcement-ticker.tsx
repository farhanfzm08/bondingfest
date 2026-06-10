"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
}

export default function AnnouncementTicker() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch("/api/announcements?runningText=true&limit=5")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAnnouncements(data);
      })
      .catch(() => {});
  }, []);

  if (announcements.length === 0) return null;

  const text = announcements.map((a) => `📢 ${a.title}`).join("   •   ");

  return (
    <div className="relative z-40 bg-[#1C1917] border-b-[3px] border-[#1C1917]">
      <div className="flex items-center h-10">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 bg-white/10 h-full border-r-2 border-[#1C1917]">
          <Megaphone className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-yellow-400 text-xs font-black tracking-wider uppercase">Live</span>
          <span className="pulse-dot bg-yellow-400" />
        </div>
        <div className="running-text-container flex-1">
          <span className="running-text text-white text-xs font-bold uppercase tracking-wider">
            {text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {text}
          </span>
        </div>
      </div>
    </div>
  );
}
