/**
 * The API names each category's icon ("shopping-cart", "film", ...). Those are Lucide's
 * icon names, so they map one to one; anything unknown falls back to a tag rather
 * than breaking the row.
 */
import { Car, Film, ShoppingBag, ShoppingCart, Tag, Utensils, Zap } from "lucide-react";

const ICONS = { "shopping-cart": ShoppingCart, film: Film, car: Car, utensils: Utensils, "shopping-bag": ShoppingBag, zap: Zap };

export default function CategoryIcon({ icon, color, size = 36 }) {
  const Icon = ICONS[icon] || Tag;
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-xl"
      // The category colour as a soft tint behind a darker glyph: the brief's colours are
      // pastels, and pastel on white fails contrast.
      style={{ width: size, height: size, background: `${color}2e`, color: "#1f2d3a" }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </span>
  );
}
