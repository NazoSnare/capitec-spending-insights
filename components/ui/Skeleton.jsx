/** A placeholder shaped like the content that is loading. */
export default function Skeleton({ className = "h-4 w-full", rounded = "rounded-lg" }) {
  return <div aria-hidden="true" className={`skeleton ${rounded} ${className}`} />;
}
