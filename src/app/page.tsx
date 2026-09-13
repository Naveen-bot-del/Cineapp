"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Search, Sparkles, MapPin, Play, Ticket, ChevronRight, Star, Clock, ShieldCheck, Flame } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { MovieItem, CinemaItem } from "@/lib/data-service";

export default function HomePage() {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [cinemas, setCinemas] = useState<CinemaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [activeTab, setActiveTab] = useState<"NOW_SHOWING" | "COMING_SOON">("NOW_SHOWING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  // Hero carousel active index
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [moviesRes, cinemasRes] = await Promise.all([
          fetch("/api/movies").then((r) => r.json()).catch(() => null),
          fetch("/api/cinemas").then((r) => r.json()).catch(() => null),
        ]);

        if (moviesRes?.movies && moviesRes.movies.length > 0) {
          setMovies(moviesRes.movies);
        } else {
          const { cineStore } = await import("@/lib/data-service");
          setMovies(cineStore.movies);
        }

        if (cinemasRes?.cinemas && cinemasRes.cinemas.length > 0) {
          setCinemas(cinemasRes.cinemas);
        } else {
          const { cineStore } = await import("@/lib/data-service");
          setCinemas(cineStore.cinemas);
        }
      } catch {
        const { cineStore } = await import("@/lib/data-service");
        setMovies(cineStore.movies);
        setCinemas(cineStore.cinemas);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featuredMovies = movies.filter((m) => m.featured === 1);
  const currentHeroMovie = featuredMovies[heroIndex] || movies[0];

  // Filter movies
  const filteredMovies = movies.filter((m) => {
    if (m.status !== activeTab) return false;
    if (selectedGenre !== "all" && !m.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())) {
      return false;
    }
    if (selectedLanguage !== "all" && !m.language.toLowerCase().includes(selectedLanguage.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.cast?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const genresList = ["all", "Action", "Sci-Fi", "Thriller", "Drama", "Comedy", "Adventure", "Animation", "IMAX"];
  const languagesList = ["all", "English", "Dolby Atmos", "IMAX 70mm"];

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Showcase Section */}
      {currentHeroMovie && (
        <section className="relative w-full min-h-[580px] lg:min-h-[640px] overflow-hidden flex items-center py-10">
          {/* Ambient Blurred Cinematic Backdrop */}
          <div className="absolute inset-0 -z-10">
            <img
              src={currentHeroMovie.backdropUrl}
              alt={currentHeroMovie.title}
              className="w-full h-full object-cover object-center filter brightness-[0.25] blur-md scale-110 transition-all duration-700"
            />
            {/* Ambient Dark Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Movie Info & CTAs (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-brand-500 text-white uppercase tracking-widest shadow-glow flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    {currentHeroMovie.status === "COMING_SOON" ? "Most Anticipated" : "Now in Theaters"}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-black bg-white/10 backdrop-blur-md text-white border border-white/10">
                    {currentHeroMovie.rating}
                  </span>
                  <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-cinema-gold" />
                    {currentHeroMovie.durationMinutes} min
                  </span>
                  <span className="text-xs text-slate-400">
                    • {currentHeroMovie.genres.join(", ")}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
                  {currentHeroMovie.title}
                </h1>

                {/* Description */}
                <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed max-w-2xl">
                  {currentHeroMovie.description}
                </p>

                {/* Cast */}
                {currentHeroMovie.cast && (
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-200 font-semibold">Starring: </span>
                    {currentHeroMovie.cast}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href={`/movies/${currentHeroMovie.slug}`}
                    className="px-8 py-3.5 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 text-white shadow-glow hover:shadow-brand-500/40 transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    {currentHeroMovie.status === "COMING_SOON" ? "View Details & Remind" : "Book Tickets"}
                  </Link>

                  {currentHeroMovie.trailerUrl && (
                    <a
                      href={currentHeroMovie.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 text-brand-400 fill-brand-400" />
                      Watch Trailer
                    </a>
                  )}
                </div>

                {/* Hero Carousel Navigation Thumbnails */}
                <div className="pt-6 flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                    Featured:
                  </span>
                  {featuredMovies.map((movie, idx) => (
                    <button
                      key={movie.id}
                      onClick={() => setHeroIndex(idx)}
                      className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-xl transition-all ${
                        heroIndex === idx
                          ? "bg-surface-100 border border-brand-500/60 shadow-glow"
                          : "bg-surface-200/60 border border-white/5 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-7 h-10 object-cover rounded-lg"
                      />
                      <div className="text-left">
                        <div className="text-xs font-bold text-white max-w-[100px] truncate">
                          {movie.title}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: High-Res Full Size Original Poster (5 cols) */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="relative group max-w-[340px] sm:max-w-[380px] w-full aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/15 bg-surface-200 transition-all duration-500 hover:scale-[1.02] hover:border-brand-500/50 hover:shadow-brand-500/20">
                  <img
                    src={currentHeroMovie.posterUrl}
                    alt={currentHeroMovie.title}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <Link
                      href={`/movies/${currentHeroMovie.slug}`}
                      className="w-full py-2.5 rounded-xl text-center text-xs font-bold bg-brand-500 text-white shadow-glow"
                    >
                      Explore Movie
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content: Movies & Filters */}
      <section id="movies" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header & Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2 bg-surface-200 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab("NOW_SHOWING")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "NOW_SHOWING"
                  ? "bg-brand-500 text-white shadow-glow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => setActiveTab("COMING_SOON")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "COMING_SOON"
                  ? "bg-cinema-gold text-black font-extrabold shadow-glow-gold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Coming Soon
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movie, actor, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-200 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-col gap-4 mb-10">
          {/* Genre Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 flex-shrink-0">
              Genre:
            </span>
            {genresList.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedGenre.toLowerCase() === genre.toLowerCase()
                    ? "bg-white text-black font-bold shadow-md"
                    : "bg-surface-200 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {genre === "all" ? "All Genres" : genre}
              </button>
            ))}
          </div>

          {/* Language Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 flex-shrink-0">
              Format / Lang:
            </span>
            {languagesList.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedLanguage.toLowerCase() === lang.toLowerCase()
                    ? "bg-cinema-neon/20 text-cinema-neon border border-cinema-neon/40 font-bold"
                    : "bg-surface-200 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {lang === "all" ? "All Formats" : lang}
              </button>
            ))}
          </div>
        </div>

        {/* Movie Grid */}
        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface-200/50 rounded-3xl border border-white/5 p-8">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No movies found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              We couldn't find any movie matching your search criteria. Try adjusting the filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("all");
                setSelectedLanguage("all");
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Featured Cinemas Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-6 h-6 text-brand-500" />
              Featured CineBook Theaters
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Immerse yourself in IMAX 70mm Laser projection and Dolby Atmos sound stages.
            </p>
          </div>
          <Link
            href="/cinemas"
            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            All Locations <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="group rounded-2xl overflow-hidden bg-surface-200 border border-white/5 hover:border-brand-500/30 transition-all hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={cinema.imageUrl}
                  alt={cinema.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-200 via-transparent to-black/40" />
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                  {cinema.city}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-brand-400 transition-colors">
                  {cinema.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1 mb-4">{cinema.address}</p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {cinema.amenities.slice(0, 3).map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-300 border border-white/5"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/cinemas/${cinema.slug}`}
                  className="block w-full py-2.5 rounded-xl text-center text-xs font-bold bg-surface-100 hover:bg-white/10 text-white border border-white/10 transition-colors"
                >
                  View Showtimes & Screenings
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
