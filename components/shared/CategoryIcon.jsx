/**
 * The API names each category's icon ("shopping-cart", "film", ...) rather than sending
 * an image. This maps those names to react-icons' Tabler set; a name it does not know
 * falls back to a tag rather than breaking the row, so a new category on the server
 * still renders.
 */
import { TbBolt, TbCar, TbMovie, TbShoppingBag, TbShoppingCart, TbTag, TbToolsKitchen2 } from "react-icons/tb";

const ICONS = { "shopping-cart": TbShoppingCart, film: TbMovie, car: TbCar, utensils: TbToolsKitchen2, "shopping-bag": TbShoppingBag, zap: TbBolt };

export default function CategoryIcon({ icon, color, size = 36 }) {
  const Icon = ICONS[icon] || TbTag;
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
