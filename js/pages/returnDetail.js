/* ============================================================
   Page: Return Detail (Overview) — hub for Challenges 04 & 06
   Status/progress front and center, plus a "linked items" panel
   showing how documents/tasks/messages connect to this return.
   ============================================================ */
(function (App) {
  const U = App.Util, D = App.Data;

  function tabs(id, active) {
    const items = [
      { key: "overview", label: "Overview", hash: `#/returns/${id}` },
      { key: "review", label: "Return Review", hash: `#/returns/${id}/review` },
      { key: "documents", label: "Documents", hash: `#/returns/${id}/documents` },
      { key: "messages", label: "Messages", hash: `#/messages/${id}` },
    ];
    return `
      <div class="tabs mb-20">
        ${items.map(it => `<a class="tab-btn ${it.key===active?"active":""}" data-action="go" data-hash="${it.hash}">${it.label}</a>`).join("")}
      </div>
    `;
  }

  App.Pages.returnDetail = {
    title: "Return",
    crumbs: (p) => [{ label: "Returns", hash: "#/returns" }, { label: D.returns.find(r=>r.id===p.id)?.clientName || p.id }],
    render: (params) => {
      const ret = D.returns.find(r => r.id === params.id);
      if (!ret) return `<div class="empty-state">Return not found.</div>`;
      const roleCtx = App.State.state.activeRoleContext;
      const isClient = roleCtx.startsWith("client");
      const docs = D.documents.filter(d => d.returnId === ret.id);
      const threads = D.threads.filter(t => t.returnId === ret.id);
      const openThreads = threads.filter(t => t.status !== "resolved");
      const fields = D.fields.filter(f => f.returnId === ret.id);
      const needsReview = fields.filter(f => f.state === "needs_review");
      const tasks = D.tasks.filter(t => t.returnId === ret.id);

      const linkedItems = [
        ...docs.slice(0, 3).map(d => ({
          hash: `#/returns/${ret.id}/documents`, icon: "📄", bg: "var(--blue-100)", fg: "var(--blue-600)",
          title: d.name, sub: `${d.type} · uploaded ${U.fmtDate(d.uploadedAt)}`,
        })),
        ...openThreads.slice(0, 2).map(t => ({
          hash: `#/messages/${ret.id}`, icon: "💬", bg: "var(--amber-100)", fg: "var(--amber-600)",
          title: t.subject, sub: t.owner ? `Waiting on ${U.esc(D.getUser(t.owner)?.name || "client")}` : "Open thread",
        })),
        ...(needsReview.length ? [{
          hash: `#/returns/${ret.id}/review`, icon: "🤖", bg: "var(--violet-100)", fg: "var(--violet-600)",
          title: `${needsReview.length} field${needsReview.length>1?"s":""} flagged by AI`, sub: "Needs a human check before filing",
        }] : []),
      ];

      return `
        ${headerCard(ret, isClient)}
        ${tabs(ret.id, "overview")}
        <div class="two-pane">
          <div class="col gap-16">
            <div class="card card-pad">
              <div class="h3 mb-12">Snapshot</div>
              <div class="col gap-10">
                <div class="row between small"><span class="muted">Documents on file</span><b>${docs.length}</b></div>
                <div class="row between small"><span class="muted">Return line items</span><b>${fields.length || "—"}</b></div>
                <div class="row between small"><span class="muted">Flagged by AI</span><b style="color:${needsReview.length ? "var(--amber-600)":"inherit"}">${needsReview.length}</b></div>
                <div class="row between small"><span class="muted">Open conversations</span><b>${openThreads.length}</b></div>
                ${!isClient ? `<div class="row between small"><span class="muted">Preparer</span><b>${U.esc(D.getUser(ret.preparerId)?.name || "—")}</b></div>` : ""}
                ${!isClient && ret.reviewerId ? `<div class="row between small"><span class="muted">Reviewer</span><b>${U.esc(D.getUser(ret.reviewerId)?.name || "—")}</b></div>` : ""}
              </div>
            </div>
          </div>
          <div class="col gap-16">
            ${App.Components.linkedPanel("Connected to this return", linkedItems)}
            ${tasks.length ? `
              <div class="card card-pad">
                <div class="h3 mb-12">Open tasks</div>
                <div class="col gap-8">
                  ${tasks.map(t => `
                    <div class="row between small">
                      <span>${U.esc(t.type)}</span>
                      <button class="btn btn-ghost btn-sm" data-action="complete-task" data-task="${t.id}">Mark done</button>
                    </div>
                  `).join("")}
                </div>
              </div>
            ` : ""}
          </div>
        </div>
      `;
    },
  };

  function headerCard(ret, isClient) {
    return `
      <div class="card mb-8">
        <div class="card-pad">
          <div class="row between" style="align-items:flex-start">
            <div>
              <div class="h1">${U.esc(ret.clientName)}</div>
              <div class="muted mt-4">${U.esc(ret.entity)} · Tax Year ${ret.year}</div>
            </div>
            ${U.statusBadge(ret.status)}
          </div>
          <div class="mt-16">${App.Components.pipelineViz(ret.status)}</div>
          <div class="row between mt-12">
            <span class="tiny muted">Owner of next action: <b>${ret.blocked || D.getStatus(ret.status).owner==="client" ? "Client" : D.getStatus(ret.status).owner==="firm" ? "Firm" : "No one — complete"}</b></span>
            <span class="tiny muted">${U.dueLabel(ret.dueDate).text}</span>
          </div>
          ${ret.blocked ? `
            <div class="row gap-10 mt-16" style="background:var(--red-100);padding:10px 14px;border-radius:8px">
              <span>${U.icon("flag")}</span>
              <span class="small"><b>Blocked:</b> ${U.esc(ret.blockedReason)}</span>
            </div>` : ""}
        </div>
      </div>
    `;
  }
})(window.App = window.App || {});
