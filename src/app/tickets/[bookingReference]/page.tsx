"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCents, formatTime, formatDate } from "@/lib/utils";
import { BookingDetails } from "@/lib/data-service";
import { CheckCircle2, QrCode, Printer, Download, MapPin, Calendar, Clock, Ticket, AlertCircle, ChevronLeft, ShieldCheck, XCircle } from "lucide-react";

export default function TicketPassPage() {
  const params = useParams();
  const router = useRouter();
  const bookingReference = params.bookingReference as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTicket() {
      try {
        const res = await fetch(`/api/bookings/details?reference=${bookingReference}`);
        if (!res.ok) {
          // Fallback direct mock query
          const { cineStore } = await import("@/lib/data-service");
          const found = cineStore.bookings.get(bookingReference);
          setBooking(found || null);
        } else {
          const data = await res.json();
          setBooking(data.booking);
        }
      } catch {
        const { cineStore } = await import("@/lib/data-service");
        const found = cineStore.bookings.get(bookingReference);
        setBooking(found || null);
      } finally {
        setLoading(false);
      }
    }
    loadTicket();
  }, [bookingReference]);

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking? A 100% refund will be processed to your payment method.")) {
      return;
    }

    setCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingReference }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCancelError(data.error || "Failed to cancel booking");
        setCancelling(false);
        return;
      }

      setCancelSuccess(true);
      if (booking) {
        setBooking({ ...booking, status: "CANCELLED" });
      }
    } catch (err: any) {
      setCancelError(err.message || "Network error while cancelling booking");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading your digital cinema ticket...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-surface-200 border border-white/10 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">Ticket Pass Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">We could not locate a ticket with reference code #{bookingReference}.</p>
        <Link
          href="/my-bookings"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  const isCancelled = booking.status === "CANCELLED";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/my-bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> My Bookings
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-100 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Pass
          </button>
        </div>
      </div>

      {/* Booking Confirmation Alert */}
      {!isCancelled && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold">Booking Confirmed!</div>
              <div className="text-xs text-emerald-400/80">
                Your tickets are secured. Present the digital QR code at the theater entrance.
              </div>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-400/70">Reference</div>
            <div className="text-sm font-mono font-black text-emerald-300">{booking.bookingReference}</div>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 mb-8 flex items-center gap-3">
          <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold">Booking Cancelled</div>
            <div className="text-xs text-rose-400/80">
              This reservation was cancelled and a full refund of {formatCents(booking.totalAmountCents)} was issued.
            </div>
          </div>
        </div>
      )}

      {/* Cinema Ticket Card */}
      <div className="relative rounded-3xl bg-surface-200 border border-white/10 overflow-hidden shadow-2xl">
        {/* Ticket Header Banner */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden">
          <img
            src={booking.moviePoster}
            alt={booking.movieTitle}
            className="w-full h-full object-cover filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-200 via-surface-200/60 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-brand-500 text-white uppercase tracking-wider mb-2 inline-block shadow-glow">
                Digital Cinema Pass
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{booking.movieTitle}</h1>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                {booking.cinemaName} • {booking.auditoriumName}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-slate-200 border border-white/10">
                {booking.format}
              </span>
            </div>
          </div>
        </div>

        {/* Perforated Divider Line */}
        <div className="relative w-full h-6 flex items-center justify-between px-[-12px]">
          <div className="w-6 h-6 rounded-full bg-[#080c14] -ml-3" />
          <div className="w-full border-t-2 border-dashed border-white/10" />
          <div className="w-6 h-6 rounded-full bg-[#080c14] -mr-3" />
        </div>

        {/* Ticket Body & QR Codes */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Details (Left 7 cols) */}
          <div className="md:col-span-7 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Date & Showtime
                </span>
                <div className="text-sm font-bold text-white">{formatDate(booking.startTime)}</div>
                <div className="text-xs text-cinema-gold font-semibold">{formatTime(booking.startTime)}</div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Screen & Format
                </span>
                <div className="text-sm font-bold text-white">{booking.auditoriumName}</div>
                <div className="text-xs text-slate-400">{booking.format} Digital Audio</div>
              </div>
            </div>

            {/* Reserved Seats List */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Reserved Seats ({booking.seats.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {booking.seats.map((seat) => (
                  <span
                    key={seat.seatId}
                    className="px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400 font-bold text-sm"
                  >
                    Seat {seat.seatLabel} <span className="text-xs text-slate-400 font-normal">({seat.seatType})</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-xs text-slate-400">
              <div>
                <span>Total Paid: </span>
                <span className="font-bold text-white">{formatCents(booking.totalAmountCents)}</span>
              </div>
              <div>
                <span>Status: </span>
                <span className={`font-bold ${isCancelled ? "text-red-400" : "text-emerald-400"}`}>
                  {booking.status}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code & Barcode Area (Right 5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-100 border border-white/5 text-center">
            {booking.tickets && booking.tickets.length > 0 && booking.tickets[0].qrCodeData ? (
              <div className="p-3 bg-white rounded-2xl shadow-xl mb-3">
                <img
                  src={booking.tickets[0].qrCodeData}
                  alt="Ticket QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>
            ) : (
              <div className="w-40 h-40 rounded-2xl bg-white/10 flex items-center justify-center mb-3 text-slate-500">
                <QrCode className="w-16 h-16" />
              </div>
            )}

            <div className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              {booking.bookingReference}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Scan at usher turnstile
            </div>
          </div>
        </div>

        {/* Cancellation Section */}
        {!isCancelled && (
          <div className="p-6 bg-surface-300 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Eligible for free cancellation up to 2 hours before showtime.
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
            >
              {cancelling ? "Processing Refund..." : "Cancel Booking & Refund"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
