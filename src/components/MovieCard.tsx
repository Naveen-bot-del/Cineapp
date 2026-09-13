import React from "react";
import Link from "next/link";
import { Clock, Star, Sparkles, Film, Ticket } from "lucide-react";
import { MovieItem } from "@/lib/data-service";

export function MovieCard({ movie }: { movie: MovieItem }) {
  const isComingSoon = movie.status === "COMING_SOON";

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-surface-200 border border-white/5 transition-all duration-300 hover:-translate-y-2 hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-500/10 flex flex-col h-full">
      {/* Poster Media with aspect-ratio 2:3 */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-100">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-200 via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-md text-xs font-black bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-lg">
            {movie.rating}
          </span>
          {movie.featured === 1 && (
            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-brand-500 text-white uppercase tracking-wider shadow-glow">
              Featured
            </span>
          )}
        </div>

        {/* Status Badge */}
        {isComingSoon && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cinema-gold/90 text-black shadow-lg">
              Coming Soon
            </span>
          </div>
        )}

        {/* Formats Tags Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          {movie.genres.slice(0, 2).map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-black/70 backdrop-blur-md text-slate-200 border border-white/10"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
            {movie.title}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {movie.durationMinutes} min
            </span>
            <span>•</span>
            <span className="truncate">{movie.language}</span>
          </div>

          <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {movie.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2">
          {isComingSoon ? (
            <Link
              href={`/movies/${movie.slug}`}
              className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold bg-surface-100 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
            >
              View Synopsis & Trailer
            </Link>
          ) : (
            <Link
              href={`/movies/${movie.slug}`}
              className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-glow hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
            >
              <Ticket className="w-4 h-4" />
              Book Tickets
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
