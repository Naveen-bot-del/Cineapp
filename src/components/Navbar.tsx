"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Film, Ticket, MapPin, ShieldCheck, User, LogOut, Menu, X, Sparkles } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { name: "Movies", href: "/#movies", icon: Film },
    { name: "Cinemas", href: "/cinemas", icon: MapPin },
    { name: "My Bookings", href: "/my-bookings", icon: Ticket },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-surface-300/90 backdrop-blur-md border-b border-white/10 shadow-2xl" : "bg-gradient-to-b from-background/90 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cinema-gold flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-300">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                CINE<span className="text-brand-500">BOOK</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase block -mt-1 font-semibold">
                Premium Ticketing
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-200/60 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-full">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-brand-500 text-white shadow-glow"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* User / Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cinema-gold/10 border border-cinema-gold/30 text-cinema-gold hover:bg-cinema-gold/20 text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Suite
              </Link>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full bg-surface-100 border border-white/10">
                  <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-glow transition-all hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-surface-100 border border-white/10 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-300/95 backdrop-blur-xl border-b border-white/10 px-4 pt-4 pb-6 space-y-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-200/80 text-slate-200 hover:bg-white/10 text-base font-medium"
              >
                <Icon className="w-5 h-5 text-brand-500" />
                {link.name}
              </Link>
            );
          })}

          {currentUser?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cinema-gold/10 text-cinema-gold border border-cinema-gold/30 text-base font-medium"
            >
              <ShieldCheck className="w-5 h-5" />
              Admin Management Portal
            </Link>
          )}

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            {currentUser ? (
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{currentUser.name}</div>
                    <div className="text-xs text-slate-400">{currentUser.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-red-400"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-surface-100 text-sm font-medium text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-glow"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
