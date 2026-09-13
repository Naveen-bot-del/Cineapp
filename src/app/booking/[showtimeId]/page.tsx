"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SeatMap } from "@/components/SeatMap";
import { formatCents, formatTime, formatDate } from "@/lib/utils";
import { Film, MapPin, Clock, Calendar, ChevronLeft, AlertCircle, Sparkles } from "lucide-react";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const showtimeId = params.showtimeId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    async function loadSeats() {
      try {
        const res = await fetch(`/api/seats/showtime?showtimeId=${showtimeId}`);
        if (!res.ok) {
          // Fallback direct mock query
          const fallbackData = await fetchFallbackShowtime(showtimeId);
          setData(fallbackData);
        } else {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        const fallbackData = await fetchFallbackShowtime(showtimeId);
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    }
    loadSeats();
  }, [showtimeId]);

  const handleHoldSeats = async (seatIds: string[]) => {
    setIsHolding(true);
    setError(null);

    try {
      const res = await fetch("/api/seats/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showtimeId, seatIds }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || "Failed to hold seats. Someone may have just selected them.");
        setIsHolding(false);
        return;
      }

      // Transition to checkout
      router.push(`/checkout/${result.bookingId}`);
    } catch (err: any) {
      setError(err.message || "Network error while holding seats");
      setIsHolding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading cinema auditorium seat map...</span>
      </div>
    );
  }

  if (!data || !data.showtime) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-surface-200 border border-white/10 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">Showtime Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">The requested screening is unavailable or has ended.</p>
        <Link
          href="/#movies"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold"
        >
          Return to Movies
        </Link>
      </div>
    );
  }

  const { showtime, movie, cinema, seats } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href={`/movies/${movie?.slug || ""}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Movie Details
        </Link>
      </div>

      {/* Showtime Summary Header */}
      <div className="p-6 rounded-3xl bg-surface-200 border border-white/10 mb-10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-14 h-20 rounded-xl object-cover border border-white/10 flex-shrink-0 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-500 text-white">
                {movie.rating}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">
                {showtime.format}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{movie.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              {cinema.name} • {showtime.auditoriumName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs bg-surface-100 px-4 py-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-4 h-4 text-brand-400" />
            <span>{formatDate(showtime.startTime)}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-4 h-4 text-cinema-gold" />
            <span className="font-bold text-white">{formatTime(showtime.startTime)}</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Visual Seat Map */}
      <SeatMap
        seats={seats}
        basePriceCents={showtime.basePriceCents}
        onHoldSeats={handleHoldSeats}
        isSubmitting={isHolding}
      />
    </div>
  );
}

// Client fallback helper
async function fetchFallbackShowtime(showtimeId: string) {
  const { cineStore } = await import("@/lib/data-service");
  return {
    showtime: cineStore.showtimes.find((s) => s.id === showtimeId) || cineStore.showtimes[0],
    movie: cineStore.movies[0],
    cinema: cineStore.cinemas[0],
    seats: cineStore.seats.slice(0, 60),
  };
}
