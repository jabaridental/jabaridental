/**
 * Drizzle schema for JABARI DENTAL content (Cloudflare D1 / SQLite).
 *
 * The schema mirrors the field-level semantics of src/lib/types.ts so the
 * public-facing TypeScript model doesn't need to change. JSON-typed columns
 * (e.g. `faqs` on `treatments`, `tags` on `articles`) are stored as TEXT and
 * parsed by the application layer — D1 doesn't have a native array type.
 *
 * Tables:
 *  - site / hero / contact              (single records, id = "site"|"hero"|"contact")
 *  - treatments / articles              (rich rows, JSON sub-fields)
 *  - team / gallery / testimonials       (rows)
 *  - before_after                       (consent + approval workflow)
 *  - announcements / offers             (date-range active windows)
 *  - hours / special_hours              (weekly + holiday closures)
 *  - faqs / social                      (rows)
 *  - media                              (R2 object index — alt, focal, original filename)
 */
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ---------- Single-record collections --------------------------------------
// We use a TEXT primary key so the table is small and stable. There is exactly
// one row per collection, keyed by a constant id.

export const site = sqliteTable("site", {
  id: text("id").primaryKey(), // always "site"
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  tagline: text("tagline").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  brandPrimary: text("brand_primary").notNull(),
  brandAccent: text("brand_accent").notNull(),
  logoText: text("logo_text").notNull(),
});

export const hero = sqliteTable("hero", {
  id: text("id").primaryKey(), // always "hero"
  eyebrow: text("eyebrow").notNull(),
  headline: text("headline").notNull(),
  headlineAccent: text("headline_accent").notNull(),
  subhead: text("subhead").notNull(),
  primaryCtaLabel: text("primary_cta_label").notNull(),
  secondaryCtaLabel: text("secondary_cta_label").notNull(),
  whatsappLabel: text("whatsapp_label").notNull(),
  statusNote: text("status_note").notNull(),
  // image fields stored as JSON: { src, alt, focalX, focalY, caption?, credit? }
  image: text("image").notNull(),
  imageMobile: text("image_mobile"),
});

export const contact = sqliteTable("contact", {
  id: text("id").primaryKey(), // always "contact"
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull().default(""),
  mapsUrl: text("maps_url").notNull(),
  addressVerified: text("address_verified").notNull(),
  addressNote: text("address_note").notNull(),
});

// ---------- Treatments ------------------------------------------------------
// The `faqs` and `image` JSON columns preserve the nested-shape of the
// original TS types; the application layer parses them on read.
export const treatments = sqliteTable("treatments", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  shortDescription: text("short_description").notNull(),
  longDescription: text("long_description").notNull(),
  icon: text("icon").notNull().default(""),
  duration: text("duration").notNull().default(""),
  price: text("price").notNull().default(""),
  priceVisible: integer("price_visible", { mode: "boolean" }).notNull().default(false),
  faqs: text("faqs").notNull().default("[]"), // JSON: TreatmentFaq[]
  image: text("image").notNull(), // JSON: ImageRef
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------- Articles --------------------------------------------------------
export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  author: text("author").notNull().default(""),
  category: text("category").notNull().default(""),
  tags: text("tags").notNull().default("[]"), // JSON: string[]
  publishedDate: text("published_date").notNull().default(""),
  updatedDate: text("updated_date").notNull().default(""),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  featuredImage: text("featured_image").notNull(), // JSON: ImageRef
  socialImage: text("social_image").notNull(),    // JSON: ImageRef
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------- Team ------------------------------------------------------------
export const team = sqliteTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  photo: text("photo").notNull(), // JSON: ImageRef
  biography: text("biography").notNull().default(""),
  specialties: text("specialties").notNull().default("[]"), // JSON: string[]
  credentials: text("credentials").notNull().default(""),
  displayOrder: integer("display_order").notNull().default(0),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
});

// ---------- Gallery ---------------------------------------------------------
export const gallery = sqliteTable("gallery", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(), // clinic|team|treatments|smile|lifestyle
  description: text("description").notNull().default(""),
  image: text("image").notNull(), // JSON: ImageRef
  alt: text("alt").notNull().default(""),
  date: text("date").notNull().default(""),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
});

// ---------- Before / After --------------------------------------------------
export const beforeAfter = sqliteTable("before_after", {
  id: text("id").primaryKey(),
  treatmentName: text("treatment_name").notNull(),
  description: text("description").notNull().default(""),
  duration: text("duration").notNull().default(""),
  beforeImage: text("before_image").notNull(), // JSON: ImageRef
  afterImage: text("after_image").notNull(),   // JSON: ImageRef
  consent: integer("consent", { mode: "boolean" }).notNull().default(false),
  approval: text("approval").notNull().default("draft"), // draft|pending|approved
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
});

// ---------- Testimonials ----------------------------------------------------
export const testimonials = sqliteTable("testimonials", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  quote: text("quote").notNull(),
  rating: integer("rating").notNull().default(5),
  date: text("date").notNull().default(""),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  displayOrder: integer("display_order"),
});

// ---------- Announcements ---------------------------------------------------
export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default(""),
  ctaUrl: text("cta_url").notNull().default(""),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  priority: text("priority").notNull().default("normal"), // low|normal|high
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  style: text("style").notNull().default("bar"), // bar|banner|modal
});

// ---------- Offers ----------------------------------------------------------
export const offers = sqliteTable("offers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  image: text("image").notNull(), // JSON: ImageRef
  validFrom: text("valid_from").notNull(),
  validUntil: text("valid_until").notNull(),
  ctaLabel: text("cta_label").notNull().default(""),
  whatsappMessage: text("whatsapp_message").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
});

// ---------- Hours (weekly schedule) -----------------------------------------
export const hours = sqliteTable("hours", {
  id: text("id").primaryKey(), // mon|tue|...
  day: text("day").notNull(),
  label: text("label").notNull(),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  open: text("open").notNull().default(""),
  close: text("close").notNull().default(""),
  open2: text("open2").notNull().default(""),
  close2: text("close2").notNull().default(""),
});

// ---------- Special hours (holiday closures) --------------------------------
export const specialHours = sqliteTable("special_hours", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  date: text("date").notNull(),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  open: text("open").notNull().default(""),
  close: text("close").notNull().default(""),
  note: text("note").notNull().default(""),
});

// ---------- FAQs ------------------------------------------------------------
export const faqs = sqliteTable("faqs", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
});

// ---------- Social ----------------------------------------------------------
export const social = sqliteTable("social", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
});

// ---------- Media (R2 object index) -----------------------------------------
// We persist metadata about uploaded objects in D1 so admin edits can list,
// reference, and clean up uploads without an extra round-trip to R2.
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  // R2 object key, e.g. "uploads/2024/05/abc123def456.jpg"
  objectKey: text("object_key").notNull(),
  // Public delivery URL (resolved by getPublicAssetUrl). For R2-backed
  // images this points at the custom media hostname.
  url: text("url").notNull(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  alt: text("alt").notNull().default(""),
  focalX: integer("focal_x").notNull().default(50),
  focalY: integer("focal_y").notNull().default(50),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});