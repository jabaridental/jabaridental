import type { ContentMap } from "../lib/types";

const ph = (file: string, alt: string) => ({
  src: `/images/stock/${file}.jpg`,
  alt,
  focalX: 50,
  focalY: 40,
});

const now = new Date().toISOString();

export const SEED: ContentMap = {
  site: {
    name: "JABARI DENTAL",
    shortName: "JABARI",
    tagline: "Exceptional dentistry. A better experience.",
    location: "Kampala, Uganda",
    country: "Uganda",
    description:
      "JABARI DENTAL is a premium dental clinic in Kampala, Uganda, offering modern, comfort-first dentistry designed around your long-term oral health.",
    brandColors: { primary: "#003C80", accent: "#b08d57" },
    logoText: "JABARI",
  },

  hero: {
    eyebrow: "Premium dental care · Kampala",
    headline: "Exceptional dentistry.",
    headlineAccent: "A better experience.",
    subhead:
      "Modern dentistry designed around your comfort, confidence and long-term oral health.",
    primaryCtaLabel: "Book an Appointment",
    secondaryCtaLabel: "Explore Treatments",
    whatsappLabel: "WhatsApp us",
    image: ph("hero", "Bright, calm dental clinic interior in Kampala"),
    imageMobile: ph("hero-mobile", "Dental clinic reception in warm natural light"),
    statusNote: "Now welcoming new patients",
  },

  contact: {
    phone: "256770590299",
    whatsapp: "256770590299",
    email: "",
    mapsUrl: "https://maps.app.goo.gl/xb75PRmN25xptA1V7",
    addressVerified: "Kampala, Uganda",
    addressNote:
      "Exact street address to be confirmed by the clinic. Tap Get Directions for the verified map location.",
  },

  social: [
    { id: "s1", label: "Instagram", url: "https://instagram.com/", displayOrder: 1, published: false },
    { id: "s2", label: "Facebook", url: "https://facebook.com/", displayOrder: 2, published: false },
  ],

  hours: [
    { id: "mon", day: "monday", label: "Monday", closed: false, open: "08:00", close: "18:00", open2: "", close2: "" },
    { id: "tue", day: "tuesday", label: "Tuesday", closed: false, open: "08:00", close: "18:00", open2: "", close2: "" },
    { id: "wed", day: "wednesday", label: "Wednesday", closed: false, open: "08:00", close: "18:00", open2: "", close2: "" },
    { id: "thu", day: "thursday", label: "Thursday", closed: false, open: "08:00", close: "18:00", open2: "", close2: "" },
    { id: "fri", day: "friday", label: "Friday", closed: false, open: "08:00", close: "18:00", open2: "", close2: "" },
    { id: "sat", day: "saturday", label: "Saturday", closed: false, open: "09:00", close: "14:00", open2: "", close2: "" },
    { id: "sun", day: "sunday", label: "Sunday", closed: true, open: "", close: "", open2: "", close2: "" },
  ],

  specialHours: [],

  announcements: [
    {
      id: "a1",
      title: "Now accepting appointments",
      message: "We are welcoming new patients for consultations and routine care.",
      ctaLabel: "Book now",
      ctaUrl: "/book",
      startDate: "2024-01-01",
      endDate: "2030-12-31",
      priority: "normal",
      published: true,
      style: "bar",
    },
  ],

  offers: [],

  treatments: [
    {
      id: "t1",
      name: "General Dentistry",
      slug: "general-dentistry",
      category: "Core Care",
      shortDescription:
        "Routine check-ups, preventive care and the everyday dentistry that keeps your smile healthy.",
      longDescription:
        "Our general dentistry covers comprehensive examinations, professional cleaning, fillings and preventive advice.\n\nWe focus on catching issues early and helping you build habits that protect your oral health for the long term.",
      image: ph("treatment-general", "Dentist examining a patient"),
      icon: "◷",
      duration: "30–60 min",
      price: "",
      priceVisible: false,
      faqs: [
        { question: "How often should I visit?", answer: "Most patients benefit from a check-up every six months. Your dentist may recommend a different interval based on your needs." },
      ],
      seoTitle: "General Dentistry in Kampala · JABARI DENTAL",
      seoDescription:
        "Routine dental check-ups, preventive care and fillings at JABARI DENTAL, a premium clinic in Kampala, Uganda.",
      featured: true,
      active: true,
      published: true,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t2",
      name: "Cosmetic Dentistry",
      slug: "cosmetic-dentistry",
      category: "Smile Design",
      shortDescription:
        "Thoughtful, natural-looking improvements to the colour, shape and harmony of your smile.",
      longDescription:
        "Cosmetic dentistry at JABARI DENTAL is about balance and proportion, not extremes.\n\nWe plan every change around your face, your features and what will look genuinely like you — only better.",
      image: ph("treatment-cosmetic", "Close-up of a bright natural smile"),
      icon: "✶",
      duration: "Varies",
      price: "",
      priceVisible: false,
      faqs: [
        { question: "Will it look natural?", answer: "Yes. We design cosmetic work to suit your features and keep results refined rather than exaggerated." },
      ],
      seoTitle: "Cosmetic Dentistry in Kampala · JABARI DENTAL",
      seoDescription:
        "Natural-looking cosmetic dentistry in Kampala, Uganda — smile design, veneers and more at JABARI DENTAL.",
      featured: true,
      active: true,
      published: true,
      displayOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t3",
      name: "Teeth Whitening",
      slug: "teeth-whitening",
      category: "Smile Design",
      shortDescription:
        "Safe, professional whitening that brightens your smile without sensitivity surprises.",
      longDescription:
        "Professional whitening is more controlled and more comfortable than over-the-counter kits.\n\nWe assess your teeth first and choose an approach that protects your enamel.",
      image: ph("treatment-whitening", "Professional teeth whitening treatment"),
      icon: "☀",
      duration: "45–60 min",
      price: "",
      priceVisible: false,
      faqs: [
        { question: "Is whitening safe?", answer: "When done professionally and assessed by a dentist, whitening is safe for most healthy teeth." },
      ],
      seoTitle: "Teeth Whitening in Kampala · JABARI DENTAL",
      seoDescription:
        "Safe, professional teeth whitening in Kampala, Uganda at JABARI DENTAL.",
      featured: false,
      active: true,
      published: true,
      displayOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t4",
      name: "Orthodontics",
      slug: "orthodontics",
      category: "Alignment",
      shortDescription:
        "Modern alignment options for straighter teeth and a healthier bite.",
      longDescription:
        "From clear aligners to conventional braces, we help you choose the right path for your smile and lifestyle.\n\nTreatment begins with a careful assessment and a clear plan.",
      image: ph("treatment-ortho", "Orthodontic consultation"),
      icon: "⌒",
      duration: "Plan dependent",
      price: "",
      priceVisible: false,
      faqs: [
        { question: "Am I too old for orthodontics?", answer: "Many adults straighten their teeth successfully. A consultation will confirm what is suitable for you." },
      ],
      seoTitle: "Orthodontics in Kampala · JABARI DENTAL",
      seoDescription:
        "Clear aligners and braces in Kampala, Uganda at JABARI DENTAL.",
      featured: false,
      active: true,
      published: true,
      displayOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t5",
      name: "Dental Implants",
      slug: "dental-implants",
      category: "Restoration",
      shortDescription:
        "A durable, natural-feeling way to replace missing teeth.",
      longDescription:
        "Dental implants replace both the root and the visible tooth, helping preserve bone and restore confident function.\n\nEvery case is planned individually with imaging.",
      image: ph("treatment-implants", "Dental implant planning"),
      icon: "⌗",
      duration: "Plan dependent",
      price: "",
      priceVisible: false,
      faqs: [
        { question: "Who is a candidate?", answer: "Suitability depends on bone health and overall condition. A consultation and scan will confirm." },
      ],
      seoTitle: "Dental Implants in Kampala · JABARI DENTAL",
      seoDescription:
        "Dental implants in Kampala, Uganda — natural-looking tooth replacement at JABARI DENTAL.",
      featured: false,
      active: true,
      published: true,
      displayOrder: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t6",
      name: "Children's Dentistry",
      slug: "childrens-dentistry",
      category: "Family",
      shortDescription:
        "Gentle, friendly dental care that helps children feel at ease.",
      longDescription:
        "We make early visits calm and positive so children build a healthy relationship with dental care.\n\nCare is age-appropriate, unhurried and reassuring.",
      image: ph("treatment-kids", "Child-friendly dental visit"),
      icon: "♥",
      duration: "20–40 min",
      price: "",
      priceVisible: false,
      faqs: [
        { question: "When should my child first visit?", answer: "A first visit is often recommended when the first teeth appear or by their first birthday." },
      ],
      seoTitle: "Children's Dentistry in Kampala · JABARI DENTAL",
      seoDescription:
        "Gentle children's dentistry in Kampala, Uganda at JABARI DENTAL.",
      featured: false,
      active: true,
      published: true,
      displayOrder: 6,
      createdAt: now,
      updatedAt: now,
    },
  ],

  team: [],

  gallery: [
    { id: "g1", title: "Reception", category: "clinic", description: "A calm space to arrive and settle in.", image: ph("gallery-reception", "Clinic reception area"), alt: "Clinic reception area in warm light", date: "2024-01-01", featured: true, published: true, displayOrder: 1 },
    { id: "g2", title: "Treatment room", category: "clinic", description: "Considered, comfortable clinical spaces.", image: ph("gallery-room", "Dental treatment room"), alt: "Dental treatment room", date: "2024-01-01", featured: true, published: true, displayOrder: 2 },
    { id: "g3", title: "Natural light", category: "clinic", description: "Light and quiet throughout the clinic.", image: ph("gallery-light", "Sunlit clinic corridor"), alt: "Sunlit clinic corridor", date: "2024-01-01", featured: false, published: true, displayOrder: 3 },
    { id: "g4", title: "Smile", category: "smile", description: "The reason we do what we do.", image: ph("gallery-smile", "A confident smile"), alt: "A confident smile", date: "2024-01-01", featured: false, published: true, displayOrder: 4 },
    { id: "g5", title: "Detail", category: "treatments", description: "Precision in every step.", image: ph("gallery-detail", "Dental instruments arranged neatly"), alt: "Neatly arranged dental instruments", date: "2024-01-01", featured: false, published: true, displayOrder: 5 },
    { id: "g6", title: "Comfort", category: "lifestyle", description: "Care that feels considered.", image: ph("gallery-comfort", "Comfortable waiting lounge"), alt: "Comfortable waiting lounge", date: "2024-01-01", featured: false, published: true, displayOrder: 6 },
  ],

  beforeAfter: [],

  testimonials: [
    {
      id: "tm1",
      displayName: "Demo Patient",
      quote:
        "Demo testimonial — replace with a real, approved patient quote in the admin panel. We never publish reviews without consent.",
      rating: 5,
      date: "2024-01-01",
      isDemo: true,
      approved: false,
      featured: false,
      published: false,
    },
  ],

  articles: [
    {
      id: "ar1",
      title: "Five small habits for a healthier smile",
      slug: "five-habits-for-a-healthier-smile",
      excerpt:
        "Lasting oral health is built on consistent, gentle habits. Here are five that make the biggest difference.",
      body:
        "A healthy smile is rarely the result of one big thing — it is the quiet sum of small, repeatable habits.\n\n## Brush with intention\n\nTwice a day is the baseline. Use a soft brush and a fluoride toothpaste, and take your time along the gum line where problems usually start.\n\n## Clean between your teeth\n\nInterdental cleaning reaches the spaces a brush cannot. Whether you prefer floss or small brushes, consistency matters more than technique perfection.\n\n## Rethink sugary snacking\n\nFrequent sugar exposure is harder on teeth than the amount itself. If you snack, water and a rinse afterwards help.\n\n## Don't skip check-ups\n\nRegular visits let small issues be handled early, when they are easier, calmer and less costly.\n\n## Notice changes\n\nBleeding gums, sensitivity or persistent dryness are worth mentioning. Early conversation is easier than late correction.",
      featuredImage: ph("article-habits", "Everyday oral care items"),
      author: "JABARI DENTAL",
      category: "Oral Health",
      tags: ["prevention", "daily care"],
      publishedDate: "2024-02-10",
      updatedDate: "2024-02-10",
      seoTitle: "Five habits for a healthier smile · JABARI DENTAL",
      seoDescription:
        "Simple, evidence-aware daily habits that protect your oral health, from the team at JABARI DENTAL in Kampala.",
      socialImage: ph("article-habits", "Oral health habits"),
      featured: true,
      published: true,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ar2",
      title: "What to expect at your first visit",
      slug: "what-to-expect-at-your-first-visit",
      excerpt:
        "New to the clinic? Here is how a first appointment at JABARI DENTAL is designed to feel calm and clear.",
      body:
        "Walking into a new clinic can feel uncertain. We design first visits to remove that uncertainty.\n\n## Before you arrive\n\nYou can book by WhatsApp or phone — no account needed. Let us know what is on your mind and any dates that suit you.\n\n## When you arrive\n\nOur reception is a calm place to settle in. We will confirm a few details and answer any questions.\n\n## The conversation first\n\nWe listen before we look. Your goals and concerns shape the examination.\n\n## The examination\n\nA gentle, thorough check focuses on what matters to your long-term health, with clear explanations as we go.\n\n## A clear next step\n\nYou leave with a simple, understandable plan — no pressure, no jargon.",
      featuredImage: ph("article-first", "Calm clinic reception"),
      author: "JABARI DENTAL",
      category: "Patient Guides",
      tags: ["first visit", "experience"],
      publishedDate: "2024-02-18",
      updatedDate: "2024-02-18",
      seoTitle: "What to expect at your first visit · JABARI DENTAL",
      seoDescription:
        "A calm, clear guide to your first dental visit at JABARI DENTAL in Kampala, Uganda.",
      socialImage: ph("article-first", "First visit"),
      featured: true,
      published: true,
      displayOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ar3",
      title: "Whitening, gently: what is actually safe",
      slug: "whitening-gently-what-is-safe",
      excerpt:
        "Not all whitening is equal. Here is how professional care keeps brightening safe and comfortable.",
      body:
        "Whitening is one of the most asked-about treatments — and one of the most misunderstood.\n\n## Why professional matters\n\nA dentist checks your teeth and gums first, so whitening is matched to your condition rather than guessed.\n\n## Comfort comes first\n\nSensitivity is manageable when products and timing are chosen carefully. We plan around your comfort.\n\n## Realistic expectations\n\nResults vary with your starting shade and habits. We would rather be honest about outcomes than over-promise.",
      featuredImage: ph("article-whitening", "Bright natural smile"),
      author: "JABARI DENTAL",
      category: "Treatment Education",
      tags: ["whitening", "cosmetic"],
      publishedDate: "2024-03-02",
      updatedDate: "2024-03-02",
      seoTitle: "Safe teeth whitening · JABARI DENTAL",
      seoDescription:
        "How professional teeth whitening stays safe and comfortable, explained by JABARI DENTAL in Kampala.",
      socialImage: ph("article-whitening", "Teeth whitening"),
      featured: false,
      published: true,
      displayOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
  ],

  faqs: [
    { id: "f1", question: "How do I book an appointment?", answer: "Use the Book Appointment button or message us on WhatsApp at +256770590299. No account is required.", displayOrder: 1, published: true },
    { id: "f2", question: "What happens during my first visit?", answer: "We start with a conversation about your goals, then a gentle examination with clear explanations and a simple plan.", displayOrder: 2, published: true },
    { id: "f3", question: "Where are you located?", answer: "We are in Kampala, Uganda. Use the Get Directions button for our verified map location.", displayOrder: 3, published: true },
    { id: "f4", question: "What are your opening hours?", answer: "Opening hours are set by the clinic and shown live on this site. Check the top of the page for current open/closed status.", displayOrder: 4, published: true },
    { id: "f5", question: "How can I contact the clinic?", answer: "Call or WhatsApp +256770590299, or use the contact section. We reply as soon as we can during opening hours.", displayOrder: 5, published: true },
  ],
};
