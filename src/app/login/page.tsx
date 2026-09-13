"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, Lock, Mail, AlertCircle, Sparkles, ShieldCheck, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      router.push(data.user.role === "ADMIN" ? "/admin" : "/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to log in");
      setLoading(false);
    }
  };

  const fillCredentials = (role: "admin" | "customer") => {
    if (role === "admin") {
      setEmail("admin@cinebook.com");
      setPassword("Admin123!");
    } else {
      setEmail("alex.turner@example.com");
      setPassword("Password123!");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center mx-auto shadow-glow">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Welcome Back to CineBook
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access your digital tickets and reserved showtimes.
          </p>
        </div>

        {/* 1-Click Demo Fillers */}
        <div className="p-4 rounded-2xl bg-surface-200 border border-white/5 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            ⚡ Quick Test Sign-In:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("customer")}
              className="px-3 py-2 rounded-xl bg-surface-100 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-brand-400" />
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("admin")}
              className="px-3 py-2 rounded-xl bg-cinema-gold/10 hover:bg-cinema-gold/20 text-xs font-semibold text-cinema-gold border border-cinema-gold/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8 rounded-3xl bg-surface-200 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="alex.turner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white shadow-glow transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Signing in..." : "Sign In to CineBook"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            Don't have an account yet?{" "}
            <Link href="/register" className="text-brand-400 hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
