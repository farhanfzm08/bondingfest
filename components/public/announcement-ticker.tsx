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
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600/90 to-violet-600/90 backdrop-blur-sm border-b border-white/10">
      <div className="flex items-center h-8">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 bg-white/10 h-full border-r border-white/10">
          <Megaphone className="w-3.5 h-3.5 text-black" />
          <span className="text-black text-xs font-semibold tracking-wider uppercase">Live</span>
          <span className="pulse-dot" />
        </div>
        <div className="running-text-container flex-1">
          <span className="running-text text-black text-xs font-medium">
            {text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {text}
          </span>
        </div>
      </div>
    </div>
  );
}
