# Decisions

Why the project is built the way it is, and what would have to change before it held
real client data.

## A working mock API instead of sample responses

The brief shows one example response per endpoint. If the app returned those as they
are, no filter would do anything, and the figures on screen would contradict each other.
So `server/` generates a ledger of transactions, and every endpoint calculates its answer
from that ledger.

Each month is generated from a seed made of the client id and the month. The same
request therefore gets the same answer every time, and a transaction keeps its id as the
days go by. The tests fix "now" and check exact figures.

Because everything comes from one ledger, the summary total, the category total and the
sum of the transactions are the same number, to the cent. There's a test for each of
those.

The route handlers only read the request and call a function in `server/spending.js`.
That means every rule can be tested without starting a server.

## Money is counted in cents

Amounts are generated, added up and compared as whole cents, and only turned into rands
when the response is written. Floating-point rands drift (`0.1 + 0.2 !== 0.3`), and on a
banking screen a total that's a cent out is a bug.

## Percentages always add up to 100

If each category's share is rounded on its own, the shares can add up to 99.9%. The
brief's own example does exactly that. Shares here are rounded with the largest-remainder
method, so they always total 100.0%.

## What was added to the brief's responses

Every addition is a new field or a new value, so a client written against the brief
still works.

The trend marks the current month with `partial: true`. It isn't over yet, and drawn like
a full month it looks like spending suddenly dropped.

Categories come back largest first, so the list, the legend and the chart all read in
the same order.

A budget's status can also be `over_budget`, and status depends on pace through the
month rather than a fixed share. Using 60% of a budget by the 5th earns a warning; by the
25th it's fine.

Errors always have the same shape: `{ error: { code, message, details } }`.

`GET /api/customers` lists the demo clients for the "Viewing as" picker. It's for the
demo only. A real app has no such list, because the client is whoever is signed in.

## Server data and the customer's choices are kept apart

TanStack Query holds everything that comes from the API. It handles loading, errors,
caching, retries, and refetching when the tab is focused again. Every query key starts
with the client id, so one client's figures can't show up under another client's name.

Redux Toolkit holds what the customer chose: the period, a custom range, how many months
the trend shows, the transaction filters, the sort, the page size, the hide-amounts
switch and the client being viewed.

redux-persist saves only those choices. Figures are never written to localStorage. A
stale balance is worse than a loading skeleton, and account data doesn't belong in
browser storage.

Switching client resets every filter, so one client's view never carries over to the
next.

## How the code is organised

The components come in layers, and each layer only uses the ones below it.

`components/ui` holds generic pieces that know nothing about spending, such as the card,
button, picker and badge. `components/charts` has the two Victory charts.
`components/shared` has small spending-specific pieces used in more than one place, like
the transaction row. `components/sections` holds the parts of the dashboard; each one
fetches its own data and draws its own loading, error and empty states.
`components/containers` arranges the sections into pages.

Everything that isn't a component lives in `utils/`: the hooks, the Redux store, the
providers and plain helpers. `server/` stays separate because it only runs on the
server, and the browser code never imports it.

## Accessibility

Charts are hidden from screen readers, because the same figures are always on screen as
text: the category list beside the donut, and the trend's table view. Clicking a slice of
the donut opens its category, and so does the matching row in the list, which is a link.
That row is how keyboard and screen-reader users get there.

Tailwind 4 gives buttons the ordinary arrow cursor. The base styles put the pointer back
on anything clickable and show "not allowed" on disabled controls, and an end-to-end test
checks both.

The period switch is a radio group. It's one tab stop, and the arrow keys move between
the options. The "Viewing as" picker follows the WAI-ARIA combobox pattern.

Status never relies on colour alone. Every badge has a word on it, and every change
figure says "up" or "down" to a screen reader.

The brief's category colours are pastels that fail contrast as text, so they're used as
tints behind dark icons instead.

The end-to-end tests run axe's WCAG 2 AA checks on both pages. The secondary text colour
was chosen to reach 4.9:1 against the page background; axe failed the first choice, at
4.3:1.

## Security

Every response carries security headers. The content security policy only allows this
origin. Framing and MIME sniffing are off, the referrer policy is strict, and the camera,
microphone and location are switched off.

API responses are sent with `Cache-Control: private, no-store`.

The server validates every input, whatever the client sends. If something crashes, the
client gets a generic message, and the stack trace goes to the log.

The Docker image runs as an unprivileged user and contains no dev dependencies.

## Before this held real client data

Sign-in comes first. Here the client is picked from a list. In production the client id
has to come from the signed-in session on the server, never from the URL, or one client
could read another's account by changing a number.

The content security policy allows `'unsafe-inline'` for scripts, because Next injects
small inline scripts. A nonce generated per request would remove the need.

`NEXT_PUBLIC_API_BASE` points the app at the real API, and the route handlers in
`app/api` would then be deleted.

Each section should get its own error boundary, and errors should be reported to a
monitoring service.

Prefetching the first view's queries on the server would mean the page arrives already
filled in, with no loading skeletons.
