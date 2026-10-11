/**
 * The three states every data section can be in besides "here is the data": loading,
 * failed, and nothing to show. One component each, so every section says them the same
 * way and none is forgotten.
 */
import { AlertCircle, Inbox, RotateCw } from "lucide-react";
import Button from "./Button";
import Skeleton from "./Skeleton";

export function LoadingBlock({ lines = 3, label = "Loading" }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={`h-4 ${i % 2 ? "w-2/3" : "w-full"}`} />)}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-bad-bg p-4 text-bad">
      <div className="flex items-start gap-2">
        <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-[14px] font-medium">{message || "This could not be loaded."}</p>
      </div>
      {onRetry ? <Button size="sm" icon={RotateCw} onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}

export function EmptyBlock({ title = "Nothing here yet", children, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-card-muted px-6 py-10 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-black/[0.05] text-ink-3"><Icon size={20} aria-hidden="true" /></span>
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {children ? <p className="max-w-sm text-[13.5px] text-ink-3">{children}</p> : null}
    </div>
  );
}

/**
 * Picks the state for an RTK Query result, so a section only describes its data.
 * `isEmpty(data)` decides when a successful answer has nothing to show.
 */
export function QueryState({ result, isEmpty, empty, loading, children, errorText }) {
  const { data, isLoading, isError, refetch } = result;
  if (isLoading) return loading || <LoadingBlock />;
  if (isError) return <ErrorBlock message={errorText} onRetry={refetch} />;
  if (!data || isEmpty?.(data)) return empty || <EmptyBlock />;
  return children(data);
}
