import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-[24px] font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-ink-3">The page you were looking for does not exist.</p>
      <Link href="/" className="mt-4 inline-block font-semibold text-navy underline">Back to the overview</Link>
    </div>
  );
}
