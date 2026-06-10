import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BONDING FEST 2026 — Pusat Klasemen & Perlombaan",
    template: "%s | BONDING FEST 2026",
  },
  description:
    "Platform resmi manajemen dan klasemen BONDING FEST 2026. Pantau hasil pertandingan, klasemen juara umum, jadwal lomba, dan informasi terkini dari seluruh cabang perlombaan.",
  keywords: ["bonding fest", "lomba", "klasemen", "perlombaan", "kompetisi"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    title: "BONDING FEST 2026",
    description: "Pusat Klasemen & Manajemen Perlombaan",
    siteName: "BONDING FEST 2026",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-surface-2)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border-strong)",
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
