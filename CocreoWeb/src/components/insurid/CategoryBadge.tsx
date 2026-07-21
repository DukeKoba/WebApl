import { type Category, CATEGORY_LABELS } from "@/lib/insurid/mock-articles";

const CATEGORY_STYLES: Record<Category, string> = {
  broker:     "bg-blue-900/10 text-blue-900 border-blue-900/20",
  insurer:    "bg-purple-900/10 text-purple-900 border-purple-900/20",
  market:     "bg-amber-700/10 text-amber-800 border-amber-700/20",
  claims:     "bg-orange-800/10 text-orange-800 border-orange-800/20",
  regulation: "bg-red-900/10 text-red-900 border-red-900/20",
  strategy:   "bg-teal-800/10 text-teal-800 border-teal-800/20",
  howto:      "bg-indigo-700/10 text-indigo-700 border-indigo-700/20",
};

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md";
}

export default function CategoryBadge({ category, size = "md" }: CategoryBadgeProps) {
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center rounded border font-medium tracking-wide ${sizeClass} ${CATEGORY_STYLES[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
