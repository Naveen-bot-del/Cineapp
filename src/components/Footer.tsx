import React from "react";
import Link from "next/link";
import { Film, Shield, Sparkles, Server, CreditCard, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-surface-300 border-t border-white/5 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center shadow-glow">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                CINE<span className="text-brand-500">BOOK</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Next-generation cinema ticketing platform powered by Next.js, Neon PostgreSQL, Drizzle ORM, and high-concurrency transactional seat reservations.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                System Operational
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#movies" className="hover:text-brand-400 transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link href="/#upcoming" className="hover:text-brand-400 transition-colors">
                  Upcoming Blockbusters
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-brand-400 transition-colors">
                  Cinema Locations
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-brand-400 transition-colors">
                  Ticket Passes & History
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology Badges */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-300">
                <Server className="w-3.5 h-3.5 text-brand-400" />
                <span>Next.js 15 App Router & Server Actions</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-cinema-neon" />
                <span>Neon PostgreSQL Serverless + Drizzle ORM</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-cinema-gold" />
                <span>Stripe Test Mode + Idempotent Processing</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Transactional Row Locking & Vercel Cron</span>
              </li>
            </ul>
          </div>

          {/* Admin & Security */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Demo Portals
            </h4>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-surface-200 border border-white/5 text-xs">
                <div className="font-semibold text-white mb-1">Admin Access</div>
                <div className="text-slate-400">admin@cinebook.com</div>
                <div className="text-slate-500 text-[10px]">Pass: Admin123!</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-200 border border-white/5 text-xs">
                <div className="font-semibold text-white mb-1">Customer Demo</div>
                <div className="text-slate-400">alex.turner@example.com</div>
                <div className="text-slate-500 text-[10px]">Pass: Password123!</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>© 2026 CineBook Inc. Built for production deployment on Vercel.</div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
