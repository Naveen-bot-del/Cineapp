import { db, getDbPool } from "./index";
import { users, movies, genres, movieGenres, cinemas, auditoriums, seats, showtimes, showtimeSeats } from "./schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Starting CineBook database seeding...");

  // 1. Clear existing test data if resetting
  try {
    const client = await getDbPool().connect();
    try {
      console.log("Cleaning up existing data...");
      await client.query(`
        TRUNCATE TABLE audit_logs, tickets, payments, booking_items, bookings, showtime_seats, showtimes, seats, auditoriums, movie_genres, genres, movies, users, cinemas CASCADE;
      `);
    } catch (e) {
      console.log("Truncate skipped or tables not yet created:", (e as Error).message);
    } finally {
      client.release();
    }
  } catch (err) {
    console.log("Direct connection info:", (err as Error).message);
  }

  // 2. Seed Users (Admin + Demo Customers)
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const userPassword = await bcrypt.hash("Password123!", 10);

  const [adminUser] = await db.insert(users).values({
    email: "admin@cinebook.com",
    name: "CineBook Administrator",
    passwordHash: adminPassword,
    role: "ADMIN",
    phone: "+1 (555) 019-2834",
  }).returning();

  const [demoUser] = await db.insert(users).values({
    email: "alex.turner@example.com",
    name: "Alex Turner",
    passwordHash: userPassword,
    role: "CUSTOMER",
    phone: "+1 (555) 012-7788",
  }).returning();

  console.log("✅ Seeded Users: admin@cinebook.com / alex.turner@example.com");

  // 3. Seed Genres
  const genresList = [
    { name: "Action", slug: "action" },
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Thriller", slug: "thriller" },
    { name: "Drama", slug: "drama" },
    { name: "Comedy", slug: "comedy" },
    { name: "Adventure", slug: "adventure" },
    { name: "Animation", slug: "animation" },
    { name: "IMAX Experience", slug: "imax" },
  ];

  const seededGenres = await db.insert(genres).values(genresList).returning();
  const genreMap = new Map(seededGenres.map((g) => [g.slug, g.id]));

  // 4. Seed Movies (including Runner with Alan Ritchson & Avengers: Doomsday)
  const moviesData = [
    {
      title: "Runner",
      slug: "runner",
      description: "Starring Alan Ritchson (Reacher), a high-octane action thriller following a former elite operative thrust into a 3-hour race against time across a lockdown city to neutralize a corrupt syndicate threatening millions.",
      posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMinutes: 124,
      rating: "R",
      language: "English",
      director: "Scott Waugh",
      cast: "Alan Ritchson, Alexandra Daddario, Karl Urban, Djimon Hounsou",
      releaseDate: new Date(),
      status: "NOW_SHOWING" as const,
      featured: 1,
      genreSlugs: ["action", "thriller"],
    },
    {
      title: "Avengers: Doomsday",
      slug: "avengers-doomsday",
      description: "Earth's mightiest heroes face an unprecedented cosmic extinction threat as Victor Von Doom emerges from the multiverse. An epic scale confrontation redefining the Marvel Cinematic Universe.",
      posterUrl: "/images/movies/avengers-doomsday.jpg",
      backdropUrl: "/images/movies/avengers-doomsday.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMinutes: 168,
      rating: "PG-13",
      language: "English",
      director: "Anthony & Joe Russo",
      cast: "Robert Downey Jr., Benedict Cumberbatch, Pedro Pascal, Florence Pugh, Anthony Mackie",
      releaseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // In 2 months
      status: "COMING_SOON" as const,
      featured: 1,
      genreSlugs: ["action", "sci-fi", "adventure"],
    },
    {
      title: "Dune: Part Two",
      slug: "dune-part-two",
      description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between love and the fate of the universe.",
      posterUrl: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b4q.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMinutes: 166,
      rating: "PG-13",
      language: "English (Dolby Atmos)",
      director: "Denis Villeneuve",
      cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem, Austin Butler",
      releaseDate: new Date(),
      status: "NOW_SHOWING" as const,
      featured: 1,
      genreSlugs: ["sci-fi", "adventure", "drama", "imax"],
    },
    {
      title: "Oppenheimer",
      slug: "oppenheimer",
      description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project.",
      posterUrl: "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/fm6K9vYQ7jSS2Zq09bm9o9Wuj8n.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMinutes: 180,
      rating: "R",
      language: "English",
      director: "Christopher Nolan",
      cast: "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr., Florence Pugh",
      releaseDate: new Date(),
      status: "NOW_SHOWING" as const,
      featured: 0,
      genreSlugs: ["drama", "thriller", "imax"],
    },
    {
      title: "Gladiator II",
      slug: "gladiator-ii",
      description: "Years after witnessing the death of Maximus, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist.",
      posterUrl: "https://image.tmdb.org/t/p/w780/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/euYI6ub299v5qW297x69m7EiY8P.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMinutes: 148,
      rating: "R",
      language: "English",
      director: "Ridley Scott",
      cast: "Paul Mescal, Pedro Pascal, Denzel Washington, Connie Nielsen",
      releaseDate: new Date(),
      status: "NOW_SHOWING" as const,
      featured: 0,
      genreSlugs: ["action", "drama", "adventure"],
    },
    {
      title: "Deadpool & Wolverine",
      slug: "deadpool-and-wolverine",
      description: "A listless Wade Wilson toils away in civilian life until a threat to his home world sends him reluctantly teaming up with an even more reluctant Wolverine.",
      posterUrl: "https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/yDHYTfa29tVe4HQDI5QCILvaZ2b.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMinutes: 128,
      rating: "R",
      language: "English",
      director: "Shawn Levy",
      cast: "Ryan Reynolds, Hugh Jackman, Emma Corrin, Matthew Macfadyen",
      releaseDate: new Date(),
      status: "NOW_SHOWING" as const,
      featured: 0,
      genreSlugs: ["action", "comedy", "sci-fi"],
    },
    {
      title: "Spider-Man: Beyond the Spider-Verse",
      slug: "spider-man-beyond-the-spider-verse",
      description: "Miles Morales journeys across the multiverse to battle the Spot and save every universe from catastrophic collapse.",
      posterUrl: "https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMinutes: 140,
      rating: "PG",
      language: "English",
      director: "Joaquim Dos Santos, Kemp Powers",
      cast: "Shameik Moore, Hailee Steinfeld, Oscar Isaac, Daniel Kaluuya",
      releaseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "COMING_SOON" as const,
      featured: 0,
      genreSlugs: ["animation", "action", "sci-fi"],
    },
    {
      title: "Interstellar",
      slug: "interstellar",
      description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
      posterUrl: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/rAiYTsqAl3KP8AWkX1eG1Ugr0Xm.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMinutes: 169,
      rating: "PG-13",
      language: "English (IMAX 70mm)",
      director: "Christopher Nolan",
      cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine",
      releaseDate: new Date(),
      status: "NOW_SHOWING" as const,
      featured: 0,
      genreSlugs: ["sci-fi", "drama", "imax"],
    },
  ];

  const seededMovies: any[] = [];
  for (const m of moviesData) {
    const { genreSlugs, ...movieFields } = m;
    const [inserted] = await db.insert(movies).values(movieFields).returning();
    seededMovies.push(inserted);

    for (const slug of genreSlugs) {
      const gId = genreMap.get(slug);
      if (gId) {
        await db.insert(movieGenres).values({
          movieId: inserted.id,
          genreId: gId,
        }).onConflictDoNothing();
      }
    }
  }

  console.log(`✅ Seeded ${seededMovies.length} Movies (including Runner & Avengers: Doomsday)`);

  // 5. Seed Cinemas
  const cinemasData = [
    {
      name: "CineBook Grand IMAX Cinema",
      slug: "cinebook-grand-imax",
      city: "New York",
      address: "1540 Broadway, Times Square, New York, NY 10036",
      postalCode: "10036",
      phone: "+1 (212) 555-0100",
      imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
      amenities: JSON.stringify(["IMAX Laser 70mm", "Dolby Atmos", "VIP Dine-In Loungers", "Bar & Lounge", "Valet Parking"]),
    },
    {
      name: "Starlight Luxury Cineplex",
      slug: "starlight-luxury-cineplex",
      city: "Los Angeles",
      address: "6801 Hollywood Blvd, Hollywood, CA 90028",
      postalCode: "90028",
      phone: "+1 (323) 555-0144",
      imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
      amenities: JSON.stringify(["4DX Motion Seats", "Dolby Cinema", "Heated Recliners", "Artisan Concessions"]),
    },
    {
      name: "Neo Tokyo Dolby Theater",
      slug: "neo-tokyo-dolby-theater",
      city: "San Francisco",
      address: "1000 Van Ness Ave, San Francisco, CA 94109",
      postalCode: "94109",
      phone: "+1 (415) 555-0188",
      imageUrl: "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=1200&q=80",
      amenities: JSON.stringify(["Dolby Atmos Sound", "Laser Projection", "Couple Sofas", "Cocktail Lounge"]),
    },
  ];

  const seededCinemas = await db.insert(cinemas).values(cinemasData).returning();
  console.log(`✅ Seeded ${seededCinemas.length} Cinemas`);

  // 6. Seed Auditoriums & Seats for each cinema
  for (const cinema of seededCinemas) {
    const screens = [
      { name: "Screen 1 - IMAX Laser", type: "IMAX_3D" as const, rows: 6, cols: 10 },
      { name: "Screen 2 - Dolby Atmos", type: "DOLBY_ATMOS" as const, rows: 5, cols: 8 },
      { name: "Screen 3 - VIP Luxe", type: "VIP_LOUNGE" as const, rows: 4, cols: 6 },
    ];

    for (const screen of screens) {
      const [auditorium] = await db.insert(auditoriums).values({
        cinemaId: cinema.id,
        name: screen.name,
        screenType: screen.type,
        totalSeats: screen.rows * screen.cols,
        rowsCount: screen.rows,
        colsCount: screen.cols,
      }).returning();

      // Generate Seats
      const rowLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const seatInserts = [];

      for (let r = 0; r < screen.rows; r++) {
        const rowLabel = rowLetters[r];
        for (let c = 1; c <= screen.cols; c++) {
          let seatType: "STANDARD" | "VIP" | "COUPLE" | "WHEELCHAIR" = "STANDARD";
          let priceMultiplier = 100; // 1.0x

          if (r === screen.rows - 1) {
            seatType = "COUPLE";
            priceMultiplier = 160; // 1.6x
          } else if (r >= screen.rows - 3) {
            seatType = "VIP";
            priceMultiplier = 135; // 1.35x
          } else if (r === 0 && (c === 1 || c === screen.cols)) {
            seatType = "WHEELCHAIR";
            priceMultiplier = 100;
          }

          seatInserts.push({
            auditoriumId: auditorium.id,
            rowLabel,
            seatNumber: c,
            seatType,
            priceMultiplier,
            gridRow: r + 1,
            gridCol: c,
          });
        }
      }

      const createdSeats = await db.insert(seats).values(seatInserts).returning();

      // 7. Seed Showtimes for Now Showing movies
      const nowShowingMovies = seededMovies.filter((m) => m.status === "NOW_SHOWING");
      const times = [
        { hour: 13, minute: 0, price: 1499, format: "2D" },
        { hour: 16, minute: 30, price: 1799, format: "3D" },
        { hour: 19, minute: 45, price: 2199, format: "IMAX 3D" },
        { hour: 22, minute: 30, price: 1899, format: "Dolby Atmos" },
      ];

      // Create showtimes for Today, Tomorrow, Day after Tomorrow
      for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
        for (let i = 0; i < nowShowingMovies.length; i++) {
          const movie = nowShowingMovies[i];
          const timeSlot = times[(i + dayOffset) % times.length];

          const startTime = new Date();
          startTime.setDate(startTime.getDate() + dayOffset);
          startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

          const endTime = new Date(startTime.getTime() + movie.durationMinutes * 60000);

          const [showtime] = await db.insert(showtimes).values({
            movieId: movie.id,
            auditoriumId: auditorium.id,
            startTime,
            endTime,
            basePriceCents: timeSlot.price,
            format: timeSlot.format,
          }).returning();

          // Initialize Showtime Seats
          const showtimeSeatInserts = createdSeats.map((seat) => ({
            showtimeId: showtime.id,
            seatId: seat.id,
            status: "AVAILABLE" as const,
            version: 1,
          }));

          await db.insert(showtimeSeats).values(showtimeSeatInserts);
        }
      }
    }
  }

  console.log("🎉 Database seeding completed successfully!");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
