# Decisions

Why the project is built the way it is, and what would change before it carried real
client data.

## The mock API is real code, not sample responses

The brief gives one example response per endpoint. Returning those as-is would make
every filter a no-op and every figure disagree with every other. Instead `server/`
generates a ledger of transactions and every endpoint is computed from it:

- **Deterministic.** Each month is generated from a seed of customer id and month, so a
  request gives the same answer every time, and a transaction keeps its id as days pass.
  Tests pin "now" and assert exact figures.
- **Consistent.** The summary total equals the category total equals the sum of the
  transactions, to the cent. A test checks each of these.
- **Pure functions.** The route handlers only parse the request and call a function in
  `server/spending.js`, so every rule is tested without starting a server.

## Money is integer cents

Amounts are generated, summed and compared in cents and converted to rands only in the
response. Floating-point rands drift (`0.1 + 0.2 !== 0.3`), and on a banking screen a
total that is a cent out is a defect.

## Percentages add up to 100

Rounding each category's share separately gives totals like 99.9% (the brief's own
example does this). Shares are rounded with the largest-remainder method so they always
total exactly 100.0%.

## Additions to the brief's shapes

All additive, so a client written against the brief still works:

- `trends[].partial` marks the current month, which is not over. Drawn like the others it
  looks like a sudden drop in spending.
- Categories are returned largest first, so the list, the legend and the chart agree.
- `goals[].status` can also be `over_budget`, and status is judged by pace through the
  month, not by a fixed share: 60% of a budget used on the 5th is a warning, on the 25th
  it is fine.
- Errors have one shape: `{ error: { code, message, details } }`.

## Server state and client state are kept apart

- **TanStack Query** owns everything that comes from the API: loading, errors, caching,
  retries, and refetching when the tab regains focus. Query keys start with the
  customer id, so one customer's figures can never appear under another's name.
- **Redux Toolkit** owns the client's choices: period, custom range, trend length,
  transaction filters, sort, page size, hide-amounts and the selected customer.
- **redux-persist** saves only that slice. Figures are never written to localStorage:
  yesterday's spending shown as today's is worse than a loading skeleton, and account
  data does not belong in browser storage.

Switching customer resets every filter, so one customer's view is never carried over.

## Components

Built in layers:

- `components/ui`: generic pieces with no knowledge of spending.
- `components/charts`: the two Victory charts.
- `sections`: each fetches its own data and handles its own loading, error and empty
  states.
- `containers`: arrange the sections into a page.

Every section shows a skeleton while loading, says what went wrong with a "Try again"
button on failure, and says what to do when there is nothing to show.

## Accessibility

- Charts are hidden from screen readers. The same figures are always available as text:
  the category list beside the donut, and a table view of the trend.
- The period switch is a radio group: one tab stop, with arrow keys between options.
- Status is never colour alone: every badge has a word, and every change figure says
  "up" or "down".
- The brief's category colours are pastels that fail contrast as text, so they are used
  as tints behind dark icons.
- axe runs WCAG 2 AA checks on both pages in the end-to-end tests. It caught the
  secondary grey at 4.3:1, which was darkened to 4.9:1.

## Security

- Headers on every response: a content security policy allowing only this origin, no
  framing, no MIME sniffing, a strict referrer policy, and camera, microphone and
  location switched off.
- API responses are `Cache-Control: private, no-store`.
- Input is validated on the server, whatever the client sends. A crash returns a
  generic message; the stack trace is logged, never sent.
- The Docker image runs as an unprivileged user and carries no dev dependencies.

## Before this carried real client data

- **Authentication.** Here the customer is chosen from a list. In production the
  customer id would come from the authenticated session on the server, never from the
  URL, so one client could not read another's data by changing a number.
- **A nonce-based CSP.** `'unsafe-inline'` is allowed for scripts because Next injects
  inline bootstrap scripts; a per-request nonce would remove it.
- **The real API.** `NEXT_PUBLIC_API_BASE` points the client elsewhere; the route
  handlers would be removed.
- **Monitoring and errors.** Error reporting, and a client-side error boundary per
  section rather than one per page.
- **Server-side rendering of data.** Prefetching the first view's queries on the
  server would remove the loading skeletons on first paint.
