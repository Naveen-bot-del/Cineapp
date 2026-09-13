import React from "react";
import Link from "next/link";
import { DataService } from "@/lib/data-service";
import { MapPin, Phone, Sparkles, ChevronRight, Film } from "lucide-react";

export default async function CinemasPage() {
  const cinemas = await DataService.getCinemas();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <MapPin className="w-8 h-8 text-brand-500" />
          CineBook Locations
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Discover cutting-edge theaters featuring IMAX Laser 70mm, Dolby Cinema, VIP Dine-in lounges, and plush recliner seating.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cinemas.map((cinema) => (
          <div
            key={cinema.id}
            className="group rounded-3xl overflow-hidden bg-surface-200 border border-white/5 hover:border-brand-500/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="relative h-52 w-full overflow-hidden">
                <img
                  src={cinema.imageUrl}
                  alt={cinema.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-200 via-transparent to-black/40" />
                <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-black/70 backdrop-blur-md text-white border border-white/10">
                  {cinema.city}
                </span>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors mb-2">
                  {cinema.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {cinema.address}
                </p>

                {cinema.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cinema.phone}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Theater Amenities
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cinema.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-100 text-slate-300 border border-white/5"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Link
                href={`/cinemas/${cinema.slug}`}
                className="w-full py-3 px-4 rounded-xl text-center text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-glow transition-all flex items-center justify-center gap-2"
              >
                <Film className="w-4 h-4" />
                View Showtimes & Screenings
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
