import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums as required by Database Rules
export const userRoleEnum = pgEnum("user_role", ["CUSTOMER", "ADMIN"]);
export const movieStatusEnum = pgEnum("movie_status", ["NOW_SHOWING", "COMING_SOON", "ARCHIVED"]);
export const screenTypeEnum = pgEnum("screen_type", ["STANDARD", "IMAX_3D", "DOLBY_ATMOS", "VIP_LOUNGE"]);
export const seatTypeEnum = pgEnum("seat_type", ["STANDARD", "VIP", "COUPLE", "WHEELCHAIR"]);
export const seatStatusEnum = pgEnum("seat_status", ["AVAILABLE", "HELD", "BOOKED", "BLOCKED"]);
export const bookingStatusEnum = pgEnum("booking_status", ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED", "REFUNDED"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "COMPLETED", "FAILED", "REFUNDED"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["VALID", "USED", "VOID"]);

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: userRoleEnum("role").default("CUSTOMER").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("users_email_idx").on(table.email),
]);

// 2. Movies Table
export const movies = pgTable("movies", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  posterUrl: varchar("poster_url", { length: 1024 }).notNull(),
  backdropUrl: varchar("backdrop_url", { length: 1024 }).notNull(),
  trailerUrl: varchar("trailer_url", { length: 1024 }),
  durationMinutes: integer("duration_minutes").notNull(),
  rating: varchar("rating", { length: 20 }).notNull(), // e.g. "PG-13", "R"
  language: varchar("language", { length: 50 }).notNull(), // e.g. "English", "Spanish"
  director: varchar("director", { length: 255 }),
  cast: text("cast"), // comma-separated or json string
  releaseDate: timestamp("release_date", { withTimezone: true }).notNull(),
  status: movieStatusEnum("status").default("NOW_SHOWING").notNull(),
  featured: integer("featured").default(0).notNull(), // 1 for hero banner
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("movies_status_idx").on(table.status),
  index("movies_slug_idx").on(table.slug),
]);

// 3. Genres Table
export const genres = pgTable("genres", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Movie Genres Table (Many-to-Many)
export const movieGenres = pgTable("movie_genres", {
  movieId: uuid("movie_id").references(() => movies.id, { onDelete: "cascade" }).notNull(),
  genreId: uuid("genre_id").references(() => genres.id, { onDelete: "cascade" }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.movieId, table.genreId] }),
  index("movie_genres_movie_idx").on(table.movieId),
  index("movie_genres_genre_idx").on(table.genreId),
]);

// 5. Cinemas Table
export const cinemas = pgTable("cinemas", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  city: varchar("city", { length: 100 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  imageUrl: varchar("image_url", { length: 1024 }),
  amenities: text("amenities"), // JSON string e.g. ["IMAX", "Dolby Atmos", "Recliners"]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("cinemas_city_idx").on(table.city),
]);

// 6. Auditoriums Table
export const auditoriums = pgTable("auditoriums", {
  id: uuid("id").defaultRandom().primaryKey(),
  cinemaId: uuid("cinema_id").references(() => cinemas.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g. "Screen 1 - IMAX"
  screenType: screenTypeEnum("screen_type").default("STANDARD").notNull(),
  totalSeats: integer("total_seats").notNull(),
  rowsCount: integer("rows_count").default(8).notNull(),
  colsCount: integer("cols_count").default(12).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("auditoriums_cinema_name_uidx").on(table.cinemaId, table.name),
  index("auditoriums_cinema_idx").on(table.cinemaId),
]);

// 7. Seats Table
export const seats = pgTable("seats", {
  id: uuid("id").defaultRandom().primaryKey(),
  auditoriumId: uuid("auditorium_id").references(() => auditoriums.id, { onDelete: "cascade" }).notNull(),
  rowLabel: varchar("row_label", { length: 10 }).notNull(), // e.g. "A", "B"
  seatNumber: integer("seat_number").notNull(), // e.g. 1, 2, 3
  seatType: seatTypeEnum("seat_type").default("STANDARD").notNull(),
  priceMultiplier: integer("price_multiplier").default(100).notNull(), // 100 = 1.00x, 150 = 1.50x
  gridRow: integer("grid_row").notNull(),
  gridCol: integer("grid_col").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("seats_auditorium_row_number_uidx").on(table.auditoriumId, table.rowLabel, table.seatNumber),
  index("seats_auditorium_idx").on(table.auditoriumId),
]);

// 8. Showtimes Table
export const showtimes = pgTable("showtimes", {
  id: uuid("id").defaultRandom().primaryKey(),
  movieId: uuid("movie_id").references(() => movies.id, { onDelete: "cascade" }).notNull(),
  auditoriumId: uuid("auditorium_id").references(() => auditoriums.id, { onDelete: "cascade" }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  basePriceCents: integer("base_price_cents").notNull(), // e.g. 1499 for $14.99
  format: varchar("format", { length: 50 }).default("2D").notNull(), // "2D", "3D", "IMAX 3D", "Dolby Cinema"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("showtimes_movie_idx").on(table.movieId),
  index("showtimes_auditorium_idx").on(table.auditoriumId),
  index("showtimes_start_time_idx").on(table.startTime),
]);

// 9. Showtime Seats (Real-time availability and locking)
export const showtimeSeats = pgTable("showtime_seats", {
  id: uuid("id").defaultRandom().primaryKey(),
  showtimeId: uuid("showtime_id").references(() => showtimes.id, { onDelete: "cascade" }).notNull(),
  seatId: uuid("seat_id").references(() => seats.id, { onDelete: "cascade" }).notNull(),
  status: seatStatusEnum("status").default("AVAILABLE").notNull(),
  heldUntil: timestamp("held_until", { withTimezone: true }), // Expiration UTC timestamp
  holdToken: uuid("hold_token"), // Session token for holding user
  bookingId: uuid("booking_id"), // Linked once reserved
  version: integer("version").default(1).notNull(), // Optimistic locking
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("showtime_seats_showtime_seat_uidx").on(table.showtimeId, table.seatId),
  index("showtime_seats_showtime_status_idx").on(table.showtimeId, table.status),
  index("showtime_seats_held_until_idx").on(table.heldUntil),
]);

// 10. Bookings Table
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingReference: varchar("booking_reference", { length: 20 }).notNull().unique(), // e.g. "CB-9X82KD"
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  showtimeId: uuid("showtime_id").references(() => showtimes.id, { onDelete: "restrict" }).notNull(),
  status: bookingStatusEnum("status").default("PENDING").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  taxCents: integer("tax_cents").notNull(),
  serviceFeeCents: integer("service_fee_cents").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  holdToken: uuid("hold_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("bookings_user_idx").on(table.userId),
  index("bookings_status_idx").on(table.status),
  index("bookings_showtime_idx").on(table.showtimeId),
  index("bookings_ref_idx").on(table.bookingReference),
]);

// 11. Booking Items Table
export const bookingItems = pgTable("booking_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  showtimeSeatId: uuid("showtime_seat_id").references(() => showtimeSeats.id, { onDelete: "restrict" }).notNull(),
  seatId: uuid("seat_id").references(() => seats.id, { onDelete: "restrict" }).notNull(),
  priceCents: integer("price_cents").notNull(),
  seatLabel: varchar("seat_label", { length: 20 }).notNull(), // e.g. "E-7"
  seatType: seatTypeEnum("seat_type").default("STANDARD").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("booking_items_booking_idx").on(table.bookingId),
]);

// 12. Payments Table
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider", { length: 50 }).default("STRIPE").notNull(),
  transactionReference: varchar("transaction_reference", { length: 255 }).notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 10 }).default("usd").notNull(),
  status: paymentStatusEnum("status").default("PENDING").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("CARD").notNull(),
  rawPayload: text("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("payments_booking_idx").on(table.bookingId),
  index("payments_idempotency_idx").on(table.idempotencyKey),
  index("payments_transaction_idx").on(table.transactionReference),
]);

// 13. Tickets Table
export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(), // e.g. "TKT-CB-9X82KD-01"
  qrCodeData: text("qr_code_data").notNull(), // Base64 data URL or payload
  seatLabel: varchar("seat_label", { length: 20 }).notNull(),
  status: ticketStatusEnum("status").default("VALID").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("tickets_booking_idx").on(table.bookingId),
  index("tickets_number_idx").on(table.ticketNumber),
]);

// 14. Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id"), // Can be null if system action
  action: varchar("action", { length: 100 }).notNull(), // e.g. "SEAT_HOLD", "BOOKING_CONFIRM", "BOOKING_CANCEL"
  entityType: varchar("entity_type", { length: 100 }).notNull(), // "BOOKING", "PAYMENT", "SEAT"
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  metadata: text("metadata"), // JSON string
  ipAddress: varchar("ip_address", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_entity_idx").on(table.entityType, table.entityId),
]);

// Drizzle ORM Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  items: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  seat: one(seats, {
    fields: [bookingItems.seatId],
    references: [seats.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
}));
