"use client";

import React, { useState } from "react";
import { SeatItem } from "@/lib/data-service";
import { formatCents, calculateFees } from "@/lib/utils";
import { Armchair, Sparkles, Check, AlertCircle, Heart, Accessibility } from "lucide-react";

interface SeatMapProps {
  seats: SeatItem[];
  basePriceCents: number;
  onHoldSeats: (selectedSeatIds: string[]) => void;
  isSubmitting?: boolean;
}

export function SeatMap({ seats, basePriceCents, onHoldSeats, isSubmitting = false }: SeatMapProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Group seats by row
  const rowsMap = new Map<string, SeatItem[]>();
  for (const seat of seats) {
    if (!rowsMap.has(seat.rowLabel)) {
      rowsMap.set(seat.rowLabel, []);
    }
    rowsMap.get(seat.rowLabel)!.push(seat);
  }

  // Sort seats in each row by seat number
  for (const [_, rowSeats] of rowsMap) {
    rowSeats.sort((a, b) => a.seatNumber - b.seatNumber);
  }

  const sortedRows = Array.from(rowsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const toggleSeat = (seat: SeatItem) => {
    setErrorMessage(null);

    if (seat.status === "BOOKED") {
      setErrorMessage(`Seat ${seat.rowLabel}${seat.seatNumber} is already reserved.`);
      return;
    }

    if (seat.status === "HELD") {
      setErrorMessage(`Seat ${seat.rowLabel}${seat.seatNumber} is currently on hold by another customer.`);
      return;
    }

    if (selectedIds.includes(seat.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== seat.id));
    } else {
      if (selectedIds.length >= 8) {
        setErrorMessage("Maximum 8 seats per booking session.");
        return;
      }
      setSelectedIds([...selectedIds, seat.id]);
    }
  };

  // Selected seats breakdown
  const selectedSeats = seats.filter((s) => selectedIds.includes(s.id));
  let subtotal = 0;
  for (const s of selectedSeats) {
    subtotal += Math.round((basePriceCents * s.priceMultiplier) / 100);
  }
  const feeDetails = calculateFees(selectedSeats.length, subtotal);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Curved Screen Banner */}
      <div className="w-full max-w-2xl mb-12 flex flex-col items-center">
        <div className="w-full cinema-screen mb-3" />
        <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
          Curved Cinema Screen
        </span>
      </div>

      {/* Seat Map Grid */}
      <div className="overflow-x-auto w-full max-w-4xl py-4 px-2 flex justify-center">
        <div className="flex flex-col gap-3 min-w-[340px]">
          {sortedRows.map(([rowLabel, rowSeats]) => (
            <div key={rowLabel} className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Row Label Left */}
              <span className="w-6 text-center text-xs font-bold text-slate-500">
                {rowLabel}
              </span>

              {/* Seats in Row */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {rowSeats.map((seat, index) => {
                  const isSelected = selectedIds.includes(seat.id);
                  const isAvailable = seat.status === "AVAILABLE";
                  const isHeld = seat.status === "HELD";
                  const isBooked = seat.status === "BOOKED";
                  const price = Math.round((basePriceCents * seat.priceMultiplier) / 100);

                  // Add aisle gap in middle
                  const isAisle = index === Math.floor(rowSeats.length / 2) - 1;

                  return (
                    <React.Fragment key={seat.id}>
                      <button
                        type="button"
                        disabled={isBooked || isHeld}
                        onClick={() => toggleSeat(seat)}
                        title={`Seat ${seat.rowLabel}${seat.seatNumber} (${seat.seatType}) - ${formatCents(price)}`}
                        className={`group relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-200 ${
                          isSelected
                            ? "bg-brand-500 text-white shadow-glow scale-110 ring-2 ring-white/50 z-10"
                            : isBooked
                            ? "bg-surface-100/50 text-slate-600 cursor-not-allowed border border-white/5"
                            : isHeld
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 cursor-not-allowed"
                            : seat.seatType === "COUPLE"
                            ? "bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/60 hover:border-rose-400"
                            : seat.seatType === "VIP"
                            ? "bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/60 hover:border-amber-400"
                            : seat.seatType === "WHEELCHAIR"
                            ? "bg-sky-950/40 text-sky-300 border border-sky-500/30 hover:bg-sky-900/60 hover:border-sky-400"
                            : "bg-surface-100 text-slate-300 border border-white/10 hover:bg-white/15 hover:border-white/30"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : seat.seatType === "COUPLE" ? (
                          <Heart className="w-3 h-3" />
                        ) : seat.seatType === "WHEELCHAIR" ? (
                          <Accessibility className="w-3 h-3" />
                        ) : (
                          seat.seatNumber
                        )}
                      </button>

                      {isAisle && <div className="w-3 sm:w-6" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <span className="w-6 text-center text-xs font-bold text-slate-500">
                {rowLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mt-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Seat Map Legend */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 bg-surface-200/60 border border-white/5 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface-100 border border-white/10" />
          <span>Standard ({formatCents(basePriceCents)})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-950/40 border border-amber-500/30 text-amber-400 flex items-center justify-center text-[10px] font-bold">
            V
          </div>
          <span>VIP Lounger ({formatCents(Math.round(basePriceCents * 1.35))})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-950/40 border border-rose-500/30 text-rose-400 flex items-center justify-center text-[10px]">
            <Heart className="w-2.5 h-2.5" />
          </div>
          <span>Couple Sofa ({formatCents(Math.round(basePriceCents * 1.6))})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-brand-500 shadow-glow" />
          <span className="text-white font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface-100/50 border border-white/5 opacity-40" />
          <span>Sold Out</span>
        </div>
      </div>

      {/* Real-time Order Summary & Proceed Bar */}
      <div className="w-full mt-8 p-6 rounded-2xl bg-surface-200/90 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full md:w-auto">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
            Selected Seats ({selectedSeats.length})
          </div>
          {selectedSeats.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedSeats.map((s) => (
                <span
                  key={s.id}
                  className="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold"
                >
                  {s.rowLabel}{s.seatNumber} ({s.seatType})
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">
              Please click on the seats you wish to reserve
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="text-xs text-slate-400">Total (incl. tax & fees)</div>
            <div className="text-2xl font-black text-white">
              {formatCents(selectedSeats.length > 0 ? feeDetails.totalAmountCents : 0)}
            </div>
          </div>

          <button
            type="button"
            disabled={selectedSeats.length === 0 || isSubmitting}
            onClick={() => onHoldSeats(selectedIds)}
            className="py-3 px-6 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-glow transition-all hover:scale-105 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Reserving...
              </span>
            ) : (
              <span>Proceed to Checkout</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
