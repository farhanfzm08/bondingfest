"use client";

import { Bell, Search, ExternalLink, Waves } from "lucide-react";
import Link from "next/link";
import type { Session } from "next-auth";

export default function AdminTopbar({ session }: { session: Session }) {
  const initials = session.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "A";

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b-[3px] border-[#1C1917] bg-white">
      {/* Page context */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 text-black text-sm font-bold">
          <Waves className="w-4 h-4 text-[#0891B2]" />
          <span>BONDING FEST 2026</span>
          <span className="text-[#D4D0CA]">/</span>
          <span className="text-[#1C1917]">Admin Panel</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* View site */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border-2 border-[#1C1917] text-[#0891B2] text-xs font-bold shadow-[2px_2px_0_#1C1917] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 bg-[#ECFEFF]"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Website
        </Link>

        {/* Notification */}
        <button
          id="notifications-bell"
          className="relative w-9 h-9 rounded-[6px] border-2 border-[#1C1917] bg-white flex items-center justify-center text-[#1C1917] shadow-[2px_2px_0_#1C1917] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F97316] border-2 border-white" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2 border-2 border-[#1C1917] rounded-[6px] bg-[#FFFDF5] shadow-[2px_2px_0_#1C1917]">
          <div className="w-7 h-7 rounded-[4px] bg-[#0891B2] border-[2px] border-[#1C1917] flex items-center justify-center text-white text-xs font-black">
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="text-[#1C1917] text-xs font-black leading-tight">{session.user?.name}</div>
            <div className="text-black text-xs leading-tight font-semibold">
              {(session.user as { role?: string })?.role || "Admin"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
