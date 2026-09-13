import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataService } from "@/lib/data-service";
import { formatCents, formatTime, formatDate } from "@/lib/utils";
import { Clock, Star, Play, MapPin, Ticket, ShieldCheck, Film, Calendar, ChevronLeft } from "lucide-react";

interface MoviePageProps {
  params: Promise<{ slug: string }>;
}

export default async function MovieDetailsPage({ params }: MoviePageProps) {
  const { slug } = await params;
  const movie = await DataService.getMovieBySlug(slug);

  if (!movie) {
    notFound();
  }

  const showtimes = await DataService.getShowtimesForMovie(movie.id);
  const cinemas = await DataService.getCinemas();

  // Group showtimes by cinema
  const showtimesByCinema = new Map<string, typeof showtimes>();
  for (const st of showtimes) {
    if (!showtimesByCinema.has(st.cinemaId)) {
      showtimesByCinema.set(st.cinemaId, []);
    }
    showtimesByCinema.get(st.cinemaId)!.push(st);
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top Breadcrumb & Return Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Link
          href="/#movies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Movies
        </Link>
      </div>

      {/* Hero Backdrop & Details Header */}
      <section className="relative w-full overflow-hidden border-b border-white/5 pb-12">
        {/* Ambient Backdrop */}
        <div className="absolute inset-0 h-[450px] overflow-hidden -z-10">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover filter brightness-[0.35] blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster Frame */}
            <div className="w-48 sm:w-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-black bg-black/70 backdrop-blur-md text-white border border-white/10">
                {movie.rating}
              </div>
            </div>

            {/* Movie Info */}
            <div className="flex-grow space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500 text-white shadow-glow">
                  {movie.status === "NOW_SHOWING" ? "Now Showing" : "Coming Soon"}
                </span>
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/5"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-brand-400" />
                  {movie.durationMinutes} Minutes
                </span>
                <span>•</span>
                <span>{movie.language}</span>
                <span>•</span>
                <span>Released: {formatDate(movie.releaseDate)}</span>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {movie.description}
              </p>

              {/* Cast & Director */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs border-t border-white/10">
                {movie.director && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Director</span>
                    <span className="text-white font-semibold">{movie.director}</span>
                  </div>
                )}
                {movie.cast && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Key Cast</span>
                    <span className="text-white font-semibold">{movie.cast}</span>
                  </div>
                )}
              </div>

              {/* Trailer Action */}
              {movie.trailerUrl && (
                <div className="pt-2">
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-brand-400 fill-brand-400" />
                    Watch Official Trailer
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Showtimes & Booking Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-brand-500" />
            Select Cinema & Showtime
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose your preferred theater and time slot to view the interactive seat map.
          </p>
        </div>

        {movie.status === "COMING_SOON" ? (
          <div className="p-8 rounded-2xl bg-surface-200 border border-white/5 text-center max-w-xl mx-auto">
            <Calendar className="w-12 h-12 text-cinema-gold mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Advance Tickets Coming Soon</h3>
            <p className="text-xs text-slate-400 mb-4">
              Showtimes for {movie.title} will open closer to the premiere date on {formatDate(movie.releaseDate)}.
            </p>
            <Link
              href="/#movies"
              className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Browse Now Showing Movies
            </Link>
          </div>
        ) : showtimes.length > 0 ? (
          <div className="space-y-8">
            {Array.from(showtimesByCinema.entries()).map(([cinemaId, cShowtimes]) => {
              const cinema = cinemas.find((c) => c.id === cinemaId);
              return (
                <div
                  key={cinemaId}
                  className="rounded-2xl bg-surface-200 border border-white/5 overflow-hidden p-6 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-white/5">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-500" />
                        {cinema?.name || "Cinema"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{cinema?.address}</p>
                    </div>
                    <div className="text-xs text-slate-400">
                      {cShowtimes.length} showtimes available
                    </div>
                  </div>

                  {/* Showtimes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {cShowtimes.map((st) => (
                      <Link
                        key={st.id}
                        href={`/booking/${st.id}`}
                        className="group p-3.5 rounded-xl bg-surface-100 hover:bg-brand-500 border border-white/5 hover:border-brand-400 transition-all hover:scale-105 hover:shadow-glow flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-black text-white group-hover:text-white">
                            {formatTime(st.startTime)}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 group-hover:bg-white/20 group-hover:text-white">
                            {st.format}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 group-hover:text-white/80 line-clamp-1 mb-2">
                          {st.auditoriumName}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 group-hover:border-white/20">
                          <span className="text-slate-400 group-hover:text-white/80 text-[10px]">From</span>
                          <span className="font-bold text-cinema-gold group-hover:text-white">
                            {formatCents(st.basePriceCents)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-surface-200 border border-white/5 text-center">
            <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No showtimes currently scheduled</h3>
            <p className="text-xs text-slate-400">Check back shortly as new showtimes are populated daily.</p>
          </div>
        )}
      </section>
    </div>
  );
}
