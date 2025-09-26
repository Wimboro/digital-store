export type Product = {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  thumbnail: string;
  rating: number;
  downloads: number;
  lastUpdated: string;
  features: string[];
  fileFormats: string[];
  delivery: string;
  license: string;
};

export const products: Product[] = [
  {
    id: "prod-analytics-dashboard",
    name: "Analytics Dashboard Kit",
    shortDescription: "Modular dashboard UI kit for tracking SaaS metrics and customer health.",
    description:
      "Build high-signal B2B analytics dashboards in minutes. The kit includes 24 widgets, responsive layouts for desktop and mobile, and prebuilt theming tokens. Tailored for teams that need to demo actionable insights without connecting a live database.",
    price: 48,
    category: "UI Kits",
    tags: ["analytics", "dashboard", "saas"],
    thumbnail:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
    rating: 4.9,
    downloads: 1874,
    lastUpdated: "2024-10-12",
    features: [
      "24 production-ready widgets",
      "Dark and light themes",
      "Figma + React + Tailwind variants"
    ],
    fileFormats: ["Figma", "React", "Tailwind"],
    delivery: "Instant download",
    license: "Single site"
  },
  {
    id: "prod-course-template",
    name: "Course Landing Template",
    shortDescription: "High-converting course funnel with hero blocks, curriculum, and testimonial sections.",
    description:
      "Launch your next cohort without waiting on engineering. This template ships with modular sections, embedded video hero, curriculum grids, instructor highlights, and integrated checkout CTAs that can be wired to any provider.",
    price: 32,
    category: "Web Templates",
    tags: ["education", "conversion", "landing"],
    thumbnail:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
    rating: 4.8,
    downloads: 982,
    lastUpdated: "2024-09-30",
    features: [
      "11 flexible content sections",
      "Video-ready hero",
      "Testimonials and FAQ blocks"
    ],
    fileFormats: ["Next.js", "HTML", "Figma"],
    delivery: "Instant download",
    license: "Commercial"
  },
  {
    id: "prod-marketing-icons",
    name: "Marketing Icon Pack",
    shortDescription: "Vector icon set for lifecycle, payments, marketing automation, and growth funnels.",
    description:
      "400 handcrafted icons with consistent stroke weights and corner radiuses. Delivered in SVG and Figma libraries with prebuilt color tokens for light and dark backgrounds.",
    price: 24,
    category: "Assets",
    tags: ["icons", "marketing", "brand"],
    thumbnail:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
    rating: 4.7,
    downloads: 3120,
    lastUpdated: "2024-07-21",
    features: [
      "400 unique glyphs",
      "Light & dark ready",
      "SVG + Figma + IconJar"
    ],
    fileFormats: ["SVG", "Figma", "IconJar"],
    delivery: "Instant download",
    license: "Perpetual"
  },
  {
    id: "prod-notion-os",
    name: "Creator Operating System",
    shortDescription: "Notion workspace that centralizes content ideation, publishing, and analytics.",
    description:
      "A complete Notion system for creators managing newsletters, podcasts, and paid communities. Includes editorial calendar, asset tracker, sponsor CRM, and automation recipes.",
    price: 28,
    category: "Workflows",
    tags: ["notion", "productivity", "automation"],
    thumbnail:
      "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80",
    rating: 4.9,
    downloads: 2485,
    lastUpdated: "2024-08-14",
    features: [
      "Editorial command center",
      "Sponsor CRM",
      "Automation recipes"
    ],
    fileFormats: ["Notion"],
    delivery: "Shared workspace link",
    license: "Single creator"
  },
  {
    id: "prod-audio-kit",
    name: "Podcast Starter Audio Kit",
    shortDescription: "Production-grade intro beds, transitions, and loopable underscores.",
    description:
      "Set the tone for your audio brand with 60 royalty-free tracks designed for podcasts, live streams, and YouTube intros. Includes stems for custom mixes and alternate durations.",
    price: 19,
    category: "Audio",
    tags: ["podcast", "audio", "brand"],
    thumbnail:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80",
    rating: 4.6,
    downloads: 1786,
    lastUpdated: "2024-05-02",
    features: ["60 royalty-free tracks", "Loopable stems", "WAV + MP3"],
    fileFormats: ["WAV", "MP3", "Stems"],
    delivery: "Zip download",
    license: "Royalty free"
  },
  {
    id: "prod-automation-zapier",
    name: "Automation Playbook for Zapier",
    shortDescription: "40+ ready-to-deploy Zapier blueprints for e-commerce, ops, and lifecycle.",
    description:
      "Stop building workflows from scratch. Each automation includes a visual map, trigger/action descriptions, and pro tips for scaling. Filter by category to find the right automation for your team.",
    price: 35,
    category: "Playbooks",
    tags: ["automation", "zapier", "ops"],
    thumbnail:
      "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80",
    rating: 4.85,
    downloads: 1298,
    lastUpdated: "2024-06-18",
    features: [
      "40 automation blueprints",
      "Onboarding checklist",
      "Lifecycle campaign examples"
    ],
    fileFormats: ["PDF", "Miro", "ClickUp"],
    delivery: "Instant download",
    license: "Team"
  }
];
