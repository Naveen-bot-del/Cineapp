import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "CineBook | Premium Cinema Ticketing & Showtime Reservations",
  description: "Experience cinema like never before. Instant seat selection, Dolby Atmos & IMAX 70mm showtimes, digital QR passes, and secure booking.",
  keywords: ["Cinema", "Movie Tickets", "IMAX", "Dolby Atmos", "CineBook", "Showtimes", "Seat Reservation"],
  authors: [{ name: "CineBook Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        {/* Ambient Glow Backgrounds */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px]" />
          <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-cinema-screen/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] left-[30%] w-[700px] h-[700px] bg-cinema-gold/5 rounded-full blur-[160px]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-20">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
