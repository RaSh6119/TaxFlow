# TaxFlow

A single working prototype covering all 10 challenges from the case study, built as one connected
product (not ten separate demos) — a client & CPA tax platform designed from scratch.

## Running it

No build step, no install. Open `index.html` directly in a browser, or serve the folder with any
static server, e.g.:

```
cd taxflow
python3 -m http.server 8000
# visit http://localhost:8000
```

It lands on **Challenge Map** (`#/challenges`) — an index page (not part of the "real" product)
that links straight into the primary screen for each of the 10 challenges. From there:

- **Enter as Preparer (Priya)** — the firm-side experience: dashboard, returns, documents, AI insights.
- **Enter as New Client (Maria)** — the first-time client onboarding flow (Challenge 03).
- The **account switcher** (top right, on every screen) swaps between all 6 seeded users/roles at any time.

## Why plain JS instead of React/Vite

This was built inside a sandboxed environment with no package registry or CDN access (npm, unpkg,
jsdelivr were all blocked), so a real Vite/React toolchain wasn't possible. Everything is hand-rolled
vanilla JS/CSS with the same architecture you'd expect from a small SPA — a hash router, a central
mock-data store, delegated event handling, and reusable render "components" (`js/components.js`) — just
without a build step or virtual DOM. It's a deliberate substitution, not a shortcut: every interaction
described below is genuinely wired up, not a static mock.

## Where each challenge lives

| # | Challenge | Primary screen | Notes |
|---|---|---|---|
| 01 | Source Document Traceability | `#/returns/r_maria/review` | Click any field → right panel shows the source doc page (highlighted region), the raw extracted value, the calculation applied, and a step-by-step trail. |
| 02 | Client & CPA Collaboration | `#/messages` | Threads tied to a document or issue; internal notes (amber, dashed) vs. client-visible messages; thread status shows who owns the next reply. |
| 03 | Where to Start | `#/onboarding` | Maria's first login — one large "next step" card, a deferred checklist, nothing else competing for attention. |
| 04 | Getting Lost in the App | everywhere | Breadcrumbs in the topbar, a "Linked items" panel on the return overview connecting docs/threads/AI flags, and a "You were working on…" banner that appears when you leave a return mid-task and can jump you back in. |
| 05 | Role-Aware Experiences | `#/roles` + account switcher | Six roles, one shell; permission matrix; the Priya Nair account demonstrates a firm employee who is also a client (switch "Working as" in her account menu). |
| 06 | Return Status & Progress | `#/returns` | One status model (`js/data.js → D.statuses`) drives every badge and pipeline bar in the app — client and staff see the same label, staff additionally see the blocking reason. |
| 07 | An Actionable Dashboard | `#/dashboard` (as Priya/Tom) | A real scoring function (`scoreTask` in `js/pages/dashboard.js`) ranks tasks by urgency + blocked status + priority. Managers (reviewer/admin) get a My Queue / Team Queue toggle. |
| 08 | Clickable vs. Editable | `#/design-system` | The legend, plus the same chips/underline/lock system reused live in Return Review, Documents, and Messages. |
| 09 | Complexity Made Navigable | `#/documents` | ~270 fabricated documents across 23 returns. Search, folder/status filters, group-by-client, and a "load more" pattern instead of rendering everything at once. |
| 10 | Trustworthy AI | `#/ai-insights` + the AI panel in Return Review | What the AI did, why, its evidence (linked to the actual source doc), stated uncertainty, a recommended action, and Accept / Correct / Dismiss controls. |

## What's real vs. simulated

**Real (genuinely wired up):**
- All navigation, routing (hash-based, so every screen is deep-linkable and shareable), and breadcrumbs.
- Role switching and the resulting nav/permission/dashboard changes.
- Search, filtering, grouping, and progressive loading on the document library (works against the full
  in-memory dataset, not a fake static list).
- The dashboard's prioritization score (a real function, not a hardcoded ranking).
- Editing a field, accepting/correcting/dismissing an AI flag, resolving a message thread, completing a
  task, finishing onboarding — all mutate the shared in-memory store and re-render immediately.
- The status pipeline visualization is computed from `D.statuses[].step`, not hand-placed per return.

**Simulated (fabricated, stands in for a real backend):**
- All returns, documents, extracted field values, source-document regions, confidence scores, AI
  reasoning text, and messages live in `js/data.js` — there's no OCR, no document parsing, and no model
  call. Confidence scores and "why the AI did this" text are authored to be plausible, not computed.
- The document "preview" is a generic fake page with a highlighted region — not a real rendered PDF.
- Nothing persists between page reloads (in-memory store only); refreshing the browser resets all edits.
- Auth/login is a dropdown account switcher, not a real authentication system.

## A few decisions worth explaining

- **One app, not ten demos.** The challenges overlap by design (traceability needs the affordance
  system; the AI panel needs traceability; navigation threads through everything), so building them as
  a single connected product was truer to the brief than ten isolated screens.
- **Status is a flag-based model, not a bigger status list.** "Blocked" is a boolean + reason on the
  return, separate from its pipeline stage — so "Needs Your Input" (a stage) and "blocked because the
  client hasn't replied" (a state) don't get conflated into a combinatorial explosion of status strings.
- **The Challenge Map landing page is a deliberate exception** to "just build the product" — with ten
  independent challenges being graded, a direct index was more useful to a reviewer than making them
  hunt through client vs. staff logins to find each one.
