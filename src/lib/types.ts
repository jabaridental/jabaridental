// ============================================================
// JABARI DENTAL — Content model (single source of truth)
// ============================================================

export type ID = string;
export type ISODate = string;

export interface Timestamped {
  id: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
  published: boolean;
  displayOrder: number;
}

export interface SiteSettings {
  name: string;
  shortName: string;
  tagline: string;
  location: string;
  country: string;
  description: string;
  brandColors: { primary: string; accent: string };
  logoText: string;
}

export interface Hero {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  subhead: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  whatsappLabel: string;
  image: ImageRef;
  imageMobile?: ImageRef;
  statusNote: string;
}

export interface ContactSettings {
  phone: string; // E.164 digits, e.g. 256770590299
  whatsapp: string; // E.164 digits
  email: string; // editable; leave "" if not verified
  mapsUrl: string;
  addressVerified: string; // only verified location text
  addressNote: string;
}

export interface SocialLink {
  id: ID;
  label: string;
  url: string;
  displayOrder: number;
  published: boolean;
}

export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DayHours {
  /** Stable id used by the studio to edit this row. */
  id?: ID;
  day: DayKey;
  label: string;
  closed: boolean;
  // up to two intervals
  open: string; // "08:00"
  close: string; // "18:00"
  open2: string;
  close2: string;
}

export interface SpecialHours {
  id: ID;
  label: string;
  date: string; // YYYY-MM-DD
  closed: boolean;
  open: string;
  close: string;
  note: string;
}

export interface Announcement {
  id: ID;
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  priority: "low" | "normal" | "high";
  published: boolean;
  style: "bar" | "banner" | "modal";
}

export interface Offer {
  id: ID;
  title: string;
  description: string;
  image: ImageRef;
  validFrom: string;
  validUntil: string;
  ctaLabel: string;
  whatsappMessage: string;
  active: boolean;
  featured: boolean;
}

export interface TreatmentFaq {
  question: string;
  answer: string;
}

export interface Treatment {
  id: ID;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  longDescription: string; // supports simple line breaks
  image: ImageRef;
  icon: string; // optional emoji/char or short label
  duration: string;
  price: string;
  priceVisible: boolean;
  faqs: TreatmentFaq[];
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  active: boolean; // maps to published for public listing
  createdAt: ISODate;
  updatedAt: ISODate;
  published: boolean;
  displayOrder: number;
}

export interface TeamMember {
  id: ID;
  name: string;
  role: string;
  photo: ImageRef;
  biography: string;
  specialties: string[];
  credentials: string;
  displayOrder: number;
  published: boolean;
}

export interface GalleryItem {
  id: ID;
  title: string;
  category: string; // clinic | team | treatments | smile | lifestyle
  description: string;
  image: ImageRef;
  alt: string;
  date: string;
  featured: boolean;
  published: boolean;
  displayOrder: number;
}

export type ApprovalStatus = "draft" | "pending" | "approved";

export interface BeforeAfterCase {
  id: ID;
  treatmentName: string;
  description: string;
  duration: string;
  beforeImage: ImageRef;
  afterImage: ImageRef;
  consent: boolean; // explicit consent/approval
  approval: ApprovalStatus;
  published: boolean; // only true when approved
  displayOrder: number;
}

export interface Testimonial {
  id: ID;
  displayName: string;
  quote: string;
  rating: number; // 1-5
  date: string;
  isDemo: boolean; // clearly marked during development
  approved: boolean;
  featured: boolean;
  published: boolean;
  /** Optional manual ordering (set by the studio's reorder buttons). */
  displayOrder?: number;
}

export interface Article {
  id: ID;
  title: string;
  slug: string;
  excerpt: string;
  body: string; // markdown-lite (paragraphs separated by blank lines; ## for subheads; ![]() images)
  featuredImage: ImageRef;
  author: string;
  category: string;
  tags: string[];
  publishedDate: string;
  updatedDate: string;
  seoTitle: string;
  seoDescription: string;
  socialImage: ImageRef;
  featured: boolean;
  published: boolean;
  displayOrder: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Faq {
  id: ID;
  question: string;
  answer: string;
  displayOrder: number;
  published: boolean;
}

export interface ImageRef {
  // path relative to /public or remote URL
  src: string;
  alt: string;
  // focal point 0-100 (%)
  focalX: number;
  focalY: number;
  caption?: string;
  credit?: string;
}

// CMS collections keyed by filename
export interface ContentMap {
  site: SiteSettings;
  hero: Hero;
  contact: ContactSettings;
  social: SocialLink[];
  hours: DayHours[];
  specialHours: SpecialHours[];
  announcements: Announcement[];
  offers: Offer[];
  treatments: Treatment[];
  team: TeamMember[];
  gallery: GalleryItem[];
  beforeAfter: BeforeAfterCase[];
  testimonials: Testimonial[];
  articles: Article[];
  faqs: Faq[];
}

/** Valid content collection names (the API routes import this). */
export type CollectionKey = keyof ContentMap;
