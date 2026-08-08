(function (App) {
  const U = App.Util, D = App.Data;

  function flagCard(f) {
    const ret = D.returns.find(r => r.id === f.returnId);
    const doc = f.evidenceDoc ? D.documents.find(d => d.id === f.evidenceDoc) : null;
    return `
      <div class="ai-panel mb-16">
        <div class="ai-panel-head">
          <span class="ai-spark">${U.icon("ai")}</span>
          <div class="grow">
            <div class="row gap-8">
              <a class="h3" data-action="go" data-hash="#/returns/${f.returnId}" style="cursor:pointer">${U.esc(ret?.clientName || f.returnId)}</a>
              ${f.status === "resolved" ? `<span class="badge tone-green">${U.icon("check")} Resolved</span>` : `<span class="badge tone-amber">${U.icon("warn")} Open</span>`}
            </div>
            <div class="small mt-4">${U.esc(f.summary)}</div>
          </div>
          ${App.Components.confidenceMini(f.confidence)}
        </div>
        <div class="card-body col gap-10">
          <div><div class="tiny muted mb-6" style="text-transform:uppercase;letter-spacing:.04em">Why the AI flagged this</div><div class="small">${U.esc(f.why)}</div></div>
          ${doc ? `<div><div class="tiny muted mb-6" style="text-transform:uppercase;letter-spacing:.04em">Evidence</div><div class="small">📎 <a class="link-btn" data-action="open-doc-modal" data-doc="${doc.id}">${U.esc(doc.name)}</a></div></div>` : ""}
          <div><div class="tiny muted mb-6" style="text-transform:uppercase;letter-spacing:.04em">Uncertainty</div><div class="small">${U.esc(f.uncertainty)}</div></div>
          <div><div class="tiny muted mb-6" style="text-transform:uppercase;letter-spacing:.04em">Recommended action</div><div class="small"><b>${U.esc(f.recommendedAction)}</b></div></div>
          ${f.status !== "resolved" ? `
            <div class="row gap-8 mt-8">
              <button class="btn btn-primary btn-sm" data-action="resolve-flag" data-flag="${f.id}">Mark resolved</button>
              <button class="btn btn-secondary btn-sm" data-action="go" data-hash="${f.fieldId ? "#/returns/" + f.returnId + "/review" : "#/returns/" + f.returnId}">Investigate</button>
            </div>` : ""}
        </div>
      </div>
    `;
  }

  App.Pages.aiInsights = {
    title: "AI Insights",
    wide: true,
    crumbs: () => [{ label: "AI Insights" }],
    render: () => {
      const flags = D.aiFlags.slice().sort((a,b) => (a.status==="resolved"?1:0) - (b.status==="resolved"?1:0) || b.confidence - a.confidence);
      const open = flags.filter(f => f.status !== "resolved");
      const resolved = flags.filter(f => f.status === "resolved");

      return `
        <div class="h1 mb-8">AI Insights</div>
        <div class="muted mb-24" style="max-width:680px">
          Every place the model wasn't fully confident, surfaced in one queue — with its reasoning, its evidence,
          and a clear next step. Nothing here is a black box: each card explains itself the same way the per-field
          panel does inside Return Review.
        </div>
        <div class="grid-3 mb-24">
          <div class="card card-pad"><div class="tiny muted">Open flags</div><div class="h1 mt-8" style="color:var(--amber-600)">${open.length}</div></div>
          <div class="card card-pad"><div class="tiny muted">Resolved this week</div><div class="h1 mt-8" style="color:var(--green-600)">${resolved.length}</div></div>
          <div class="card card-pad"><div class="tiny muted">Avg. confidence, open items</div><div class="h1 mt-8">${Math.round(open.reduce((s,f)=>s+f.confidence,0)/(open.length||1))}%</div></div>
        </div>
        <div class="h3 mb-12">Needs a look (${open.length})</div>
        ${open.map(flagCard).join("") || `<div class="empty-state card card-pad">Nothing open — the AI hasn't flagged anything new.</div>`}
        <div class="h3 mb-12 mt-24">Resolved (${resolved.length})</div>
        ${resolved.map(flagCard).join("")}
      `;
    },
  };
})(window.App = window.App || {});
