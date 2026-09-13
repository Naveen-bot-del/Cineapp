import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function generateBookingReference(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "CB-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateTicketNumber(bookingRef: string, index: number): string {
  const idx = String(index + 1).padStart(2, "0");
  return `TKT-${bookingRef}-${idx}`;
}

export function calculateFees(seatsCount: number, seatSubtotalCents: number) {
  const serviceFeePerSeat = 150; // $1.50 per seat
  const serviceFeeCents = seatsCount * serviceFeePerSeat;
  const taxRate = 0.08875; // ~8.875% sales tax
  const taxCents = Math.round((seatSubtotalCents + serviceFeeCents) * taxRate);
  const totalAmountCents = seatSubtotalCents + serviceFeeCents + taxCents;

  return {
    subtotalCents: seatSubtotalCents,
    serviceFeeCents,
    taxCents,
    totalAmountCents,
  };
}
