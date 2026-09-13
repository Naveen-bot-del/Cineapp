"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCents, formatTime, formatDate } from "@/lib/utils";
import { BookingDetails } from "@/lib/data-service";
import { Ticket, Calendar, Clock, MapPin, ChevronRight, XCircle, CheckCircle, AlertCircle, Film } from "lucide-react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "PAST">("UPCOMING");

  useEffect(() => {
    async function loadBookings() {
      try {
        const { cineStore } = await import("@/lib/data-service");
        // Load all bookings from store
        const list: BookingDetails[] = [];
        const seen = new Set<string>();
        for (const [_, b] of cineStore.bookings) {
          if (!seen.has(b.id)) {
            seen.add(b.id);
            list.push(b);
          }
        }
        setBookings(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const now = Date.now();
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.startTime).getTime() >= now && b.status !== "CANCELLED"
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.startTime).getTime() < now || b.status === "CANCELLED"
  );

  const displayedList = activeTab === "UPCOMING" ? upcomingBookings : pastBookings;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-brand-500" />
            My Ticket Passes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your active cinema tickets, QR entry codes, and booking receipts.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-surface-200 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab("UPCOMING")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "UPCOMING"
                ? "bg-brand-500 text-white shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("PAST")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "PAST"
                ? "bg-surface-100 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            History & Cancelled ({pastBookings.length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {displayedList.length > 0 ? (
        <div className="space-y-4">
          {displayedList.map((booking) => {
            const isCancelled = booking.status === "CANCELLED";

            return (
              <div
                key={booking.id}
                className="group p-6 rounded-2xl bg-surface-200 border border-white/5 hover:border-brand-500/30 transition-all shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={booking.moviePoster}
                    alt={booking.movieTitle}
                    className="w-16 h-24 object-cover rounded-xl border border-white/10 flex-shrink-0 shadow-md"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCancelled
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {booking.status}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        #{booking.bookingReference}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">
                      {booking.movieTitle}
                    </h3>

                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-400" />
                      {booking.cinemaName} • {booking.auditoriumName}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(booking.startTime)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-cinema-gold">
                        <Clock className="w-3.5 h-3.5 text-cinema-gold" />
                        {formatTime(booking.startTime)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 pt-1">
                      Seats:{" "}
                      <span className="text-white font-semibold">
                        {booking.seats.map((s) => s.seatLabel).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Total Amount</div>
                    <div className="text-lg font-black text-white">
                      {formatCents(booking.totalAmountCents)}
                    </div>
                  </div>

                  <Link
                    href={`/tickets/${booking.bookingReference}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-glow transition-all flex items-center gap-1.5"
                  >
                    View Digital Pass <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-surface-200 border border-white/5 text-center">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {activeTab === "UPCOMING" ? "No upcoming bookings found" : "No past booking history"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            Ready for your next movie experience? Browse our featured blockbusters and pick your seats.
          </p>
          <Link
            href="/#movies"
            className="inline-block px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-glow"
          >
            Explore Now Showing
          </Link>
        </div>
      )}
    </div>
  );
}
