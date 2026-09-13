import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataService } from "@/lib/data-service";
import { formatCents, formatTime } from "@/lib/utils";
import { MapPin, Phone, Film, Ticket, ChevronLeft, Sparkles } from "lucide-react";

interface CinemaSlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CinemaSchedulePage({ params }: CinemaSlugPageProps) {
  const { slug } = await params;
  const cinema = await DataService.getCinemaBySlug(slug);

  if (!cinema) {
    notFound();
  }

  const showtimes = await DataService.getShowtimesForCinema(cinema.id);
  const movies = await DataService.getMovies();

  // Group showtimes by movie
  const showtimesByMovie = new Map<string, typeof showtimes>();
  for (const st of showtimes) {
    if (!showtimesByMovie.has(st.movieId)) {
      showtimesByMovie.set(st.movieId, []);
    }
    showtimesByMovie.get(st.movieId)!.push(st);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/cinemas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Cinemas
        </Link>
      </div>

      {/* Cinema Header Card */}
      <div className="rounded-3xl bg-surface-200 border border-white/10 overflow-hidden shadow-2xl mb-12">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={cinema.imageUrl}
            alt={cinema.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-200 via-surface-200/50 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500 text-white shadow-glow mb-2 inline-block">
                {cinema.city}
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {cinema.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-400" />
                {cinema.address}
              </p>
            </div>
            {cinema.phone && (
              <div className="text-xs text-slate-300 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <Phone className="w-3.5 h-3.5 text-brand-400" />
                {cinema.phone}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
            Features:
          </span>
          {cinema.amenities.map((a) => (
            <span
              key={a}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-surface-100 text-slate-200 border border-white/5"
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Screenings Schedule */}
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-brand-500" />
            Today's Screenings & Showtimes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select a movie time slot to reserve your preferred seats.
          </p>
        </div>

        {Array.from(showtimesByMovie.entries()).map(([movieId, mShowtimes]) => {
          const movie = movies.find((m) => m.id === movieId);
          if (!movie) return null;

          return (
            <div
              key={movieId}
              className="rounded-2xl bg-surface-200 border border-white/5 p-6 flex flex-col md:flex-row gap-6 items-start shadow-lg"
            >
              {/* Poster Thumbnail */}
              <Link
                href={`/movies/${movie.slug}`}
                className="w-24 sm:w-32 flex-shrink-0 aspect-[2/3] rounded-xl overflow-hidden group border border-white/10"
              >
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </Link>

              {/* Showtimes Details */}
              <div className="flex-grow w-full">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white/10 text-white">
                    {movie.rating}
                  </span>
                  <span className="text-xs text-slate-400">{movie.durationMinutes} min</span>
                  <span className="text-xs text-slate-400">• {movie.genres.join(", ")}</span>
                </div>

                <Link
                  href={`/movies/${movie.slug}`}
                  className="text-lg font-bold text-white hover:text-brand-400 transition-colors"
                >
                  {movie.title}
                </Link>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2 mb-4">
                  {movie.description}
                </p>

                {/* Showtime Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {mShowtimes.map((st) => (
                    <Link
                      key={st.id}
                      href={`/booking/${st.id}`}
                      className="p-3 rounded-xl bg-surface-100 hover:bg-brand-500 border border-white/5 hover:border-brand-400 transition-all hover:scale-105 hover:shadow-glow text-center group"
                    >
                      <div className="text-xs font-black text-white group-hover:text-white">
                        {formatTime(st.startTime)}
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-white/80 mt-0.5">
                        {st.format} • {formatCents(st.basePriceCents)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
