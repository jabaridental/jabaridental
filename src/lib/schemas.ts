/**
 * Zod validation for the CMS content API.
 *
 * These mirror src/lib/types.ts but use safe primitives. Validation runs
 * BEFORE any D1 write so malformed admin input is rejected with a 400 instead
 * of corrupting the database. Every endpoint in /api/content/* goes through
 * `validateCollectionBody()` first.
 */
import { z } from "zod";

const ImageRef = z.object({
  src: z.string(),
  alt: z.string().default(""),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
  caption: z.string().optional(),
  credit: z.string().optional(),
}).passthrough();

const TreatmentFaq = z.object({
  question: z.string(),
  answer: z.string(),
}).passthrough();

const Site = z.object({
  name: z.string(),
  shortName: z.string(),
  tagline: z.string(),
  location: z.string(),
  country: z.string(),
  description: z.string(),
  brandColors: z.object({ primary: z.string(), accent: z.string() }).passthrough(),
  logoText: z.string(),
}).passthrough();

const Hero = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  headlineAccent: z.string(),
  subhead: z.string(),
  primaryCtaLabel: z.string(),
  secondaryCtaLabel: z.string(),
  whatsappLabel: z.string(),
  image: ImageRef,
  imageMobile: ImageRef.optional(),
  statusNote: z.string(),
}).passthrough();

const Contact = z.object({
  phone: z.string(),
  whatsapp: z.string(),
  email: z.string().default(""),
  mapsUrl: z.string(),
  addressVerified: z.string(),
  addressNote: z.string(),
}).passthrough();

const Treatment = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  shortDescription: z.string(),
  longDescription: z.string(),
  icon: z.string().default(""),
  duration: z.string().default(""),
  price: z.string().default(""),
  priceVisible: z.boolean().default(false),
  faqs: z.array(TreatmentFaq).default([]),
  image: ImageRef,
  seoTitle: z.string().default(""),
  seoDescription: z.string().default(""),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  published: z.boolean().default(true),
  displayOrder: z.number().default(0),
}).passthrough();

const Article = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().default(""),
  body: z.string().default(""),
  author: z.string().default(""),
  category: z.string().default(""),
  tags: z.array(z.string()).default([]),
  publishedDate: z.string().default(""),
  updatedDate: z.string().default(""),
  seoTitle: z.string().default(""),
  seoDescription: z.string().default(""),
  featuredImage: ImageRef,
  socialImage: ImageRef,
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  displayOrder: z.number().default(0),
}).passthrough();

const Team = z.object({
  name: z.string(),
  role: z.string(),
  photo: ImageRef,
  biography: z.string().default(""),
  specialties: z.array(z.string()).default([]),
  credentials: z.string().default(""),
  displayOrder: z.number().default(0),
  published: z.boolean().default(true),
}).passthrough();

const Gallery = z.object({
  title: z.string(),
  category: z.string(),
  description: z.string().default(""),
  image: ImageRef,
  alt: z.string().default(""),
  date: z.string().default(""),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  displayOrder: z.number().default(0),
}).passthrough();

const BeforeAfter = z.object({
  treatmentName: z.string(),
  description: z.string().default(""),
  duration: z.string().default(""),
  beforeImage: ImageRef,
  afterImage: ImageRef,
  consent: z.boolean().default(false),
  approval: z.enum(["draft", "pending", "approved"]).default("draft"),
  published: z.boolean().default(false),
  displayOrder: z.number().default(0),
}).passthrough();

const Testimonial = z.object({
  displayName: z.string(),
  quote: z.string(),
  rating: z.number().min(1).max(5).default(5),
  date: z.string().default(""),
  isDemo: z.boolean().default(false),
  approved: z.boolean().default(false),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  displayOrder: z.number().optional(),
}).passthrough();

const Announcement = z.object({
  title: z.string(),
  message: z.string().default(""),
  ctaLabel: z.string().default(""),
  ctaUrl: z.string().default(""),
  startDate: z.string(),
  endDate: z.string(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  published: z.boolean().default(true),
  style: z.enum(["bar", "banner", "modal"]).default("bar"),
}).passthrough();

const Offer = z.object({
  title: z.string(),
  description: z.string().default(""),
  image: ImageRef,
  validFrom: z.string(),
  validUntil: z.string(),
  ctaLabel: z.string().default(""),
  whatsappMessage: z.string().default(""),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
}).passthrough();

const Hours = z.object({
  day: z.enum(["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]),
  label: z.string(),
  closed: z.boolean().default(false),
  open: z.string().default(""),
  close: z.string().default(""),
  open2: z.string().default(""),
  close2: z.string().default(""),
}).passthrough();

const SpecialHours = z.object({
  label: z.string(),
  date: z.string(),
  closed: z.boolean().default(false),
  open: z.string().default(""),
  close: z.string().default(""),
  note: z.string().default(""),
}).passthrough();

const Faq = z.object({
  question: z.string(),
  answer: z.string(),
  displayOrder: z.number().default(0),
  published: z.boolean().default(true),
}).passthrough();

const Social = z.object({
  label: z.string(),
  url: z.string(),
  displayOrder: z.number().default(0),
  published: z.boolean().default(true),
}).passthrough();

export const SCHEMAS: Record<string, z.ZodTypeAny> = {
  site: Site,
  hero: Hero,
  contact: Contact,
  treatments: Treatment,
  articles: Article,
  team: Team,
  gallery: Gallery,
  beforeAfter: BeforeAfter,
  testimonials: Testimonial,
  announcements: Announcement,
  offers: Offer,
  hours: Hours,
  specialHours: SpecialHours,
  faqs: Faq,
  social: Social,
};

export function validateCollectionBody(key: string, body: unknown): { ok: true; value: any } | { ok: false; error: string } {
  const schema = SCHEMAS[key];
  if (!schema) return { ok: false, error: `Unknown collection: ${key}` };
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path?.join(".") || "(root)";
    return { ok: false, error: `Invalid ${path}: ${issue?.message || "validation failed"}` };
  }
  return { ok: true, value: result.data };
}