/**
 * The one button. Variants rather than ad-hoc classes, so a primary action looks the
 * same everywhere.
 */
const VARIANTS = {
  primary: "bg-navy text-white hover:bg-navy-deep disabled:bg-black/10 disabled:text-ink-3",
  secondary: "border border-hair bg-card text-ink hover:bg-card-muted disabled:text-ink-3",
  ghost: "text-ink-2 hover:bg-black/[0.04] hover:text-ink disabled:text-ink-3",
};
const SIZES = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-[14px]" };

export default function Button({ variant = "secondary", size = "md", icon: Icon, children, className = "", type = "button", ...rest }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {Icon ? <Icon size={size === "sm" ? 15 : 17} strokeWidth={2} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
