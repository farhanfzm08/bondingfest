import Link from "next/link";
import { Trophy, Heart, Camera, Play, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] mt-20">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-black">BONDING FEST 2026</span>
            </div>
            <p className="text-black text-sm leading-relaxed max-w-xs">
              Platform resmi manajemen dan klasemen BONDING FEST 2026. 
              Pantau hasil, jadwal, dan informasi seluruh perlombaan.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { icon: Camera, href: "#", label: "Instagram" },
                { icon: Play, href: "#", label: "YouTube" },
                { icon: MessageCircle, href: "#", label: "Twitter" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg glass flex items-center justify-center text-black hover:text-black hover:bg-white/10 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-black font-semibold mb-4 text-sm">Navigasi</h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Beranda" },
                { href: "/klasemen", label: "Klasemen Juara Umum" },
                { href: "/lomba", label: "Semua Lomba" },
                { href: "/jadwal", label: "Jadwal Pertandingan" },
                { href: "/pengumuman", label: "Pengumuman" },
                { href: "/galeri", label: "Galeri" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-black hover:text-black text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-black font-semibold mb-4 text-sm">Informasi</h4>
            <ul className="space-y-2 text-sm text-black">
              <li>📍 PT TACI, Bekasi, Indonesia</li>
              <li>📅 23 Juni – 25 Juli 2026</li>
              <li>🏆 9 Cabang Lomba</li>
              <li>👥 100+ Peserta</li>
            </ul>
            <div className="mt-6">
              <Link
                href="/admin/login"
                className="text-xs text-black hover:text-black transition-colors"
              >
                Admin Login →
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-black text-xs">
            © 2026 FAMILIAR TALK MANUFACTURE. Hak Cipta Dilindungi.
          </p>
          <p className="text-black text-xs flex items-center gap-1">
            Dibuat dengan <Heart className="w-3 h-3 text-red-400 fill-red-400" /> untuk Event Terbaik
          </p>
        </div>
      </div>
    </footer>
  );
}
