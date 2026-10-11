/**
 * Formatting, in one place, so a rand amount looks the same on every screen.
 *
 * Rands are written the South African way a bank statement writes them: "R4 275.10",
 * a space between thousands and a point before cents. Intl's en-ZA locale uses a
 * comma for the decimal ("R 4 275,10"), which customers read as a different number.
 */
const NBSP = " ";

/** @param {number} amount in rands @param {{ cents?: boolean, sign?: boolean }} [o] */
export function formatZAR(amount, { cents = true, sign = false } = {}) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "—";
  const n = Number(amount);
  const negative = n < 0;
  const fixed = Math.abs(n).toFixed(cents ? 2 : 0);
  const [whole, frac] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const prefix = negative ? "-" : sign && n > 0 ? "+" : "";
  return `${prefix}R${grouped}${frac ? `.${frac}` : ""}`;
}

/** A compact amount for chart axes: R4.3k, R1.2m. */
export function formatZARShort(amount) {
  const n = Number(amount) || 0;
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `R${Math.round(n)}`;
}

/** "+12.5%" / "-3.2%" / "0%"; null becomes "—" because there was nothing to compare. */
export function formatChange(pct) {
  if (pct === null || pct === undefined) return "—";
  const n = Number(pct);
  return `${n > 0 ? "+" : ""}${n.toFixed(1).replace(/\.0$/, "")}%`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10" -> "Oct 2026", or "Oct" when short. */
export function formatMonth(key, { short = false } = {}) {
  const [y, m] = String(key).split("-");
  const name = MONTHS[Number(m) - 1] || key;
  return short ? name : `${name} ${y}`;
}

/**
 * An ISO timestamp as "8 Oct 2026" (and "14:30" when withTime), in South African time.
 * Built from parts rather than Intl's en-ZA string, which writes "08 Oct" and "Sept".
 */
export function formatDate(iso, { withTime = false } = {}) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-ZA", {
      year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Johannesburg",
    }).formatToParts(d).map((p) => [p.type, p.value]),
  );
  const date = `${Number(parts.day)} ${MONTHS[Number(parts.month) - 1]} ${parts.year}`;
  return withTime ? `${date}, ${parts.hour}:${parts.minute}` : date;
}

/** "2026-09-12" -> "12 Sep 2026" without any timezone shift. */
export function formatDay(day) {
  const [y, m, d] = String(day).split("-");
  if (!d) return day;
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** "on_track" -> "On track" */
export const humanise = (s) => String(s || "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
