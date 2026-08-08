# TaxFlow

## What's genuinely wired up vs. simulated

**Real (genuinely wired up):**
1. All navigation, routing (hash based, so every screen is deep linkable and shareable), and breadcrumbs.
2. Role switching, including the nav, permission, and dashboard changes that come with it.
3. Search, filtering, grouping, and progressive loading on the document library. This runs against the full in memory dataset, not a fake static list.
4. The dashboard's prioritization score, a real scoring function rather than a hardcoded ranking.
5. Editing a field, accepting/correcting/dismissing an AI flag, resolving a message thread, completing a task, finishing onboarding. All of these mutate a shared in memory store and re-render immediately.
6. The status pipeline visualization, computed from the status model rather than hand placed per return.

**Simulated (fabricated, standing in for a real backend):**
1. All returns, documents, extracted field values, source document regions, confidence scores, AI reasoning text, and messages are authored data. There's no OCR, no document parsing, and no model call behind any of it. Confidence scores and the "why the AI did this" text were written to sound plausible, not computed.
2. The document "preview" is a generic fake page with a highlighted region, not a real rendered PDF.
3. Nothing persists between reloads since it's in memory only, so refreshing resets all edits.
4. Auth is a dropdown account switcher, not a real authentication system.

## A few decisions worth explaining

1. **One connected app, not ten separate demos.** The challenges overlap by design (traceability needs the same affordance system as the AI panel, navigation threads through every screen), so building one product felt truer to the brief than building ten isolated screens.
2. **Status is a flag based model, not a longer status list.** "Blocked" is a boolean plus a reason on the return, kept separate from its pipeline stage. That way a stage like "Needs Your Input" and a state like "blocked because the client hasn't replied" don't collapse into a combinatorial mess of status strings.
3. **Plain JS instead of React/Vite.** This was built without package registry or CDN access, so the SPA architecture (hash router, central store, delegated events, reusable render components) is hand rolled instead of framework backed. It's a deliberate substitution, not a shortcut. Every interaction listed above is genuinely wired up.
4. **The Challenge Map landing page is a deliberate exception** to "just build the product." With ten challenges being graded independently, a direct index seemed more useful to a reviewer than making them hunt through client vs. staff logins to find each one.
