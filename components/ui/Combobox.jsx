"use client";

/**
 * A searchable picker: a button that opens a list with a search box. Typing narrows the
 * list; arrow keys move, Enter chooses, Escape closes. Built to the WAI-ARIA combobox
 * pattern (an input with role="combobox" controlling a listbox, the highlighted option
 * named by aria-activedescendant), so a screen reader announces each option as the
 * keys move, and focus returns to the button when the list closes.
 *
 * A native <select> cannot be searched and cannot show a second line per option, which
 * is why this exists. For a short fixed list a native select is still better, and
 * components/ui/Select.jsx is used for those.
 *
 * @param {{
 *   label: string,
 *   options: Array<{ value: string, label: string, description?: string, keywords?: string }>,
 *   value: string,
 *   onChange: (value: string) => void,
 *   placeholder?: string,
 *   searchPlaceholder?: string,
 *   emptyText?: string,
 *   tone?: "light" | "dark",
 *   icon?: import("react").ComponentType<any>,
 * }} props
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { TbCheck, TbChevronDown, TbSearch } from "react-icons/tb";

/** Lower-case and strip accents, so "merwe" finds "Merwe" and "e" finds "é". */
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Options whose label, description or keywords contain every word typed, in any order. */
export function filterOptions(options, query) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return options;
  return options.filter((o) => {
    const hay = fold(`${o.label} ${o.description || ""} ${o.keywords || ""} ${o.value}`);
    return words.every((w) => hay.includes(w));
  });
}

/** The label with the first match of the query in bold. */
function Highlight({ text, query }) {
  const q = fold(query).trim().split(/\s+/)[0];
  if (!q) return text;
  const i = fold(text).indexOf(q);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-sky-soft px-0.5 font-semibold text-navy">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function Combobox({
  label, options, value, onChange, placeholder = "Choose…", searchPlaceholder = "Search",
  emptyText = "Nothing matches", tone = "light", icon: Icon,
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const button = useRef(null);
  const input = useRef(null);
  const list = useRef(null);

  const shown = useMemo(() => filterOptions(options, query), [options, query]);
  const selected = options.find((o) => o.value === value);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const choose = (o) => {
    if (!o) return;
    onChange(o.value);
    close();
  };

  // Focus the search box when the list opens.
  useEffect(() => { if (open) input.current?.focus(); }, [open]);

  // A click outside closes the list without moving focus back.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted option in view as the arrow keys move it.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKey = (e) => {
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); break;
      case "ArrowUp": e.preventDefault(); setActive((a) => Math.max(0, a - 1)); break;
      case "Home": e.preventDefault(); setActive(0); break;
      case "End": e.preventDefault(); setActive(shown.length - 1); break;
      case "Enter": e.preventDefault(); choose(shown[active]); break;
      case "Escape": e.preventDefault(); close(); break;
      case "Tab": close(false); break;
      default:
    }
  };

  const dark = tone === "dark";
  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected?.label || placeholder}`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => { if (["ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); openList(); } }}
        className={`inline-flex h-9 max-w-[240px] items-center gap-2 rounded-full border pl-3 pr-3 text-[13.5px] font-medium outline-none transition-colors ${
          dark ? "border-white/25 bg-white/10 text-white hover:bg-white/15 focus-visible:border-white" : "border-hair bg-card text-ink hover:bg-card-muted focus-visible:border-sky"
        }`}
      >
        {Icon ? <Icon size={16} aria-hidden="true" className="shrink-0 opacity-80" /> : null}
        <span className="truncate">{selected?.label || placeholder}</span>
        <TbChevronDown size={16} aria-hidden="true" className={`ml-1 shrink-0 opacity-80 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-hair bg-card text-ink shadow-[0_12px_40px_-12px_rgba(15,29,42,0.35)]">
          <div className="m-1.5 flex items-center gap-2.5 rounded-xl bg-card-muted px-3 ring-1 ring-inset ring-hair focus-within:bg-card focus-within:ring-sky">
            <TbSearch size={17} aria-hidden="true" className="shrink-0 text-ink-3" />
            <input
              ref={input}
              type="text"
              role="combobox"
              aria-label={`Search ${label.toLowerCase()}`}
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={shown[active] ? `${id}-opt-${active}` : undefined}
              value={query}
              placeholder={searchPlaceholder}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKey}
              autoComplete="off"
              spellCheck={false}
              // The field's own ring shows focus; the page-wide outline would draw a second one.
              className="h-10 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3"
            />
          </div>
          <ul ref={list} id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto px-1.5 pb-1.5">
            {shown.length ? shown.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  // mousedown, not click: the input would otherwise lose focus first and close the list.
                  onMouseDown={(e) => { e.preventDefault(); choose(o); }}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${i === active ? "bg-sky-soft" : ""}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink"><Highlight text={o.label} query={query} /></span>
                    {o.description ? <span className="block truncate text-[12.5px] text-ink-3">{o.description}</span> : null}
                  </span>
                  {isSelected ? <TbCheck size={17} aria-hidden="true" className="shrink-0 text-navy" /> : null}
                </li>
              );
            }) : (
              <li role="presentation" className="px-3 py-6 text-center text-[13.5px] text-ink-3">{emptyText}</li>
            )}
          </ul>
          <p aria-live="polite" className="sr-only">{query ? `${shown.length} ${shown.length === 1 ? "result" : "results"}` : ""}</p>
        </div>
      ) : null}
    </div>
  );
}
