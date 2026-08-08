/* ============================================================
   Page: Challenge Map — landing page for this submission.
   Not part of the "real" product; a navigation aid for reviewers.
   ============================================================ */
(function (App) {
  const U = App.Util;

  const items = [
    { n: "01", title: "Source Document Traceability", desc: "Every field on the return links to its source doc, page, and calculation.", hash: "#/returns/r_maria/review", cta: "Open Return Review" },
    { n: "02", title: "Client & CPA Collaboration", desc: "Threaded messages tied to documents/issues, internal vs. client-visible.", hash: "#/messages/r_maria", cta: "Open Messages" },
    { n: "03", title: "Where to Start", desc: "A brand-new client's first 10 seconds in the product.", hash: "#/onboarding", cta: "Open Onboarding" },
    { n: "04", title: "Getting Lost in the App", desc: "Breadcrumbs, linked items, and a “jump back in” banner across the whole app.", hash: "#/returns/r_maria", cta: "Open Return Overview" },
    { n: "05", title: "Role-Aware Experiences", desc: "Six roles, one shell. Switch accounts from the top-right menu anywhere.", hash: "#/roles", cta: "Open Role Architecture" },
    { n: "06", title: "Return Status & Progress", desc: "One status model, plain-language for clients, detailed for staff.", hash: "#/returns", cta: "Open Returns List" },
    { n: "07", title: "An Actionable Dashboard", desc: "Prioritized “what to work on now” queue, not a report.", hash: "#/dashboard", cta: "Open Dashboard" },
    { n: "08", title: "Clickable vs. Editable", desc: "One visual language for AI-generated, verified, locked, and editable data.", hash: "#/design-system", cta: "Open Design System" },
    { n: "09", title: "Complexity Made Navigable", desc: "300+ mock documents, searchable and filterable without getting lost.", hash: "#/documents", cta: "Open Document Library" },
    { n: "10", title: "Trustworthy AI", desc: "What the AI did, why, its evidence, and how to correct it.", hash: "#/ai-insights", cta: "Open AI Insights" },
  ];

  App.Pages.challenges = {
    title: "Challenge Map",
    crumbs: () => [{ label: "Challenge Map" }],
    render: () => `
      <div class="mb-24">
        <div class="h1">TaxFlow</div>
        <div class="muted mt-8" style="max-width:640px">
          A working prototype for the AI Engineer case study: an AI-powered tax platform for
          a client &amp; CPA firm, built from scratch. Each card below opens the primary screen
          for one of the ten challenges — everything is one connected app, not ten separate demos.
        </div>
        <div class="row gap-8 mt-16">
          <button class="btn btn-primary" data-action="switch-user" data-user="u_priya" data-hash="#/dashboard">Enter as Preparer (Aditya)</button>
          <button class="btn btn-secondary" data-action="switch-user" data-user="u_maria" data-hash="#/onboarding">Enter as New Client (Rahul)</button>
        </div>
      </div>
      <div class="grid-2">
        ${items.map(it => `
          <div class="card clickable card-pad" data-action="go" data-hash="${it.hash}">
            <div class="row gap-10 mb-8">
              <span class="tiny muted mono">CH ${it.n}</span>
            </div>
            <div class="h3 mb-8">${U.esc(it.title)}</div>
            <div class="small muted mb-16">${U.esc(it.desc)}</div>
            <span class="link-btn small">${U.esc(it.cta)} ${U.icon("chevronRight")}</span>
          </div>
        `).join("")}
      </div>
      <div class="card card-pad mt-24">
        <div class="h3 mb-8">What's real vs. simulated</div>
        <div class="small muted">
          All data (returns, documents, AI extractions, confidence scores, messages) is hardcoded in <span class="kbd">js/data.js</span>.
          There is no backend, OCR, or model call — interactions (editing a field, resolving an AI flag, sending a message,
          filtering 300+ documents) are fully wired against that mock data and persist in memory for the session.
          See the README for the full breakdown.
        </div>
      </div>
    `,
  };
})(window.App = window.App || {});
