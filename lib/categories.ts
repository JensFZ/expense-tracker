// Runtime category type — no longer hardcoded, loaded from DB
export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  monthly_limit: number | null;
  monthly_savings: number | null;
  sort_order: number;
}

// Seed data for first run
export const DEFAULT_CATEGORIES: Omit<Category, "monthly_limit" | "monthly_savings">[] = [
  { id: "essen",        label: "Essen",         icon: "🍔", color: "#4ade80", sort_order: 0 },
  { id: "transport",    label: "Transport",      icon: "🚗", color: "#60a5fa", sort_order: 1 },
  { id: "shopping",     label: "Shopping",       icon: "🛍️", color: "#c084fc", sort_order: 2 },
  { id: "unterhaltung", label: "Unterhaltung",   icon: "🎮", color: "#fb923c", sort_order: 3 },
  { id: "miete",        label: "Miete",          icon: "🏠", color: "#f87171", sort_order: 4 },
  { id: "sonstiges",    label: "Sonstiges",      icon: "📦", color: "#a8a29e", sort_order: 5 },
];

// Find a category from an array, falling back to a stub
export function resolveCategory(categories: Category[], id: string): Category {
  return (
    categories.find((c) => c.id === id) ?? {
      id,
      label: id,
      icon: "📦",
      color: "#a8a29e",
      monthly_limit: null,
      monthly_savings: null,
      sort_order: 99,
    }
  );
}

// Derive Tailwind-free inline style helpers from hex color
export function categoryBg(color: string, alpha = 0.12) {
  return `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

// Predefined color palette for picker
export const COLOR_PALETTE = [
  "#4ade80", "#22c55e", "#16a34a",
  "#60a5fa", "#3b82f6", "#2563eb",
  "#c084fc", "#a855f7", "#9333ea",
  "#fb923c", "#f97316", "#ea580c",
  "#f87171", "#ef4444", "#dc2626",
  "#fbbf24", "#f59e0b", "#d97706",
  "#2dd4bf", "#14b8a6", "#0d9488",
  "#f472b6", "#ec4899", "#db2777",
  "#818cf8", "#6366f1", "#4f46e5",
  "#a8a29e", "#78716c", "#57534e",
];

// Curated emoji list for icon picker
export const EMOJI_LIST = [
  // Food & drink
  "🍔","🍕","🥗","🍣","🌮","☕","🍺","🛒","🥑","🧃",
  // Transport
  "🚗","🚌","🚂","✈️","🚲","🛵","⛽","🚕","🛳️","🚐",
  // Shopping & home
  "🛍️","👗","👟","💻","📱","🛋️","🔧","🏠","💡","🧹",
  // Entertainment
  "🎮","🎬","🎵","🎭","🏋️","⚽","🎯","📚","🎨","🎲",
  // Finance & misc
  "💰","💳","🏦","📊","💊","🏥","🎁","🌿","🗓️","🐾",
];
