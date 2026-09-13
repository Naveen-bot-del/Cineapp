"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCents, formatTime, formatDate } from "@/lib/utils";
import { BookingDetails } from "@/lib/data-service";
import { ShieldCheck, Clock, CreditCard, Lock, AlertTriangle, CheckCircle, Ticket, ChevronLeft } from "lucide-react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 mins default
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState("Alex Turner");
  const [customerEmail, setCustomerEmail] = useState("alex.turner@example.com");
  const [customerPhone, setCustomerPhone] = useState("+1 (555) 012-7788");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "APPLE_PAY">("CARD");

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/payments/create-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, customerEmail }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load booking details");
        } else {
          setBooking(data.booking);
          // Calculate remaining seconds
          const diffMs = new Date(data.booking.expiresAt).getTime() - Date.now();
          setSecondsRemaining(Math.max(0, Math.floor(diffMs / 1000)));
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to checkout service");
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [bookingId]);

  // Countdown timer effect
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (secondsRemaining <= 0) {
      setError("Your seat hold has expired. Please select your seats again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const idempotencyKey = `pay_${bookingId}_${Date.now()}`;
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentIntentId: `pi_test_${Date.now()}`,
          idempotencyKey,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Payment failed");
        setIsProcessing(false);
        return;
      }

      // Success -> Redirect to ticket pass
      router.push(`/tickets/${data.bookingReference}`);
    } catch (err: any) {
      setError(err.message || "Network error during payment confirmation");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Securing your reservation & payment intent...</span>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-surface-200 border border-white/10 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">Reservation Expired or Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">{error}</p>
        <Link
          href="/#movies"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold"
        >
          Select New Showtime
        </Link>
      </div>
    );
  }

  const isExpiringSoon = secondsRemaining < 120;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Top Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/#movies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Cancel & Return
        </Link>
      </div>

      {/* Expiration Timer Banner */}
      <div
        className={`p-4 rounded-2xl border mb-8 flex items-center justify-between transition-all ${
          secondsRemaining === 0
            ? "bg-red-500/20 border-red-500 text-red-300"
            : isExpiringSoon
            ? "bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse"
            : "bg-surface-200 border-white/10 text-slate-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <Clock className={`w-5 h-5 ${isExpiringSoon ? "text-amber-400" : "text-brand-500"}`} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">Seats Temporarily Locked</div>
            <div className="text-xs text-slate-400">
              {secondsRemaining === 0
                ? "Your 10-minute hold has expired. Seats may now be released."
                : "Complete your checkout before the hold timer expires to secure your seats."}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black font-mono">
            {formatTimer(secondsRemaining)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Payment & Contact Form (Left) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Contact Details */}
          <div className="p-6 rounded-2xl bg-surface-200 border border-white/5 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs">
                1
              </span>
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-6 rounded-2xl bg-surface-200 border border-white/5 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs">
                2
              </span>
              Payment Method
            </h2>

            {/* Test Mode Banner */}
            <div className="p-3.5 rounded-xl bg-cinema-gold/10 border border-cinema-gold/30 text-cinema-gold text-xs flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Stripe Test Mode Enabled:</strong> Real credit cards will NOT be charged. You can complete this test booking with 1-click.
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value="•••• •••• •••• 4242  (Stripe Test)"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-slate-300"
                  />
                  <CreditCard className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Expires</label>
                  <input
                    type="text"
                    disabled
                    value="12 / 28"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CVC</label>
                  <input
                    type="text"
                    disabled
                    value="••• (999)"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-slate-300"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing || secondsRemaining <= 0}
              onClick={handleConfirmPayment}
              className="mt-6 w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-glow hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying Payment & Issuing Tickets...
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay {formatCents(booking?.totalAmountCents || 0)} (Test Mode)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Order Summary (Right) */}
        {booking && (
          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl bg-surface-200 border border-white/10 shadow-2xl sticky top-24 space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/5 pb-3">
                Order Summary
              </h3>

              {/* Movie Brief */}
              <div className="flex gap-3">
                <img
                  src={booking.moviePoster}
                  alt={booking.movieTitle}
                  className="w-16 h-24 object-cover rounded-xl border border-white/10 shadow-md flex-shrink-0"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{booking.movieTitle}</h4>
                  <p className="text-xs text-slate-400 mt-1">{booking.cinemaName}</p>
                  <p className="text-xs text-slate-400">{booking.auditoriumName} • {booking.format}</p>
                  <p className="text-xs font-semibold text-cinema-gold mt-1.5">
                    {formatDate(booking.startTime)} at {formatTime(booking.startTime)}
                  </p>
                </div>
              </div>

              {/* Seats Breakdown */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reserved Seats ({booking.seats.length})
                </div>
                <div className="space-y-1.5">
                  {booking.seats.map((seat) => (
                    <div key={seat.seatId} className="flex justify-between text-xs text-slate-300">
                      <span>Seat {seat.seatLabel} ({seat.seatType})</span>
                      <span className="font-semibold text-white">{formatCents(seat.priceCents)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Math */}
              <div className="space-y-2 pt-3 border-t border-white/5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Ticket Subtotal</span>
                  <span className="text-slate-200">{formatCents(booking.subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Convenience & Booking Fee ($1.50/seat)</span>
                  <span className="text-slate-200">{formatCents(booking.serviceFeeCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8.875%)</span>
                  <span className="text-slate-200">{formatCents(booking.taxCents)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-sm font-bold text-white">Final Total</span>
                <span className="text-2xl font-black text-white">{formatCents(booking.totalAmountCents)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
