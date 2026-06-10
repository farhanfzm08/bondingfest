import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import AnnouncementTicker from "@/components/public/announcement-ticker";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <Navbar />
      <AnnouncementTicker />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
