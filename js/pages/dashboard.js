/* ============================================================
   Page: Dashboard — Challenge 07 "An Actionable Dashboard"
   Role-aware (Challenge 05): clients see their own status +
   outstanding items; staff see a prioritized action queue driven
   by a real (if simple) scoring function over the mock dataset.
   ============================================================ */
(function (App) {
  const U = App.Util, D = App.Data;

  // ---------- Real prioritization logic over mock data ----------
  function scoreTask(task) {
    let score = 0;
    if (task.blocked) score += 45;
    if (task.urgencyDays <= 0) score += 40;
    else if (task.urgencyDays <= 3) score += 28;
    else if (task.urgencyDays <= 10) score += 14;
    else score += 2;
    score += { high: 18, medium: 9, low: 0 }[task.priority] || 0;
    return score;
  }

  function rankedTasks(scope, userId, isManager) {
    let tasks = D.tasks.slice();
    if (scope === "mine") {
      tasks = tasks.filter(t => {
        if (t.assigneeId === userId) return true;
        if (isManager) { const r = D.returns.find(x => x.id === t.returnId); return r && r.reviewerId === userId; }
        return false;
      });
    }
    return tasks.map(t => ({ ...t, score: scoreTask(t) })).sort((a, b) => b.score - a.score);
  }

  function taskRow(t) {
    const due = U.dueLabel(t.dueDate);
    return `
      <tr class="clickable-row" data-action="go" data-hash="#/returns/${t.returnId}">
        <td>
          <div style="font-weight:600">${U.esc(t.type)}</div>
          <div class="tiny muted">${U.esc(t.clientName)}</div>
        </td>
        <td>${t.blocked ? `<span class="badge tone-red">${U.icon("flag")} Blocked</span>` : `<span class="badge tone-slate">Open</span>`}</td>
        <td><span class="badge tone-${due.tone}">${U.esc(due.text)}</span></td>
        <td><span class="priority-${t.priority}" style="font-weight:700;text-transform:capitalize">${t.priority}</span></td>
        <td style="text-align:right">
          <button class="btn btn-secondary btn-sm" data-action="go" data-hash="#/returns/${t.returnId}" onclick="event.stopPropagation()">Open</button>
          <button class="btn btn-ghost btn-sm" data-action="complete-task" data-task="${t.id}" onclick="event.stopPropagation()">Mark done</button>
        </td>
      </tr>
    `;
  }

  function staffDashboard(user, roleCtx) {
    const isManager = roleCtx === "reviewer" || roleCtx === "admin";
    const defaultScope = roleCtx === "admin" ? "team" : "mine";
    const scope = (App.State.state.ui && App.State.state.ui.dashboardScope) || defaultScope;
    const effectiveScope = isManager ? scope : "mine";
    const ranked = rankedTasks(effectiveScope, user.id, isManager);
    const top = ranked.slice(0, 8);

    const myReturns = D.returns.filter(r => r.preparerId === user.id || (isManager && r.reviewerId === user.id));
    const blockedCount = myReturns.filter(r => r.blocked).length;
    const dueThisWeek = myReturns.filter(r => U.daysUntil(r.dueDate) <= 7 && U.daysUntil(r.dueDate) >= 0).length;
    const totalOpen = myReturns.filter(r => r.status !== "accepted").length;

    return `
      <div class="row between mb-8" style="align-items:flex-start">
        <div>
          <div class="h1">Good morning, ${U.esc(user.name.split(" ")[0])}</div>
          <div class="muted mt-8">Here's what actually needs your attention right now — ranked, not just listed.</div>
        </div>
        ${isManager ? `
          <div class="tabs" style="border:1px solid var(--ink-200);border-radius:999px;padding:3px;border-bottom:1px solid var(--ink-200)">
            <button class="tab-btn ${effectiveScope === "mine" ? "active" : ""}" style="border-radius:999px" data-action="set-dashboard-scope" data-scope="mine">My Queue</button>
            <button class="tab-btn ${effectiveScope === "team" ? "active" : ""}" style="border-radius:999px" data-action="set-dashboard-scope" data-scope="team">Team Queue</button>
          </div>
        ` : ""}
      </div>

      <div class="grid-3 mt-24 mb-24">
        <div class="card card-pad">
          <div class="tiny muted">Open returns${effectiveScope === "team" ? " · team" : ""}</div>
          <div class="h1 mt-8">${effectiveScope === "team" ? D.returns.filter(r=>r.status!=="accepted").length : totalOpen}</div>
        </div>
        <div class="card card-pad">
          <div class="tiny muted">Blocked — waiting on someone</div>
          <div class="h1 mt-8" style="color:var(--red-600)">${effectiveScope === "team" ? D.returns.filter(r=>r.blocked).length : blockedCount}</div>
        </div>
        <div class="card card-pad">
          <div class="tiny muted">Due within 7 days</div>
          <div class="h1 mt-8" style="color:var(--amber-600)">${effectiveScope === "team" ? D.returns.filter(r=>U.daysUntil(r.dueDate)<=7 && U.daysUntil(r.dueDate)>=0).length : dueThisWeek}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="h3">What should I work on right now?</div>
          <span class="tiny muted">Ranked by urgency, blocking status, and priority — ${top.length} of ${ranked.length}</span>
        </div>
        <table class="tbl">
          <thead><tr><th>Task</th><th>Status</th><th>Due</th><th>Priority</th><th></th></tr></thead>
          <tbody>${top.length ? top.map(taskRow).join("") : `<tr><td colspan="5" class="empty-state">Nothing urgent — nice work.</td></tr>`}</tbody>
        </table>
      </div>

      <div class="card mt-24">
        <div class="card-head"><div class="h3">All returns in ${effectiveScope === "team" ? "the firm" : "your queue"}</div>
          <a class="link-btn small" data-action="go" data-hash="#/returns">View full list ${U.icon("chevronRight")}</a>
        </div>
        <table class="tbl">
          <thead><tr><th>Client</th><th>Status</th><th>Due</th><th></th></tr></thead>
          <tbody>
            ${(effectiveScope === "team" ? D.returns : myReturns).slice(0, 6).map(r => `
              <tr class="clickable-row" data-action="go" data-hash="#/returns/${r.id}">
                <td style="font-weight:600">${U.esc(r.clientName)}</td>
                <td>${U.statusBadge(r.status, "sm")} ${r.blocked ? `<span class="badge tone-red">${U.icon("flag")}</span>` : ""}</td>
                <td><span class="small">${U.dueLabel(r.dueDate).text}</span></td>
                <td style="text-align:right"><span class="link-btn small">Open ${U.icon("chevronRight")}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function clientDashboard(user) {
    const ret = D.returns.find(r => r.id === (user.returnIds ? user.returnIds[0] : user.personalReturnId));
    if (!ret) return `<div class="empty-state">No return found for this account yet.</div>`;
    const openThreads = D.threads.filter(t => t.returnId === ret.id && t.status !== "resolved" && !t.messages.some(m => m.internal && false));
    const s = D.getStatus(ret.status);

    return `
      <div class="h1 mb-8">Welcome back, ${U.esc(user.name.split(" ")[0])}</div>
      <div class="muted mb-24">Here's where your 2025 return stands.</div>

      <div class="card mb-24">
        <div class="card-pad">
          <div class="row between mb-12">
            <div class="h2">${U.esc(ret.entity)} — ${ret.year}</div>
            ${U.statusBadge(ret.status)}
          </div>
          ${App.Components.pipelineViz(ret.status)}
          <div class="row between mt-12">
            <span class="tiny muted">Prepared by ${U.esc(D.getUser(ret.preparerId).name)}</span>
            <span class="tiny muted">${U.dueLabel(ret.dueDate).text}</span>
          </div>
          ${ret.blocked ? `
            <div class="row gap-10 mt-16" style="background:var(--amber-100);padding:10px 14px;border-radius:8px">
              <span>${U.icon("warn")}</span>
              <span class="small">${U.esc(ret.blockedReason)}</span>
            </div>` : ""}
          <div class="row gap-8 mt-16">
            <button class="btn btn-primary" data-action="go" data-hash="#/returns/${ret.id}">View my return</button>
            <button class="btn btn-secondary" data-action="go" data-hash="#/messages/${ret.id}">Message Priya</button>
          </div>
        </div>
      </div>

      <div class="h3 mb-12">What's needed from you</div>
      ${openThreads.length ? `
        <div class="col gap-8 mb-24">
          ${openThreads.map(t => `
            <div class="card card-pad clickable" data-action="go" data-hash="#/messages/${ret.id}">
              <div class="row between">
                <div>
                  <div style="font-weight:600;font-size:13.5px">${U.esc(t.subject)}</div>
                  <div class="tiny muted mt-4">From ${U.esc(D.getUser(t.messages[t.messages.length-1].author)?.name || "Firm")}</div>
                </div>
                <span class="badge tone-amber">Needs reply</span>
              </div>
            </div>
          `).join("")}
        </div>
      ` : `<div class="card card-pad mb-24"><span class="badge tone-green">${U.icon("check")} Nothing outstanding</span></div>`}
    `;
  }

  App.Pages.dashboard = {
    title: "Dashboard",
    crumbs: () => [{ label: "Dashboard" }],
    render: () => {
      const S = App.State;
      const user = S.currentUser();
      const roleCtx = S.state.activeRoleContext;
      return roleCtx.startsWith("client") ? clientDashboard(user) : staffDashboard(user, roleCtx);
    },
  };
})(window.App = window.App || {});
