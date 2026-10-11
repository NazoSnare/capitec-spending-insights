/**
 * The surface everything sits on: a white card with a hairline border on the canvas.
 * `title` and `action` give every card the same header, so sections line up.
 */
export default function Card({ title, subtitle, action, children, className = "", as: Tag = "section", ...rest }) {
  return (
    <Tag className={`rounded-[var(--radius-card)] border border-hair bg-card p-5 sm:p-6 ${className}`} {...rest}>
      {title || action ? (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-[13.5px] text-ink-3">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </Tag>
  );
}
