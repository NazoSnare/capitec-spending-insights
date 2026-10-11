/** Previous / next with "21–40 of 1 225", for a list paged by offset. */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";

export default function Pagination({ offset, limit, total, onPage }) {
  if (!total) return null;
  const from = offset + 1;
  const to = Math.min(offset + limit, total);
  const page = Math.floor(offset / limit);
  const last = Math.max(0, Math.ceil(total / limit) - 1);
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3">
      <p className="num text-[13.5px] text-ink-3" aria-live="polite">
        {from.toLocaleString("en-ZA")}–{to.toLocaleString("en-ZA")} of {total.toLocaleString("en-ZA")}
      </p>
      <div className="flex gap-2">
        <Button size="sm" icon={ChevronLeft} disabled={page <= 0} onClick={() => onPage(page - 1)} aria-label="Previous page">Previous</Button>
        <Button size="sm" disabled={page >= last} onClick={() => onPage(page + 1)} aria-label="Next page">
          Next <ChevronRight size={15} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
