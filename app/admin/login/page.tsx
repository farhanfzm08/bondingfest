"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Email atau password salah");
        setLoading(false);
      } else {
        toast.success("Login berhasil! Selamat datang, Admin.");
        // Next.js router for client-side navigation
        router.push("/admin/dashboard");
        // Give router time to push before refreshing server components
        setTimeout(() => {
          router.refresh();
        }, 100);
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #ECFEFF 0%, #FFFBEB 50%, #ECFDF5 100%)",
      }}
    >
      {/* Decorative beach elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#0891B2]" />
      <div className="absolute top-2 left-0 w-full h-1 bg-[#F97316]" />

      {/* Wave pattern background */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle, #0891B2 1px, transparent 1px)",
        backgroundSize: "30px 30px"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo area outside card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-[2.5px] border-[#1C1917] bg-[#FFFBEB] shadow-[3px_3px_0_#F59E0B] text-sm font-black text-[#1C1917]">
            🏖️ BONDING FEST 2026
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[8px] border-[3px] border-[#1C1917] bg-white p-8 shadow-[8px_8px_0_#1C1917]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[8px] border-[3px] border-[#1C1917] bg-[#0891B2] mb-4 shadow-[4px_4px_0_#1C1917]">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-[#1C1917] mb-1">Admin Panel</h1>
            <p className="text-black text-sm font-semibold">Masuk untuk mengelola event</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-[#FEF2F2] border-[2.5px] border-[#C2410C] rounded-[6px] px-4 py-3 mb-6 shadow-[2px_2px_0_#C2410C]"
            >
              <AlertCircle className="w-4 h-4 text-[#C2410C] flex-shrink-0" />
              <p className="text-[#C2410C] text-sm font-bold">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[#1C1917] text-xs font-black mb-2 uppercase tracking-wider">ID / Email</label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan ID / Email"
                required
                className="neu-input"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#1C1917] text-xs font-black mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="neu-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-[#1C1917] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full btn-neon py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Masuk...
                </>
              ) : (
                "🔐 Masuk ke Admin Panel"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t-[2px] border-[#E7E5E4] text-center">
            <p className="text-black text-xs font-semibold">
              Gunakan ID yang diberikan administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-black text-xs font-semibold mt-4">
          BONDING FEST 2026 — Manufacturing Division
        </p>
      </motion.div>
    </div>
  );
}
