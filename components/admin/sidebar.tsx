"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trophy, LayoutDashboard, Swords, Users, BarChart2,
  Megaphone, Settings, LogOut, ChevronLeft, ChevronRight,
  Medal, Zap, Calendar, Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin/dashboard",   icon: LayoutDashboard, label: "Dashboard",    color: "#0891B2" },
  { href: "/admin/lomba",       icon: Swords,          label: "Kelola Lomba", color: "#10B981" },
  { href: "/admin/peserta",     icon: Users,           label: "Peserta & Tim",color: "#F97316" },
  { href: "/admin/klasemen",    icon: BarChart2,       label: "Klasemen",     color: "#8B5CF6" },
  { href: "/admin/pengumuman",  icon: Megaphone,       label: "Pengumuman",   color: "#F59E0B" },
  { href: "/admin/galeri",      icon: Image,           label: "Galeri",       color: "#EC4899" },
  { href: "/admin/pengaturan",  icon: Settings,        label: "Pengaturan",   color: "#6B7280" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 230 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex-shrink-0 h-screen bg-white border-r-[3px] border-[#1C1917] flex flex-col z-20"
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 p-4 border-b-[3px] border-[#1C1917] h-16 bg-[#0891B2]", collapsed ? "justify-center" : "")}>
        <div className="w-9 h-9 rounded-[6px] bg-white border-[2.5px] border-[#1C1917] flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5 text-[#0891B2]" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="text-black font-black text-sm leading-tight">BONDING</div>
              <div className="text-black text-xs font-bold">Admin Panel</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, color }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-all duration-100 border-2 font-bold text-sm",
                isActive
                  ? "border-[#1C1917] text-[#1C1917] shadow-[2px_2px_0_#1C1917]"
                  : "border-transparent text-black hover:border-[#1C1917] hover:text-[#1C1917] hover:bg-[#FEF9EE]"
              )}
              style={isActive ? { backgroundColor: color + "1A" } : {}}
            >
              <Icon
                className="w-5 h-5 flex-shrink-0 transition-colors"
                style={{ color: isActive ? color : undefined }}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !collapsed && (
                <div className="ml-auto w-2 h-2 rounded-full border-2 border-[#1C1917]" style={{ background: color }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t-[3px] border-[#1C1917] space-y-2 bg-[#FFFDF5]">
        <Link
          href="/"
          target="_blank"
          title={collapsed ? "Lihat Website" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-[6px] text-[#0891B2] border-2 border-transparent hover:border-[#1C1917] hover:bg-[#ECFEFF] font-bold text-sm transition-all duration-100",
            collapsed ? "justify-center" : ""
          )}
        >
          <Zap className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Lihat Website</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[#C2410C] border-2 border-transparent hover:border-[#C2410C] hover:bg-[#FFF7ED] font-bold text-sm transition-all duration-100",
            collapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-[14px] top-20 w-7 h-7 rounded-full bg-white border-[2.5px] border-[#1C1917] flex items-center justify-center text-[#1C1917] shadow-[2px_2px_0_#1C1917] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 z-30"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </motion.aside>
  );
}
