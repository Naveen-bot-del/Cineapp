"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCents, formatDate, formatTime } from "@/lib/utils";
import { ShieldCheck, Film, PlusCircle, DollarSign, Ticket, Calendar, MapPin, RefreshCw, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({
    totalRevenueCents: 48950,
    totalConfirmedTickets: 28,
    totalBookings: 12,
    totalMovies: 8,
    totalCinemas: 3,
    totalShowtimes: 36,
  });

  const [activeTab, setActiveTab] = useState<"METRICS" | "ADD_MOVIE" | "ADD_SHOWTIME">("METRICS");
  const [cronLoading, setCronLoading] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  // Add Movie Form
  const [movieTitle, setMovieTitle] = useState("");
  const [movieSlug, setMovieSlug] = useState("");
  const [movieDesc, setMovieDesc] = useState("");
  const [moviePoster, setMoviePoster] = useState("https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80");
  const [movieBackdrop, setMovieBackdrop] = useState("https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80");
  const [movieDuration, setMovieDuration] = useState("120");
  const [movieRating, setMovieRating] = useState("PG-13");
  const [movieLang, setMovieLang] = useState("English");
  const [movieDirector, setMovieDirector] = useState("");
  const [movieCast, setMovieCast] = useState("");
  const [movieStatus, setMovieStatus] = useState<"NOW_SHOWING" | "COMING_SOON">("NOW_SHOWING");
  const [movieSuccess, setMovieSuccess] = useState<string | null>(null);

  // Add Showtime Form
  const [selectedMovie, setSelectedMovie] = useState("m-runner-001");
  const [selectedCinema, setSelectedCinema] = useState("c-grand-imax-001");
  const [stTime, setStTime] = useState(new Date().toISOString().slice(0, 16));
  const [stPrice, setStPrice] = useState("1899");
  const [stFormat, setStFormat] = useState("IMAX 3D");
  const [stSuccess, setStSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const { DataService } = await import("@/lib/data-service");
        const realStats = await DataService.getAdminStats();
        setStats(realStats);
      } catch {}
    }
    loadStats();
  }, []);

  const handleCronRelease = async () => {
    setCronLoading(true);
    setCronMessage(null);
    try {
      const res = await fetch("/api/cron/release-expired-holds", {
        method: "POST",
      });
      const data = await res.json();
      setCronMessage(data.message || "Expired holds checked & released.");
    } catch (err: any) {
      setCronMessage("Cron request error: " + err.message);
    } finally {
      setCronLoading(false);
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovieSuccess(null);
    try {
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: movieTitle,
          slug: movieSlug || movieTitle.toLowerCase().replace(/\s+/g, "-"),
          description: movieDesc,
          posterUrl: moviePoster,
          backdropUrl: movieBackdrop,
          durationMinutes: movieDuration,
          rating: movieRating,
          language: movieLang,
          director: movieDirector,
          cast: movieCast,
          status: movieStatus,
          genres: ["Action", "Sci-Fi"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMovieSuccess(`Movie "${movieTitle}" created successfully!`);
        setMovieTitle("");
        setMovieSlug("");
        setMovieDesc("");
      }
    } catch (err: any) {
      setMovieSuccess("Error: " + err.message);
    }
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setStSuccess(null);
    try {
      const res = await fetch("/api/admin/showtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: selectedMovie,
          cinemaId: selectedCinema,
          auditoriumId: "aud-cinebook-grand-imax-screen-1---imax-laser",
          startTime: new Date(stTime).toISOString(),
          basePriceCents: Number(stPrice),
          format: stFormat,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStSuccess("Showtime scheduled successfully!");
      }
    } catch (err: any) {
      setStSuccess("Error: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-cinema-gold text-xs font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            Executive Administration Suite
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            CineBook Operations Dashboard
          </h1>
        </div>

        {/* Manual Cron Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCronRelease}
            disabled={cronLoading}
            className="px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-white/10 text-xs font-bold text-slate-200 border border-white/10 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cronLoading ? "animate-spin text-brand-400" : ""}`} />
            Release Expired Holds (Cron)
          </button>
        </div>
      </div>

      {cronMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span>{cronMessage}</span>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="p-6 rounded-2xl bg-surface-200 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatCents(stats.totalRevenueCents)}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live Transaction Volume
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-200 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Tickets Issued</span>
            <Ticket className="w-4 h-4 text-cinema-neon" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalConfirmedTickets}</div>
          <div className="text-[11px] text-slate-400 mt-1">Confirmed admissions</div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-200 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Movies in Catalog</span>
            <Film className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalMovies}</div>
          <div className="text-[11px] text-slate-400 mt-1">Now Showing & Coming Soon</div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-200 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Cinemas & Screens</span>
            <MapPin className="w-4 h-4 text-cinema-gold" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats.totalCinemas} Theaters
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{stats.totalShowtimes} Active Slots</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-surface-200 p-1.5 rounded-2xl border border-white/5 mb-8 w-fit">
        <button
          onClick={() => setActiveTab("METRICS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "METRICS" ? "bg-brand-500 text-white shadow-glow" : "text-slate-400 hover:text-white"
          }`}
        >
          Catalog & Showtimes
        </button>
        <button
          onClick={() => setActiveTab("ADD_MOVIE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ADD_MOVIE" ? "bg-brand-500 text-white shadow-glow" : "text-slate-400 hover:text-white"
          }`}
        >
          + Add New Movie
        </button>
        <button
          onClick={() => setActiveTab("ADD_SHOWTIME")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ADD_SHOWTIME" ? "bg-brand-500 text-white shadow-glow" : "text-slate-400 hover:text-white"
          }`}
        >
          + Schedule Showtime
        </button>
      </div>

      {/* Tab 1: Catalog & Metrics */}
      {activeTab === "METRICS" && (
        <div className="p-6 rounded-3xl bg-surface-200 border border-white/5 space-y-6">
          <h2 className="text-lg font-bold text-white">Active Production Movies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Runner", status: "NOW_SHOWING", starring: "Alan Ritchson", format: "IMAX 70mm, 2D" },
              { title: "Avengers: Doomsday", status: "COMING_SOON", starring: "Robert Downey Jr.", format: "IMAX 3D" },
              { title: "Dune: Part Two", status: "NOW_SHOWING", starring: "Timothée Chalamet", format: "Dolby Atmos" },
              { title: "Oppenheimer", status: "NOW_SHOWING", starring: "Cillian Murphy", format: "IMAX 70mm" },
              { title: "Gladiator II", status: "NOW_SHOWING", starring: "Paul Mescal", format: "Dolby Cinema" },
              { title: "Deadpool & Wolverine", status: "NOW_SHOWING", starring: "Ryan Reynolds", format: "3D, 2D" },
            ].map((m) => (
              <div
                key={m.title}
                className="p-4 rounded-xl bg-surface-100 border border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-white">{m.title}</div>
                  <div className="text-xs text-slate-400">{m.starring}</div>
                  <div className="text-[10px] text-cinema-gold mt-1">{m.format}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Add Movie */}
      {activeTab === "ADD_MOVIE" && (
        <div className="p-8 rounded-3xl bg-surface-200 border border-white/5 max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-brand-500" />
            Add Movie to Catalog
          </h2>

          {movieSuccess && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              {movieSuccess}
            </div>
          )}

          <form onSubmit={handleCreateMovie} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Movie Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Mission: Impossible - The Final Reckoning"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Synopsis</label>
              <textarea
                required
                rows={3}
                placeholder="Enter plot summary..."
                value={movieDesc}
                onChange={(e) => setMovieDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Min)</label>
                <input
                  type="number"
                  value={movieDuration}
                  onChange={(e) => setMovieDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rating</label>
                <select
                  value={movieRating}
                  onChange={(e) => setMovieRating(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white"
                >
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 px-6 py-3 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-white shadow-glow"
            >
              Publish Movie
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Schedule Showtime */}
      {activeTab === "ADD_SHOWTIME" && (
        <div className="p-8 rounded-3xl bg-surface-200 border border-white/5 max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            Schedule Showtime Slot
          </h2>

          {stSuccess && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              {stSuccess}
            </div>
          )}

          <form onSubmit={handleCreateShowtime} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Movie</label>
              <select
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white"
              >
                <option value="m-runner-001">Runner (Alan Ritchson)</option>
                <option value="m-avengers-002">Avengers: Doomsday</option>
                <option value="m-dune2-003">Dune: Part Two</option>
                <option value="m-oppen-004">Oppenheimer</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Format</label>
                <select
                  value={stFormat}
                  onChange={(e) => setStFormat(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white"
                >
                  <option value="IMAX 3D">IMAX 3D</option>
                  <option value="Dolby Atmos">Dolby Atmos</option>
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Base Price ($ Cents)</label>
                <input
                  type="number"
                  value={stPrice}
                  onChange={(e) => setStPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date & Showtime</label>
              <input
                type="datetime-local"
                value={stTime}
                onChange={(e) => setStTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              className="mt-4 px-6 py-3 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-white shadow-glow"
            >
              Schedule Showtime
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
