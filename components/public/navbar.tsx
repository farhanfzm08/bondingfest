"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Trophy, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/klasemen", label: "Klasemen" },
  { href: "/lomba", label: "Lomba" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/pengumuman", label: "Pengumuman" },
  { href: "/galeri", label: "Galeri" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-white border-b-[3px] border-[#1C1917] shadow-[0_4px_0_#1C1917]"
          : "bg-[#FFFDF5] border-b-[3px] border-[#1C1917]"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-[6px] bg-[#0891B2] border-[3px] border-[#1C1917] flex items-center justify-center shadow-[3px_3px_0_#1C1917] group-hover:shadow-[1px_1px_0_#1C1917] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all duration-100">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="font-black text-base text-[#1C1917] leading-none tracking-tight">BONDING</div>
            <div className="font-bold text-xs text-[#0891B2]">FEST 2026</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 text-sm font-800 border-2 rounded-[6px] transition-all duration-100 font-bold",
                pathname === link.href
                  ? "bg-[#0891B2] text-white border-[#1C1917] shadow-[2px_2px_0_#1C1917]"
                  : "text-[#1C1917] border-transparent hover:border-[#1C1917] hover:bg-[#FEF3C7]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Admin Button */}
        <div className="hidden md:flex items-center">
          <Link
            href="/admin/dashboard"
            className="btn-neon text-sm px-5 py-2"
          >
            Admin Panel
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 border-[2.5px] border-[#1C1917] rounded-[6px] bg-white shadow-[2px_2px_0_#1C1917] text-[#1C1917] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-white border-t-[3px] border-[#1C1917] overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-[6px] text-sm font-bold border-2 transition-all",
                    pathname === link.href
                      ? "bg-[#0891B2] text-white border-[#1C1917]"
                      : "text-[#1C1917] border-transparent hover:border-[#1C1917] hover:bg-[#FEF3C7]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="mt-2 btn-neon text-sm text-center py-3"
              >
                Admin Panel
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
