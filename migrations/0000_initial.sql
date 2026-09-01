-- Initial Cloudflare D1 schema for JABARI DENTAL.
-- Apply with:  wrangler d1 migrations apply DB
--
-- Mirrors the file-backed content store that lived in data/*.json. Every
-- "image" / "faqs" / "tags" / "specialties" column is JSON-encoded TEXT so
-- the application's TypeScript types stay unchanged on read.

CREATE TABLE `site` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `short_name` text NOT NULL,
  `tagline` text NOT NULL,
  `location` text NOT NULL,
  `country` text NOT NULL,
  `description` text NOT NULL,
  `brand_primary` text NOT NULL,
  `brand_accent` text NOT NULL,
  `logo_text` text NOT NULL
);

CREATE TABLE `hero` (
  `id` text PRIMARY KEY NOT NULL,
  `eyebrow` text NOT NULL,
  `headline` text NOT NULL,
  `headline_accent` text NOT NULL,
  `subhead` text NOT NULL,
  `primary_cta_label` text NOT NULL,
  `secondary_cta_label` text NOT NULL,
  `whatsapp_label` text NOT NULL,
  `status_note` text NOT NULL,
  `image` text NOT NULL,
  `image_mobile` text
);

CREATE TABLE `contact` (
  `id` text PRIMARY KEY NOT NULL,
  `phone` text NOT NULL,
  `whatsapp` text NOT NULL,
  `email` text NOT NULL DEFAULT '',
  `maps_url` text NOT NULL,
  `address_verified` text NOT NULL,
  `address_note` text NOT NULL
);

CREATE TABLE `treatments` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `category` text NOT NULL,
  `short_description` text NOT NULL,
  `long_description` text NOT NULL,
  `icon` text NOT NULL DEFAULT '',
  `duration` text NOT NULL DEFAULT '',
  `price` text NOT NULL DEFAULT '',
  `price_visible` integer NOT NULL DEFAULT 0,
  `faqs` text NOT NULL DEFAULT '[]',
  `image` text NOT NULL,
  `seo_title` text NOT NULL DEFAULT '',
  `seo_description` text NOT NULL DEFAULT '',
  `featured` integer NOT NULL DEFAULT 0,
  `active` integer NOT NULL DEFAULT 1,
  `published` integer NOT NULL DEFAULT 1,
  `display_order` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `articles` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `excerpt` text NOT NULL DEFAULT '',
  `body` text NOT NULL DEFAULT '',
  `author` text NOT NULL DEFAULT '',
  `category` text NOT NULL DEFAULT '',
  `tags` text NOT NULL DEFAULT '[]',
  `published_date` text NOT NULL DEFAULT '',
  `updated_date` text NOT NULL DEFAULT '',
  `seo_title` text NOT NULL DEFAULT '',
  `seo_description` text NOT NULL DEFAULT '',
  `featured_image` text NOT NULL,
  `social_image` text NOT NULL,
  `featured` integer NOT NULL DEFAULT 0,
  `published` integer NOT NULL DEFAULT 1,
  `display_order` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `team` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `role` text NOT NULL,
  `photo` text NOT NULL,
  `biography` text NOT NULL DEFAULT '',
  `specialties` text NOT NULL DEFAULT '[]',
  `credentials` text NOT NULL DEFAULT '',
  `display_order` integer NOT NULL DEFAULT 0,
  `published` integer NOT NULL DEFAULT 1
);

CREATE TABLE `gallery` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `category` text NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `image` text NOT NULL,
  `alt` text NOT NULL DEFAULT '',
  `date` text NOT NULL DEFAULT '',
  `featured` integer NOT NULL DEFAULT 0,
  `published` integer NOT NULL DEFAULT 1,
  `display_order` integer NOT NULL DEFAULT 0
);

CREATE TABLE `before_after` (
  `id` text PRIMARY KEY NOT NULL,
  `treatment_name` text NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `duration` text NOT NULL DEFAULT '',
  `before_image` text NOT NULL,
  `after_image` text NOT NULL,
  `consent` integer NOT NULL DEFAULT 0,
  `approval` text NOT NULL DEFAULT 'draft',
  `published` integer NOT NULL DEFAULT 0,
  `display_order` integer NOT NULL DEFAULT 0
);

CREATE TABLE `testimonials` (
  `id` text PRIMARY KEY NOT NULL,
  `display_name` text NOT NULL,
  `quote` text NOT NULL,
  `rating` integer NOT NULL DEFAULT 5,
  `date` text NOT NULL DEFAULT '',
  `is_demo` integer NOT NULL DEFAULT 0,
  `approved` integer NOT NULL DEFAULT 0,
  `featured` integer NOT NULL DEFAULT 0,
  `published` integer NOT NULL DEFAULT 0,
  `display_order` integer
);

CREATE TABLE `announcements` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `message` text NOT NULL DEFAULT '',
  `cta_label` text NOT NULL DEFAULT '',
  `cta_url` text NOT NULL DEFAULT '',
  `start_date` text NOT NULL,
  `end_date` text NOT NULL,
  `priority` text NOT NULL DEFAULT 'normal',
  `published` integer NOT NULL DEFAULT 1,
  `style` text NOT NULL DEFAULT 'bar'
);

CREATE TABLE `offers` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `image` text NOT NULL,
  `valid_from` text NOT NULL,
  `valid_until` text NOT NULL,
  `cta_label` text NOT NULL DEFAULT '',
  `whatsapp_message` text NOT NULL DEFAULT '',
  `active` integer NOT NULL DEFAULT 1,
  `featured` integer NOT NULL DEFAULT 0
);

CREATE TABLE `hours` (
  `id` text PRIMARY KEY NOT NULL,
  `day` text NOT NULL,
  `label` text NOT NULL,
  `closed` integer NOT NULL DEFAULT 0,
  `open` text NOT NULL DEFAULT '',
  `close` text NOT NULL DEFAULT '',
  `open2` text NOT NULL DEFAULT '',
  `close2` text NOT NULL DEFAULT ''
);

CREATE TABLE `special_hours` (
  `id` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `date` text NOT NULL,
  `closed` integer NOT NULL DEFAULT 0,
  `open` text NOT NULL DEFAULT '',
  `close` text NOT NULL DEFAULT '',
  `note` text NOT NULL DEFAULT ''
);

CREATE TABLE `faqs` (
  `id` text PRIMARY KEY NOT NULL,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `display_order` integer NOT NULL DEFAULT 0,
  `published` integer NOT NULL DEFAULT 1
);

CREATE TABLE `social` (
  `id` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `url` text NOT NULL,
  `display_order` integer NOT NULL DEFAULT 0,
  `published` integer NOT NULL DEFAULT 1
);

CREATE TABLE `media` (
  `id` text PRIMARY KEY NOT NULL,
  `object_key` text NOT NULL,
  `url` text NOT NULL,
  `mime` text NOT NULL,
  `bytes` integer NOT NULL,
  `alt` text NOT NULL DEFAULT '',
  `focal_x` integer NOT NULL DEFAULT 50,
  `focal_y` integer NOT NULL DEFAULT 50,
  `uploaded_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treatments_published ON treatments (published, active, display_order);
CREATE INDEX idx_articles_published ON articles (published, published_date);
CREATE INDEX idx_gallery_published ON gallery (published, featured, display_order);
CREATE INDEX idx_before_after_published ON before_after (published, approval, consent);
CREATE INDEX idx_testimonials_published ON testimonials (published, approved);
CREATE INDEX idx_faqs_published ON faqs (published, display_order);
CREATE INDEX idx_team_published ON team (published, display_order);
CREATE INDEX idx_social_published ON social (published, display_order);
CREATE INDEX idx_hours_day ON hours (day);
CREATE INDEX idx_special_hours_date ON special_hours (date);
CREATE INDEX idx_announcements_dates ON announcements (published, start_date, end_date);
CREATE INDEX idx_offers_dates ON offers (active, valid_from, valid_until);