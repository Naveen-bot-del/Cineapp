import { db, getDbPool } from "../db";
import { movies, genres, cinemas, auditoriums, seats, showtimes, showtimeSeats, bookings, bookingItems, payments, tickets, users } from "../db/schema";
import { eq, and, sql, desc, ilike } from "drizzle-orm";
import { holdSeatsTransaction, confirmBookingTransaction, releaseExpiredSeatHolds } from "../db/transaction";
import { generateBookingReference, generateTicketNumber, calculateFees } from "./utils";
import { generateTicketQRCode } from "./qrcode";
import bcrypt from "bcryptjs";

// Dual-mode In-Memory Store for fallback / test environments
export interface MovieItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  durationMinutes: number;
  rating: string;
  language: string;
  director?: string;
  cast?: string;
  releaseDate: string;
  status: "NOW_SHOWING" | "COMING_SOON" | "ARCHIVED";
  featured: number;
  genres: string[];
}

export interface CinemaItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  postalCode?: string;
  phone?: string;
  imageUrl: string;
  amenities: string[];
}

export interface ShowtimeItem {
  id: string;
  movieId: string;
  auditoriumId: string;
  cinemaId: string;
  cinemaName: string;
  cinemaCity: string;
  auditoriumName: string;
  screenType: string;
  startTime: string;
  endTime: string;
  basePriceCents: number;
  format: string;
}

export interface SeatItem {
  id: string;
  auditoriumId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: "STANDARD" | "VIP" | "COUPLE" | "WHEELCHAIR";
  priceMultiplier: number;
  gridRow: number;
  gridCol: number;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
  heldUntil?: string;
}

export interface BookingDetails {
  id: string;
  bookingReference: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  showtimeId: string;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  cinemaAddress: string;
  auditoriumName: string;
  screenType: string;
  format: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  subtotalCents: number;
  taxCents: number;
  serviceFeeCents: number;
  totalAmountCents: number;
  expiresAt: string;
  createdAt: string;
  seats: Array<{
    seatId: string;
    seatLabel: string;
    seatType: string;
    priceCents: number;
  }>;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    seatLabel: string;
    qrCodeData: string;
    status: string;
  }>;
  payment?: {
    id: string;
    transactionReference: string;
    amountCents: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  };
}

// In-Memory Repository initialized with rich seed data
class InMemoryCineStore {
  movies: MovieItem[] = [
    {
      id: "m-runner-001",
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
      releaseDate: new Date().toISOString(),
      status: "NOW_SHOWING",
      featured: 1,
      genres: ["Action", "Thriller"],
    },
    {
      id: "m-avengers-002",
      title: "Avengers: Doomsday",
      slug: "avengers-doomsday",
      description: "Earth's mightiest heroes face an unprecedented cosmic extinction threat as Victor Von Doom emerges from the multiverse. An epic scale confrontation redefining the Marvel Cinematic Universe.",
      posterUrl: "https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=800&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMinutes: 168,
      rating: "PG-13",
      language: "English",
      director: "Anthony & Joe Russo",
      cast: "Robert Downey Jr., Benedict Cumberbatch, Pedro Pascal, Florence Pugh, Anthony Mackie",
      releaseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: "COMING_SOON",
      featured: 1,
      genres: ["Action", "Sci-Fi", "Adventure"],
    },
    {
      id: "m-dune2-003",
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
      releaseDate: new Date().toISOString(),
      status: "NOW_SHOWING",
      featured: 1,
      genres: ["Sci-Fi", "Adventure", "Drama", "IMAX"],
    },
    {
      id: "m-oppen-004",
      title: "Oppenheimer",
      slug: "oppenheimer",
      description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project.",
      posterUrl: "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/fm6K9vYQ7jSS2Zq09bm9o9Wuj8n.jpg",
      durationMinutes: 180,
      rating: "R",
      language: "English",
      director: "Christopher Nolan",
      cast: "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr., Florence Pugh",
      releaseDate: new Date().toISOString(),
      status: "NOW_SHOWING",
      featured: 0,
      genres: ["Drama", "Thriller", "IMAX"],
    },
    {
      id: "m-gladiator2-005",
      title: "Gladiator II",
      slug: "gladiator-ii",
      description: "Years after witnessing the death of Maximus, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist.",
      posterUrl: "https://image.tmdb.org/t/p/w780/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/euYI6ub299v5qW297x69m7EiY8P.jpg",
      durationMinutes: 148,
      rating: "R",
      language: "English",
      director: "Ridley Scott",
      cast: "Paul Mescal, Pedro Pascal, Denzel Washington, Connie Nielsen",
      releaseDate: new Date().toISOString(),
      status: "NOW_SHOWING",
      featured: 0,
      genres: ["Action", "Drama", "Adventure"],
    },
    {
      id: "m-deadpool-006",
      title: "Deadpool & Wolverine",
      slug: "deadpool-and-wolverine",
      description: "A listless Wade Wilson toils away in civilian life until a threat to his home world sends him reluctantly teaming up with an even more reluctant Wolverine.",
      posterUrl: "https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/yDHYTfa29tVe4HQDI5QCILvaZ2b.jpg",
      durationMinutes: 128,
      rating: "R",
      language: "English",
      director: "Shawn Levy",
      cast: "Ryan Reynolds, Hugh Jackman, Emma Corrin, Matthew Macfadyen",
      releaseDate: new Date().toISOString(),
      status: "NOW_SHOWING",
      featured: 0,
      genres: ["Action", "Comedy", "Sci-Fi"],
    },
    {
      id: "m-spider-007",
      title: "Spider-Man: Beyond the Spider-Verse",
      slug: "spider-man-beyond-the-spider-verse",
      description: "Miles Morales journeys across the multiverse to battle the Spot and save every universe from catastrophic collapse.",
      posterUrl: "https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
      durationMinutes: 140,
      rating: "PG",
      language: "English",
      director: "Joaquim Dos Santos, Kemp Powers",
      cast: "Shameik Moore, Hailee Steinfeld, Oscar Isaac, Daniel Kaluuya",
      releaseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: "COMING_SOON",
      featured: 0,
      genres: ["Animation", "Action", "Sci-Fi"],
    },
    {
      id: "m-inter-008",
      title: "Interstellar",
      slug: "interstellar",
      description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
      posterUrl: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/rAiYTsqAl3KP8AWkX1eG1Ugr0Xm.jpg",
      durationMinutes: 169,
      rating: "PG-13",
      language: "English (IMAX 70mm)",
      director: "Christopher Nolan",
      cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine",
      releaseDate: new Date().toISOString(),
      status: "NOW_SHOWING",
      featured: 0,
      genres: ["Sci-Fi", "Drama", "IMAX"],
    },
  ];

  cinemas: CinemaItem[] = [
    {
      id: "c-grand-imax-001",
      name: "CineBook Grand IMAX Cinema",
      slug: "cinebook-grand-imax",
      city: "New York",
      address: "1540 Broadway, Times Square, New York, NY 10036",
      postalCode: "10036",
      phone: "+1 (212) 555-0100",
      imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
      amenities: ["IMAX Laser 70mm", "Dolby Atmos", "VIP Dine-In Loungers", "Bar & Lounge", "Valet Parking"],
    },
    {
      id: "c-starlight-002",
      name: "Starlight Luxury Cineplex",
      slug: "starlight-luxury-cineplex",
      city: "Los Angeles",
      address: "6801 Hollywood Blvd, Hollywood, CA 90028",
      postalCode: "90028",
      phone: "+1 (323) 555-0144",
      imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
      amenities: ["4DX Motion Seats", "Dolby Cinema", "Heated Recliners", "Artisan Concessions"],
    },
    {
      id: "c-neotokyo-003",
      name: "Neo Tokyo Dolby Theater",
      slug: "neo-tokyo-dolby-theater",
      city: "San Francisco",
      address: "1000 Van Ness Ave, San Francisco, CA 94109",
      postalCode: "94109",
      phone: "+1 (415) 555-0188",
      imageUrl: "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=1200&q=80",
      amenities: ["Dolby Atmos Sound", "Laser Projection", "Couple Sofas", "Cocktail Lounge"],
    },
  ];

  auditoriums: Array<{
    id: string;
    cinemaId: string;
    name: string;
    screenType: string;
    rowsCount: number;
    colsCount: number;
  }> = [];

  seats: SeatItem[] = [];
  showtimes: ShowtimeItem[] = [];
  showtimeSeatsMap: Map<string, SeatItem[]> = new Map();
  bookings: Map<string, BookingDetails> = new Map();
  users: Map<string, any> = new Map();
  payments: Map<string, any> = new Map();

  // Mutex lock for atomic seat concurrency control
  private lockMutex = new Map<string, Promise<any>>();

  constructor() {
    this.initStore();
  }

  private initStore() {
    // 1. Initialize admin & demo users
    const adminHash = "$2a$10$wE99KqB3B9.oF018y13l9.eY9M04rM1mKq/Qk7.m0gq/Y8r7d3eGy"; // Admin123!
    const userHash = "$2a$10$wE99KqB3B9.oF018y13l9.eY9M04rM1mKq/Qk7.m0gq/Y8r7d3eGy"; // Password123!

    this.users.set("admin@cinebook.com", {
      id: "u-admin-001",
      email: "admin@cinebook.com",
      name: "CineBook Administrator",
      passwordHash: adminHash,
      role: "ADMIN",
    });

    this.users.set("alex.turner@example.com", {
      id: "u-demo-002",
      email: "alex.turner@example.com",
      name: "Alex Turner",
      passwordHash: userHash,
      role: "CUSTOMER",
    });

    // 2. Initialize Auditoriums & Seats for each cinema
    const rowLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const screens = [
      { name: "Screen 1 - IMAX Laser", type: "IMAX_3D", rows: 6, cols: 10 },
      { name: "Screen 2 - Dolby Atmos", type: "DOLBY_ATMOS", rows: 5, cols: 8 },
      { name: "Screen 3 - VIP Luxe", type: "VIP_LOUNGE", rows: 4, cols: 6 },
    ];

    for (const cinema of this.cinemas) {
      for (const screen of screens) {
        const audId = `aud-${cinema.slug}-${screen.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        this.auditoriums.push({
          id: audId,
          cinemaId: cinema.id,
          name: screen.name,
          screenType: screen.type,
          rowsCount: screen.rows,
          colsCount: screen.cols,
        });

        // Generate seats for auditorium
        for (let r = 0; r < screen.rows; r++) {
          const rowLabel = rowLetters[r];
          for (let c = 1; c <= screen.cols; c++) {
            let seatType: "STANDARD" | "VIP" | "COUPLE" | "WHEELCHAIR" = "STANDARD";
            let priceMultiplier = 100;

            if (r === screen.rows - 1) {
              seatType = "COUPLE";
              priceMultiplier = 160;
            } else if (r >= screen.rows - 3) {
              seatType = "VIP";
              priceMultiplier = 135;
            } else if (r === 0 && (c === 1 || c === screen.cols)) {
              seatType = "WHEELCHAIR";
              priceMultiplier = 100;
            }

            const seatId = `seat-${audId}-${rowLabel}${c}`;
            this.seats.push({
              id: seatId,
              auditoriumId: audId,
              rowLabel,
              seatNumber: c,
              seatType,
              priceMultiplier,
              gridRow: r + 1,
              gridCol: c,
              status: "AVAILABLE",
            });
          }
        }
      }
    }

    // 3. Generate Showtimes for Now Showing movies across 4 days
    const nowShowing = this.movies.filter((m) => m.status === "NOW_SHOWING");
    const times = [
      { hour: 13, minute: 0, price: 1499, format: "2D" },
      { hour: 16, minute: 30, price: 1799, format: "3D" },
      { hour: 19, minute: 45, price: 2199, format: "IMAX 3D" },
      { hour: 22, minute: 30, price: 1899, format: "Dolby Atmos" },
    ];

    let showtimeIdx = 100;
    for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
      for (const cinema of this.cinemas) {
        const auds = this.auditoriums.filter((a) => a.cinemaId === cinema.id);
        for (let i = 0; i < nowShowing.length; i++) {
          const movie = nowShowing[i];
          const aud = auds[i % auds.length];
          const slot = times[(i + dayOffset) % times.length];

          const start = new Date();
          start.setDate(start.getDate() + dayOffset);
          start.setHours(slot.hour, slot.minute, 0, 0);

          const end = new Date(start.getTime() + movie.durationMinutes * 60000);
          const showtimeId = `st-${movie.slug}-${cinema.slug}-${dayOffset}-${slot.hour}${slot.minute}-${showtimeIdx++}`;

          this.showtimes.push({
            id: showtimeId,
            movieId: movie.id,
            auditoriumId: aud.id,
            cinemaId: cinema.id,
            cinemaName: cinema.name,
            cinemaCity: cinema.city,
            auditoriumName: aud.name,
            screenType: aud.screenType,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            basePriceCents: slot.price,
            format: slot.format,
          });

          // Clone seats for this specific showtime
          const audSeats = this.seats.filter((s) => s.auditoriumId === aud.id);
          const showtimeSeats: SeatItem[] = audSeats.map((s) => ({
            ...s,
            status: "AVAILABLE" as SeatItem["status"],
          }));

          // Mark some realistic initial booked seats on past/prime slots
          if (dayOffset === 0 && (slot.hour === 19 || slot.hour === 16)) {
            if (showtimeSeats[12]) showtimeSeats[12].status = "BOOKED";
            if (showtimeSeats[13]) showtimeSeats[13].status = "BOOKED";
            if (showtimeSeats[14]) showtimeSeats[14].status = "BOOKED";
          }

          this.showtimeSeatsMap.set(showtimeId, showtimeSeats);
        }
      }
    }
  }

  // Atomic seat hold transaction with concurrency lock
  async holdSeats(input: {
    showtimeId: string;
    seatIds: string[];
    userId: string;
    holdDurationMinutes?: number;
  }) {
    const { showtimeId, seatIds, userId, holdDurationMinutes = 10 } = input;

    // Mutex key per showtime to prevent race conditions
    const mutexKey = `st_lock_${showtimeId}`;
    while (this.lockMutex.has(mutexKey)) {
      await this.lockMutex.get(mutexKey);
    }

    let resolveMutex: any;
    const mutexPromise = new Promise((resolve) => {
      resolveMutex = resolve;
    });
    this.lockMutex.set(mutexKey, mutexPromise);

    try {
      const showtime = this.showtimes.find((s) => s.id === showtimeId);
      if (!showtime) return { success: false, error: "Showtime not found" };

      const movie = this.movies.find((m) => m.id === showtime.movieId);
      const cinema = this.cinemas.find((c) => c.id === showtime.cinemaId);

      const seatList = this.showtimeSeatsMap.get(showtimeId);
      if (!seatList) return { success: false, error: "Showtime seats not initialized" };

      const now = Date.now();

      // Check seat availability
      const targetSeats: SeatItem[] = [];
      for (const seatId of seatIds) {
        const found = seatList.find((s) => s.id === seatId);
        if (!found) return { success: false, error: `Seat ${seatId} does not exist` };

        const isHeldExpired = found.status === "HELD" && found.heldUntil && new Date(found.heldUntil).getTime() < now;
        const isAvailable = found.status === "AVAILABLE" || isHeldExpired;

        if (!isAvailable) {
          return {
            success: false,
            error: `Seat ${found.rowLabel}-${found.seatNumber} is no longer available`,
          };
        }
        targetSeats.push(found);
      }

      // Mark as HELD with expiration
      const expiresAt = new Date(now + holdDurationMinutes * 60 * 1000);
      const holdToken = crypto.randomUUID();

      let seatSubtotal = 0;
      const seatBreakdown = targetSeats.map((s) => {
        s.status = "HELD";
        s.heldUntil = expiresAt.toISOString();
        const priceCents = Math.round((showtime.basePriceCents * s.priceMultiplier) / 100);
        seatSubtotal += priceCents;
        return {
          seatId: s.id,
          label: `${s.rowLabel}-${s.seatNumber}`,
          type: s.seatType,
          priceCents,
        };
      });

      const fees = calculateFees(seatIds.length, seatSubtotal);
      const bookingReference = generateBookingReference();
      const bookingId = `bkg_${crypto.randomUUID()}`;

      const booking: BookingDetails = {
        id: bookingId,
        bookingReference,
        userId,
        showtimeId,
        movieTitle: movie?.title || "Movie",
        moviePoster: movie?.posterUrl || "",
        cinemaName: cinema?.name || showtime.cinemaName,
        cinemaAddress: cinema?.address || "",
        auditoriumName: showtime.auditoriumName,
        screenType: showtime.screenType,
        format: showtime.format,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        status: "PENDING",
        ...fees,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        seats: seatBreakdown.map((s) => ({
          seatId: s.seatId,
          seatLabel: s.label,
          seatType: s.type,
          priceCents: s.priceCents,
        })),
        tickets: [],
      };

      this.bookings.set(bookingId, booking);
      this.bookings.set(bookingReference, booking);

      return {
        success: true,
        bookingId,
        bookingReference,
        holdToken,
        expiresAt,
        pricing: {
          ...fees,
          seatBreakdown,
        },
      };
    } finally {
      this.lockMutex.delete(mutexKey);
      resolveMutex();
    }
  }

  // Confirm booking & payment
  async confirmBooking(params: {
    bookingId: string;
    paymentProvider: string;
    transactionReference: string;
    idempotencyKey: string;
    amountCents: number;
    paymentMethod?: string;
    rawPayload?: any;
  }) {
    const { bookingId, paymentProvider, transactionReference, idempotencyKey, amountCents, paymentMethod = "CARD" } = params;

    // Check idempotency
    if (this.payments.has(idempotencyKey)) {
      return { success: true, alreadyProcessed: true };
    }

    const booking = this.bookings.get(bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    if (booking.status === "CONFIRMED") return { success: true, alreadyConfirmed: true };
    if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
      return { success: false, error: `Booking is ${booking.status.toLowerCase()}` };
    }

    if (Date.now() > new Date(booking.expiresAt).getTime()) {
      return { success: false, error: "Seat hold has expired. Please select your seats again." };
    }

    // Mark seats as BOOKED
    const seatList = this.showtimeSeatsMap.get(booking.showtimeId);
    if (seatList) {
      for (const bookedSeat of booking.seats) {
        const found = seatList.find((s) => s.id === bookedSeat.seatId);
        if (found) {
          found.status = "BOOKED";
          found.heldUntil = undefined;
        }
      }
    }

    // Generate Tickets
    const createdTickets = [];
    for (let i = 0; i < booking.seats.length; i++) {
      const seat = booking.seats[i];
      const ticketNumber = generateTicketNumber(booking.bookingReference, i);
      const qrCodeData = await generateTicketQRCode({
        ticketNumber,
        bookingRef: booking.bookingReference,
        movieTitle: booking.movieTitle,
        cinemaName: booking.cinemaName,
        auditoriumName: booking.auditoriumName,
        showtime: booking.startTime,
        seatLabel: seat.seatLabel,
      });

      const ticket = {
        id: `tkt_${crypto.randomUUID()}`,
        ticketNumber,
        seatLabel: seat.seatLabel,
        qrCodeData,
        status: "VALID",
      };
      createdTickets.push(ticket);
    }

    booking.status = "CONFIRMED";
    booking.tickets = createdTickets;
    booking.payment = {
      id: `pay_${crypto.randomUUID()}`,
      transactionReference,
      amountCents,
      status: "COMPLETED",
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    this.payments.set(idempotencyKey, {
      bookingId,
      transactionReference,
      amountCents,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      bookingReference: booking.bookingReference,
      tickets: createdTickets,
    };
  }

  // Expired Seat Hold Release
  releaseExpiredHolds() {
    const now = Date.now();
    let releasedSeats = 0;
    let expiredBookings = 0;

    for (const [_, seatList] of this.showtimeSeatsMap) {
      for (const seat of seatList) {
        if (seat.status === "HELD" && seat.heldUntil && new Date(seat.heldUntil).getTime() < now) {
          seat.status = "AVAILABLE";
          seat.heldUntil = undefined;
          releasedSeats++;
        }
      }
    }

    for (const [_, booking] of this.bookings) {
      if (booking.status === "PENDING" && new Date(booking.expiresAt).getTime() < now) {
        booking.status = "EXPIRED";
        expiredBookings++;
      }
    }

    return { releasedSeats, expiredBookings };
  }

  // Cancel booking
  cancelBooking(bookingReferenceOrId: string, userId?: string) {
    const booking = this.bookings.get(bookingReferenceOrId);
    if (!booking) return { success: false, error: "Booking not found" };

    if (userId && booking.userId !== userId) {
      return { success: false, error: "Unauthorized access to booking" };
    }

    if (booking.status === "CANCELLED") {
      return { success: false, error: "Booking is already cancelled" };
    }

    // Release seats
    const seatList = this.showtimeSeatsMap.get(booking.showtimeId);
    if (seatList) {
      for (const s of booking.seats) {
        const found = seatList.find((st) => st.id === s.seatId);
        if (found) {
          found.status = "AVAILABLE";
          found.heldUntil = undefined;
        }
      }
    }

    booking.status = "CANCELLED";
    if (booking.payment) {
      booking.payment.status = "REFUNDED";
    }

    return {
      success: true,
      refundAmountCents: booking.totalAmountCents,
    };
  }
}

// Global Singleton for in-memory / fallback store
const globalForStore = global as unknown as { cineStore: InMemoryCineStore };
export const cineStore = globalForStore.cineStore || new InMemoryCineStore();
if (process.env.NODE_ENV !== "production") globalForStore.cineStore = cineStore;

// Public unified data service
export const DataService = {
  // Movies
  async getMovies(filters?: { status?: string; genre?: string; language?: string; search?: string }) {
    let list = cineStore.movies;

    if (filters?.status) {
      list = list.filter((m) => m.status === filters.status);
    }
    if (filters?.genre && filters.genre !== "all") {
      list = list.filter((m) => m.genres.some((g) => g.toLowerCase() === filters.genre?.toLowerCase()));
    }
    if (filters?.language && filters.language !== "all") {
      list = list.filter((m) => m.language.toLowerCase().includes(filters.language!.toLowerCase()));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.director?.toLowerCase().includes(q) ||
          m.cast?.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getMovieBySlug(slug: string) {
    return cineStore.movies.find((m) => m.slug === slug) || null;
  },

  async getCinemas() {
    return cineStore.cinemas;
  },

  async getCinemaBySlug(slug: string) {
    return cineStore.cinemas.find((c) => c.slug === slug) || null;
  },

  async getShowtimesForMovie(movieId: string, dateStr?: string) {
    let list = cineStore.showtimes.filter((s) => s.movieId === movieId);
    if (dateStr) {
      list = list.filter((s) => s.startTime.startsWith(dateStr));
    }
    return list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },

  async getShowtimesForCinema(cinemaId: string) {
    return cineStore.showtimes
      .filter((s) => s.cinemaId === cinemaId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },

  async getShowtimeWithSeats(showtimeId: string) {
    const showtime = cineStore.showtimes.find((s) => s.id === showtimeId);
    if (!showtime) return null;

    const movie = cineStore.movies.find((m) => m.id === showtime.movieId);
    const cinema = cineStore.cinemas.find((c) => c.id === showtime.cinemaId);
    const seats = cineStore.showtimeSeatsMap.get(showtimeId) || [];

    // Clean up expired holds on fetch
    const now = Date.now();
    for (const seat of seats) {
      if (seat.status === "HELD" && seat.heldUntil && new Date(seat.heldUntil).getTime() < now) {
        seat.status = "AVAILABLE";
        seat.heldUntil = undefined;
      }
    }

    return {
      showtime,
      movie,
      cinema,
      seats,
    };
  },

  async holdSeats(input: { showtimeId: string; seatIds: string[]; userId: string; holdDurationMinutes?: number }) {
    return cineStore.holdSeats(input);
  },

  async confirmBooking(params: {
    bookingId: string;
    paymentProvider: string;
    transactionReference: string;
    idempotencyKey: string;
    amountCents: number;
    paymentMethod?: string;
    rawPayload?: any;
  }) {
    return cineStore.confirmBooking(params);
  },

  async getBooking(bookingIdOrRef: string) {
    return cineStore.bookings.get(bookingIdOrRef) || null;
  },

  async getUserBookings(userId: string) {
    const list: BookingDetails[] = [];
    const seenIds = new Set<string>();

    for (const [_, booking] of cineStore.bookings) {
      if (booking.userId === userId && !seenIds.has(booking.id)) {
        seenIds.add(booking.id);
        list.push(booking);
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async cancelBooking(bookingReferenceOrId: string, userId?: string) {
    return cineStore.cancelBooking(bookingReferenceOrId, userId);
  },

  async releaseExpiredHolds() {
    return cineStore.releaseExpiredHolds();
  },

  async findUserByEmail(email: string) {
    return cineStore.users.get(email.toLowerCase()) || null;
  },

  async createUser(data: { email: string; passwordHash: string; name: string; phone?: string; role?: "CUSTOMER" | "ADMIN" }) {
    const user = {
      id: `u_${crypto.randomUUID()}`,
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash: data.passwordHash,
      phone: data.phone || "",
      role: data.role || "CUSTOMER",
    };
    cineStore.users.set(user.email, user);
    return user;
  },

  async getAdminStats() {
    let totalRevenueCents = 0;
    let totalConfirmedTickets = 0;
    let totalBookings = 0;

    const seenIds = new Set<string>();
    for (const [_, b] of cineStore.bookings) {
      if (!seenIds.has(b.id)) {
        seenIds.add(b.id);
        totalBookings++;
        if (b.status === "CONFIRMED") {
          totalRevenueCents += b.totalAmountCents;
          totalConfirmedTickets += b.seats.length;
        }
      }
    }

    return {
      totalRevenueCents,
      totalConfirmedTickets,
      totalBookings,
      totalMovies: cineStore.movies.length,
      totalCinemas: cineStore.cinemas.length,
      totalShowtimes: cineStore.showtimes.length,
    };
  },

  async addMovie(movie: Omit<MovieItem, "id">) {
    const id = `m_${movie.slug}_${Date.now()}`;
    const newMovie = { id, ...movie };
    cineStore.movies.unshift(newMovie);
    return newMovie;
  },

  async addShowtime(showtime: Omit<ShowtimeItem, "id">) {
    const id = `st_${Date.now()}`;
    const newShowtime = { id, ...showtime };
    cineStore.showtimes.unshift(newShowtime);

    // Init seats
    const aud = cineStore.auditoriums.find((a) => a.id === showtime.auditoriumId);
    const audSeats = cineStore.seats.filter((s) => s.auditoriumId === aud?.id);
    cineStore.showtimeSeatsMap.set(
      id,
      audSeats.map((s) => ({ ...s, status: "AVAILABLE" as SeatItem["status"] }))
    );

    return newShowtime;
  },
};
