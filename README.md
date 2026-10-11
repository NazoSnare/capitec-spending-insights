# Spending Insights

A responsive dashboard that shows a Capitec client where their money goes: spending by
category, monthly trends, budgets and every transaction. Built for the Capitec
**Software Engineer (Front-End)** take-home, *Customer Spending Insights Dashboard*.

![The overview](docs/screenshots/overview.png)

All data is fictional. The mock API implements all seven endpoints in
`CustomerSpendingInsightsEndpoints.md`, on one consistent set of generated transactions,
so the summary, categories, trends and transaction list always agree and every filter
really filters.

## Run it

**Docker**, the only requirement:

```sh
docker build -t spending-insights .
docker run --rm -p 3000:3000 spending-insights
```

Open <http://localhost:3000>. The image runs lint and the unit tests while it builds, so
an image that builds has passed them. It runs as an unprivileged user and has a health
check against a real API endpoint.

**Locally**, with Node 20.9 or newer:

```sh
npm ci
npm run dev        # http://localhost:3000, with hot reload
```

## Test it

```sh
npm run lint       # ESLint, no warnings allowed
npm test           # unit and component tests (Vitest + Testing Library)
npm run build
npm run test:e2e   # end-to-end in a real browser, desktop and phone (Playwright)
npm run test:all   # all of the above, in order
```

`test:e2e` builds nothing itself: run `npm run build` first. It downloads nothing either:
run `npx playwright install chromium` once, or use an installed Chrome with
`PW_CHANNEL=chrome npm run test:e2e`.

GitHub Actions runs all of it on every push, then builds the Docker image, starts it and
waits for it to report healthy (`.github/workflows/ci.yml`).

| | What is covered |
| --- | --- |
| API (29 tests) | every endpoint; validation and error codes; the endpoints agreeing with each other to the cent; percentages adding to 100; budget pace; 404s; no internal fields leaked |
| Front end (37 tests) | formatting; the preferences slice and what it persists; components (the searchable picker's keyboard and screen-reader behaviour, the period switch, hidden amounts, progress, paging); sections rendered against the real API logic, including failure and retry |
| End to end (22 runs) | the overview, period changes surviving a reload, hiding amounts, switching customer by searching, a customer with no budgets, a category opening its transactions, paging and sorting, the table view, no sideways scroll, and an axe WCAG 2 AA scan of both pages, each on desktop and phone |

## What it does

- **Summary**: total spent, number of transactions, average and top category for 7 days,
  30 days, 90 days or a year, each compared with the period before it.
- **Spending by category**: a donut and, beside it, the same figures as a list. Choose a
  category to open its transactions, already filtered. A custom date range is supported.
- **Monthly spending**: 6, 12 or 24 months as a bar chart with the average month marked,
  or as a table. The current month is drawn lighter because it is not over yet.
- **Monthly budgets**: each budget's use, with a marker for where spending would be if
  spread evenly through the month. "Watch this" means ahead of pace, not just "over 80%".
- **Transactions**: filter by category and dates, sort four ways, 10 to 100 per page.
- **Hide amounts**: one switch replaces every rand figure on screen and for screen readers,
  for when someone is looking over your shoulder.
- **Viewing as**: a searchable picker to switch between the six demo clients. Type part
  of a name, a client number or an account type ("merwe", "67890", "premium") and the
  list narrows as you type, with the match highlighted. It works fully from the keyboard
  (arrows, Enter, Escape) and with a screen reader. See [The searchable picker](#the-searchable-picker).
- **Remembered**: the period, filters, sort, page size, the client being viewed and the
  hide-amounts switch are kept between visits. Figures never are.

![Transactions filtered to Dining](docs/screenshots/transactions.png)

<p align="center"><img src="docs/screenshots/phone.png" width="320" alt="The overview on a phone"></p>

## How it is built

**This is a React 19 app.** Every screen is plain React: function components, hooks,
Redux Toolkit and TanStack Query. Next.js provides three things only:

- page routing;
- the production server;
- a home for the mock API.

Next-specific code is kept to five imports in four files: `Link` and `usePathname` in
the shell and two sections, and `Image` in the logo. Moving to Vite with React Router
means changing those imports; the components, sections, hooks and store move unchanged. The API sits behind one
setting, `NEXT_PUBLIC_API_BASE`: point it at a real back end and the route handlers in
`app/api` can be deleted.

```mermaid
flowchart LR
  subgraph Browser
    direction TB
    UI["React components<br/>components/containers → sections → ui"]
    RQ["TanStack Query<br/>server state: cache, retries, refetch"]
    RX["Redux Toolkit<br/>preferences"]
    LS[("localStorage<br/>preferences only")]
    UI -- "useSummary(), useTransactions() …" --> RQ
    UI -- "useSelector / dispatch" --> RX
    RX <-- "redux-persist" --> LS
  end
  subgraph Server["Next.js server (one Docker image)"]
    direction TB
    RH["Route handlers<br/>app/api/customers/[id]/…"]
    SP["server/spending.js<br/>validation and the seven endpoints"]
    LG["server/ledger.js<br/>deterministic transactions, in cents"]
    RH --> SP --> LG
  end
  RQ -- "GET /api/customers/12345/…<br/>JSON, or 400 / 404 with an error body" --> RH
```

Figures live only in TanStack Query's in-memory cache, and only the customer's choices
are written to the browser.

A change of period, step by step:

```mermaid
sequenceDiagram
  actor C as Customer
  participant T as PeriodToolbar
  participant R as Redux (persisted)
  participant S as SummaryCards
  participant Q as TanStack Query
  participant A as Mock API

  C->>T: chooses "90 days"
  T->>R: dispatch(setPeriod("90d"))
  R-->>R: saved to localStorage
  R-->>S: period = "90d"
  S->>Q: useSummary({ customerId, period: "90d" })
  alt already cached and fresh
    Q-->>S: cached figures
  else
    Q->>A: GET /spending/summary?period=90d
    A-->>Q: 200 { totalSpent, transactionCount, … }
    Q-->>S: figures, cached under ["customer", id, "summary", { period }]
  end
  S-->>C: new totals and the change vs the previous 90 days
```

How the components are layered (each layer only uses the ones below it):

```mermaid
flowchart TB
  P["app/ (routes)<br/>page.js · transactions/page.js"] --> CO["components/containers/<br/>AppShell · DashboardContainer · TransactionsContainer"]
  CO --> SE["components/sections/<br/>SummaryCards · CategoryBreakdown · TrendSection<br/>GoalsSection · RecentTransactions · TransactionList …"]
  SE --> CH["components/charts/<br/>CategoryDonut · SpendingTrendChart (Victory)"]
  SE --> SH["components/shared/<br/>TransactionRow · CategoryIcon · Logo"]
  SE --> HK["utils/hooks and utils/store<br/>data and preferences"]
  CH --> UI["components/ui/<br/>Card · StatCard · Button · Badge · Money · Delta<br/>SegmentedControl · Select · Combobox · DateField<br/>ProgressBar · Pagination · States · Skeleton"]
  SH --> UI
```

Sections are the only layer that fetches. Each one handles its own loading, error and
empty states, so a failing endpoint breaks one card, not the page.

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, JavaScript |
| Server state | TanStack Query: one hook per endpoint (`utils/hooks/useSpendingApi.js`) |
| Client state | Redux Toolkit, with redux-persist saving the preferences to localStorage |
| Charts | Victory |
| Icons | react-icons (the Tabler set) |
| Styling | Tailwind CSS 4, with the Capitec palette as theme tokens (`app/globals.css`) |
| Mock API | Next route handlers under `app/api`, over pure functions in `server/` |
| Tests | Vitest, Testing Library, Playwright, axe-core |

```
app/                     routes only: the two pages and the API endpoints
components/
  ui/                    generic pieces: Card, StatCard, Button, Badge, Money, Delta,
                         SegmentedControl, Select, Combobox, DateField, ProgressBar,
                         Pagination, States, Skeleton
  charts/                CategoryDonut and SpendingTrendChart (Victory)
  shared/                TransactionRow, CategoryIcon, Logo
  sections/              the dashboard's parts; each fetches its own data
  containers/            one per page, plus the app shell; they arrange sections
utils/
  hooks/                 useSpendingApi (one hook per endpoint), useElementWidth
  store/                 the Redux store and the preferences slice
  providers/             AppProviders: Redux, redux-persist and TanStack Query
  lib/                   formatting, periods, the HTTP client and the query client
server/                  the mock API's data and logic (runs on the server only)
e2e/                     Playwright tests
```

The choices behind this, and what would change in production, are in
[docs/DECISIONS.md](docs/DECISIONS.md).

## The API

`/api/customers/{customerId}/…`. Six demo clients exist. `12345` is the brief's own and
opens by default. Two show edge states: `11223` joined recently, so there is nothing to
compare against, and `99887` has no budgets set.

| Endpoint | Query |
| --- | --- |
| `GET /profile` | |
| `GET /spending/summary` | `period` = `7d` `30d` `90d` `1y` |
| `GET /spending/categories` | `period`, or `startDate` and `endDate` (YYYY-MM-DD) |
| `GET /spending/trends` | `months` 1 to 24 |
| `GET /transactions` | `limit` 1 to 100, `offset`, `category`, `startDate`, `endDate`, `sortBy` |
| `GET /goals` | |
| `GET /filters` | |
| `GET /api/customers` | An addition for the demo picker only; see the Q&A |

Responses follow the brief's shapes. An invalid request is a `400` and an unknown
customer a `404`, both with a body that says what was wrong:

```json
{ "error": { "code": "INVALID_LIMIT", "message": "limit must be a whole number from 1 to 100", "details": { "limit": "500" } } }
```

Two environment variables help testing: `MOCK_NOW` pins the API's clock (the end-to-end
tests use `2026-10-11T12:00:00Z`), and `MOCK_LATENCY_MS` adds a delay so loading states can
be seen.

## The searchable picker

The header's "Viewing as" control started as a native `<select>`. With more than a
handful of clients a native select can't be searched, can show only one line per option,
and draws its arrow hard against the edge, differently in every browser. It is now
`components/ui/Combobox.jsx`, a reusable component:

- **Search as you type.** It matches the name, client number or account type, ignoring
  case and accents ("Zoe" finds "Zoë"), with the words in any order.
- **Two lines per option:** the name, then the account type and client number, so two
  clients with similar names can be told apart.
- **Keyboard first.** It opens with the arrow keys and the search box already focused.
  Up and down move the highlight, Home and End jump, Enter chooses, Escape closes. Focus
  returns to the button afterwards, so a keyboard user is never left stranded.
- **Screen readers.** It follows the WAI-ARIA combobox pattern: the highlighted option is
  announced as the keys move, and the number of results, including none, is announced
  as you type.

The remaining dropdowns (category, sort, page size) are short fixed lists, so they stay
native selects, which phones show as their own pickers. Their arrow is now an icon with
room around it rather than the browser's default.

## Questions a reviewer might ask

**Why Next.js, when the role asks for React?**
It is React: every screen is function components and hooks. Next is used for three things
only (routing, the production server, hosting the mock API), and only five imports are
Next-specific, so a move to Vite is a small change. See [How it is built](#how-it-is-built).

**Why is there no sign-in?**
The brief does not ask for one, and a pretend login with pretend passwords would prove
nothing. The "Viewing as" picker stands in for it. In production the client would be
whoever is signed in, decided on the server from the session; the client id would never
come from the URL or from a list, so nobody could read someone else's account by
changing a number.

**Why can't I add or edit a transaction?**
The brief's seven endpoints are all read-only and it asks to *display* spending. A bank
customer does not create transactions: card payments, debit orders and transfers do.
Writing them would mean inventing endpoints the spec does not have.

**Why build the API instead of returning the sample JSON?**
The samples cannot filter, and they disagree with each other (their category shares add
up to 99.9%). Generated, deterministic data makes every filter real, and lets the tests
check that the summary, the categories and the transactions agree to the cent.

**Why both TanStack Query and Redux?**
They hold different things. TanStack Query holds server data: caching, retries, refetching
and loading states. Redux holds the client's choices, and only those are persisted.
Keeping figures out of browser storage is deliberate: stale balances are worse than a
loading skeleton, and account data does not belong in localStorage.

**Why are amounts in cents?**
Floating-point rands drift (`0.1 + 0.2 !== 0.3`). Everything is added up in whole cents
and converted only at the edge.

**Why Victory for the charts?**
It is React-first (charts are components, composed like the rest of the UI), renders SVG,
and is easy to theme to the Capitec palette. The charts are hidden from screen readers
because the same figures are always on screen as text: the list beside the donut, and the
trend's table view.

**How is it tested?**
Three layers: the API's rules in plain unit tests; components and sections rendered
against the real API logic with Testing Library; and Playwright in a real browser on
desktop and phone, including axe accessibility scans. The Docker image will not build if
lint or the unit tests fail, and CI runs everything on every push.

**How does it behave on a slow or failing network?**
Each section has its own loading skeleton, error message and "Try again" button, so a
failing endpoint breaks one card, not the page. Failed requests are retried twice, but a
`4xx` is not, since retrying a bad request only delays the message. Set
`MOCK_LATENCY_MS=1500` to see the loading states.

**Is it accessible?**
It is built to WCAG 2 AA and scanned with axe in the end-to-end tests. Specifically:
- every control works from the keyboard;
- status is always given in words as well as colour;
- the brief's pastel category colours are used as tints, never as text;
- "Hide amounts" hides figures from screen readers too, not only from view.

**What would you do with more time?**
- Sign-in, with the client taken from the session on the server.
- A nonce-based content security policy, to remove `'unsafe-inline'`.
- Prefetching the first view's data on the server, so there are no skeletons on first load.
- An error boundary per section.
- Error monitoring.

These are in [docs/DECISIONS.md](docs/DECISIONS.md).

---

The Capitec name and logo belong to Capitec Bank. They are used here only because this
is Capitec's own assessment.
