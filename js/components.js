/* ============================================================
   TaxFlow — Shared UI Components (Challenges 04, 05, 06, 08, 10)
   Render functions return HTML strings; interactivity is wired
   via data-action delegation in app.js.
   ============================================================ */
(function (App) {
  const C = {};
  const U = App.Util;
  App.Pages = App.Pages || {};

  // ---------- Sidebar navigation, adapts per active role (Challenge 05) ----------
  C.navForRole = (roleId, user) => {
    const myReturnId = (user && ((user.returnIds && user.returnIds[0]) || user.personalReturnId)) || "r_maria";
    const client = [
      { hash: "#/onboarding", label: "Welcome", icon: "onboarding", route: "onboarding" },
      { hash: "#/dashboard", label: "Dashboard", icon: "dashboard", route: "dashboard" },
      { hash: `#/returns/${myReturnId}`, label: "My Return", icon: "returns", route: "returnDetail" },
      { hash: "#/documents", label: "My Documents", icon: "documents", route: "documents" },
      { hash: "#/messages", label: "Messages", icon: "messages", route: "messages" },
    ];
    const staff = [
      { hash: "#/dashboard", label: "Dashboard", icon: "dashboard", route: "dashboard" },
      { hash: "#/returns", label: "Returns", icon: "returns", route: "returns" },
      { hash: "#/documents", label: "Document Library", icon: "documents", route: "documents" },
      { hash: "#/messages", label: "Messages", icon: "messages", route: "messages" },
      { hash: "#/ai-insights", label: "AI Insights", icon: "ai", route: "aiInsights" },
    ];
    if (roleId === "admin") staff.push({ hash: "#/roles", label: "Roles & Access", icon: "roles", route: "roles" });
    return roleId.startsWith("client") ? client : staff;
  };

  // ---------- Topbar / Sidebar shell ----------
  C.shell = (routeCtx, contentHtml) => {
    const S = App.State, D = App.Data;
    const user = S.currentUser();
    const roleCtx = S.state.activeRoleContext;
    const nav = C.navForRole(roleCtx, user);
    const hasDualRole = !!user.extraRole && user.extraRole !== user.role;

    return `
      <div class="app-shell">
        ${C.sidebar(user, roleCtx, nav, routeCtx)}
        <div class="main-col">
          ${C.topbar(routeCtx, user, roleCtx, hasDualRole)}
          ${C.backBanner(routeCtx)}
          <div id="page-content-inner" class="page-content ${routeCtx.wide ? "wide" : ""}">${contentHtml}</div>
        </div>
      </div>
      <div class="toast-wrap">${S.state.toasts.map(t => `<div class="toast">${U.esc(t.msg)}</div>`).join("")}</div>
      ${C.modal()}
    `;
  };

  C.sidebar = (user, roleCtx, nav, routeCtx) => `
    <nav class="sidebar">
      <div class="sidebar-brand">
        <span class="mark">TF</span>
        <span>TaxFlow</span>
      </div>
      <div class="sidebar-nav">
        <div class="sidebar-section-label">Navigate</div>
        <ul>
          ${nav.map(item => `
            <li>
              <a class="nav-item ${routeCtx.name === item.route ? "active" : ""}" data-action="go" data-hash="${item.hash}">
                <span class="ico">${U.icon(item.icon)}</span>
                <span>${U.esc(item.label)}</span>
                ${item.route === "dashboard" && roleCtx.startsWith("client") ? "" : ""}
              </a>
            </li>`).join("")}
        </ul>
        <div class="sidebar-section-label">Case Study</div>
        <ul>
          <li><a class="nav-item ${routeCtx.name === "challenges" ? "active" : ""}" data-action="go" data-hash="#/challenges">
            <span class="ico">${U.icon("map")}</span><span>Challenge Map</span>
          </a></li>
          <li><a class="nav-item ${routeCtx.name === "designSystem" ? "active" : ""}" data-action="go" data-hash="#/design-system">
            <span class="ico">${U.icon("design")}</span><span>Design System</span>
          </a></li>
        </ul>
      </div>
      <div class="sidebar-foot">Prototype for case study. </div>
    </nav>
  `;

  C.topbar = (routeCtx, user, roleCtx, hasDualRole) => `
    <header class="topbar">
      ${C.breadcrumbs(routeCtx)}
      <button class="icon-btn" data-action="go" data-hash="#/messages" title="Messages">${U.icon("messages")}</button>
      <button class="icon-btn" data-action="noop" title="Notifications">${U.icon("bell")}</button>
      ${C.roleSwitcher(user, roleCtx, hasDualRole)}
    </header>
  `;

  // ---------- Breadcrumbs (Challenge 04 — orientation) ----------
  C.breadcrumbs = (routeCtx) => {
    const crumbs = routeCtx.crumbs || [{ label: routeCtx.title || "TaxFlow" }];
    return `
      <div class="breadcrumbs">
        ${crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return `${i > 0 ? `<span class="sep">/</span>` : ""}
            <span class="crumb ${isLast ? "current" : "crumb-link"}" ${!isLast && c.hash ? `data-action="go" data-hash="${c.hash}"` : ""}>${U.esc(c.label)}</span>`;
        }).join("")}
      </div>
    `;
  };

  // ---------- "Continue where you left off" banner (Challenge 04) ----------
  C.backBanner = (routeCtx) => {
    const S = App.State;
    const lw = S.state.lastWorkflow;
    const currentHash = location.hash || "#/challenges";
    if (!lw || lw.hash === currentHash) return "";
    if (lw.returnId && routeCtx && routeCtx.returnId === lw.returnId) return "";
    return `
      <div class="back-banner">
        <span>${U.icon("back")}</span>
        <span>You were working on <b>${U.esc(lw.label)}</b>.</span>
        <button class="link-btn" data-action="go" data-hash="${lw.hash}">Jump back in</button>
        <button class="icon-btn" style="width:24px;height:24px;margin-left:auto" data-action="dismiss-banner">${U.icon("close")}</button>
      </div>
    `;
  };

  // ---------- Role switcher dropdown (Challenge 05) ----------
  C.roleSwitcher = (user, roleCtx, hasDualRole) => {
    const S = App.State;
    const open = S.state.roleMenuOpen;
    const allUsers = App.Data.users;
    return `
      <div class="role-switch">
        <button class="role-switch-btn" data-action="toggle-role-menu">
          ${U.avatar(user.id)}
          <span class="col" style="align-items:flex-start;line-height:1.2">
            <span>${U.esc(user.name)}</span>
            <span class="tiny muted">${U.esc(U.roleLabel(roleCtx))}</span>
          </span>
          <span>${U.icon("chevronDown")}</span>
        </button>
        ${open ? `
          <div class="role-menu">
            <div class="role-menu-head">Switch account (demo only)</div>
            ${allUsers.map(u => `
              <div class="role-menu-item ${u.id === user.id ? "active" : ""}" data-action="switch-user" data-user="${u.id}">
                ${U.avatar(u.id)}
                <span class="meta"><b>${U.esc(u.name)}</b><span>${U.esc(U.roleLabel(u.role))}${u.title ? " · " + U.esc(u.title) : ""}</span></span>
              </div>`).join("")}
            ${hasDualRole ? `
              <div class="divider" style="margin:6px 0"></div>
              <div class="role-menu-head">This person also has a personal return</div>
              <div class="role-menu-item ${roleCtx === user.extraRole ? "active" : ""}" data-action="switch-role-context" data-role="${user.role}">
                ${U.avatar(user.id)}<span class="meta"><b>Working as: ${U.esc(U.roleLabel(user.role))}</b><span>Firm workspace</span></span>
                ${roleCtx === user.role ? `<span class="context-pill">Current</span>` : ""}
              </div>
              <div class="role-menu-item ${roleCtx === user.extraRole ? "active" : ""}" data-action="switch-role-context" data-role="${user.extraRole}">
                ${U.avatar(user.id)}<span class="meta"><b>Working as: ${U.esc(U.roleLabel(user.extraRole))}</b><span>Their own personal return</span></span>
                ${roleCtx === user.extraRole ? `<span class="context-pill">Current</span>` : ""}
              </div>` : ""}
          </div>
        ` : ""}
      </div>
    `;
  };

  // ---------- Field affordance row (Challenge 08, reused in Challenge 01/10) ----------
  // state: ai_extracted | verified | locked | needs_review | editable(plain)
  C.fieldChip = (state) => {
    const map = {
      ai_extracted: `<span class="field-chip chip-ai">${U.icon("sparkle")} AI-extracted</span>`,
      verified: `<span class="field-chip chip-verified">${U.icon("check")} Verified</span>`,
      locked: `<span class="field-chip chip-locked">${U.icon("lock")} Calculated</span>`,
      needs_review: `<span class="field-chip chip-review">${U.icon("warn")} Needs review</span>`,
    };
    return map[state] || "";
  };

  C.fieldRow = (field, opts) => {
    opts = opts || {};
    const clickable = !!opts.onClick;
    const cursorClass = field.editable ? "state-editable" : "";
    return `
      <div class="field-row ${clickable ? "state-clickable" : ""}" ${clickable ? `data-action="${opts.onClick}" data-field="${field.id}"` : ""}>
        <div>
          <div class="field-label">${U.esc(field.form)} · ${U.esc(field.line)}</div>
          <div class="field-value-line">
            <span class="field-value ${cursorClass}">${U.esc(field.value)}</span>
            ${!field.editable ? `<span class="lock-ico" title="Calculated field — not directly editable">${U.icon("lock")}</span>` : ""}
          </div>
        </div>
        <div class="col gap-6" style="align-items:flex-end">
          ${C.fieldChip(field.state)}
          ${opts.showConfidence !== false ? C.confidenceMini(field.confidence) : ""}
        </div>
      </div>
    `;
  };

  C.confidenceMini = (conf) => `
    <div class="row gap-6">
      <div class="confidence-bar"><div class="confidence-fill ${U.confidenceTone(conf)}" style="width:${conf}%"></div></div>
      <span class="tiny muted">${conf}%</span>
    </div>
  `;

  // ---------- AI panel (Challenge 10) ----------
  C.aiPanel = (ai, opts) => {
    opts = opts || {};
    if (!ai) return "";
    return `
      <div class="ai-panel">
        <div class="ai-panel-head">
          <span class="ai-spark">${U.icon("ai")}</span>
          <div class="grow">
            <div class="h3">${U.esc(ai.summary)}</div>
            <div class="tiny muted">Confidence ${ai.confidence}% · ${ai.status === "resolved" ? "Resolved" : "Needs attention"}</div>
          </div>
          ${C.confidenceMini(ai.confidence)}
        </div>
        <div class="card-body col gap-10">
          <div><div class="tiny muted mb-8" style="text-transform:uppercase;letter-spacing:.04em">Why the AI did this</div><div class="small">${U.esc(ai.why)}</div></div>
          <div><div class="tiny muted mb-8" style="text-transform:uppercase;letter-spacing:.04em">Evidence</div>
            <ul class="col gap-6">${ai.evidence.map(e => `<li class="small">📎 ${e.docId ? `<a class="link-btn" data-action="open-doc-modal" data-doc="${e.docId}">${U.esc(App.Data.documents.find(d=>d.id===e.docId)?.name || e.docId)}</a>` : ""} — ${U.esc(e.note)}</li>`).join("")}</ul>
          </div>
          <div><div class="tiny muted mb-8" style="text-transform:uppercase;letter-spacing:.04em">Uncertainty</div><div class="small">${U.esc(ai.uncertainty)}</div></div>
          <div class="row between" style="align-items:flex-start">
            <div><div class="tiny muted mb-8" style="text-transform:uppercase;letter-spacing:.04em">Recommended action</div><div class="small"><b>${U.esc(ai.recommendedAction)}</b></div></div>
          </div>
          ${ai.status !== "resolved" ? `
          <div class="row gap-8 mt-8">
            <button class="btn btn-primary btn-sm" data-action="ai-accept" data-field="${ai.fieldId}">Accept suggestion</button>
            <button class="btn btn-secondary btn-sm" data-action="ai-correct" data-field="${ai.fieldId}">Correct it</button>
            <button class="btn btn-ghost btn-sm" data-action="ai-dismiss" data-field="${ai.fieldId}">Dismiss</button>
          </div>` : `<div class="badge tone-green" style="align-self:flex-start">${U.icon("check")} Resolved by ${U.esc(App.Data.getUser("u_priya").name)}</div>`}
        </div>
      </div>
    `;
  };

  // ---------- Linked items panel (Challenge 04 — connected objects) ----------
  C.linkedPanel = (title, items) => `
    <div class="linked-panel card-pad">
      <div class="h3 mb-12">${U.esc(title)}</div>
      <div class="col gap-4">
        ${items.length ? items.map(it => `
          <a class="linked-item row gap-10" data-action="go" data-hash="${it.hash}">
            <span class="linked-ico" style="background:${it.bg};color:${it.fg}">${it.icon}</span>
            <span class="col" style="line-height:1.25">
              <span class="small" style="font-weight:600">${U.esc(it.title)}</span>
              <span class="tiny muted">${U.esc(it.sub)}</span>
            </span>
            <span class="tiny muted" style="margin-left:auto">${U.icon("chevronRight")}</span>
          </a>`).join("") : `<div class="tiny muted">Nothing linked yet.</div>`}
      </div>
    </div>
  `;

  // ---------- Status pipeline mini-visual (Challenge 06) ----------
  C.pipelineViz = (statusId) => {
    const steps = ["not_started","gathering_docs","in_preparation","in_review","ready_to_sign","filed","accepted"];
    const s = App.Data.getStatus(statusId);
    const curStep = s.id === "needs_input" ? 2 : s.step;
    return `
      <div class="pipeline">
        ${steps.map((_, i) => `<div class="seg ${i < curStep ? "done" : i === curStep ? "current" : ""}"></div>`).join("")}
      </div>
    `;
  };

  // ---------- Fake document page preview (used by traceability + modal) ----------
  C.docPageViz = (doc, region, opts) => {
    opts = opts || {};
    const lines = ["w80","w60","w40","w30","w60","w80","w40"];
    return `
      <div class="doc-page">
        <div class="fake-lines">
          ${lines.map(w => `<div class="fake-line ${w}"></div>`).join("")}
        </div>
        ${region ? `<div class="doc-highlight" style="left:${region.x}%;top:${region.y}%;width:${region.w}%;height:${region.h}%"></div>` : ""}
      </div>
      <div class="doc-caption">
        <span>${U.esc(doc ? doc.name : "Document")}${opts.page ? " · Page " + opts.page : ""}</span>
        <span>${doc ? doc.pages + " pg" : ""}</span>
      </div>
    `;
  };

  // ---------- Global modal (doc preview / field edit / AI correction) ----------
  C.modal = () => {
    const S = App.State;
    const m = S.state.modal;
    if (!m) return "";
    let body = "";
    if (m.type === "doc") {
      const doc = App.Data.documents.find(d => d.id === m.payload.docId);
      body = `
        <div class="row between mb-16">
          <div class="h3">${U.esc(doc ? doc.name : "Document")}</div>
          <button class="icon-btn" data-action="close-modal">${U.icon("close")}</button>
        </div>
        <div style="max-width:340px;margin:0 auto">${C.docPageViz(doc, m.payload.region, { page: m.payload.page })}</div>
        <div class="mt-16 row gap-8 between">
          <span class="tiny muted">${doc ? U.fmtDate(doc.uploadedAt) + " · " + doc.sizeKb + " KB" : ""}</span>
          ${m.payload.returnId ? `<button class="btn btn-secondary btn-sm" data-action="go" data-hash="#/returns/${m.payload.returnId}/review" data-close="1">Open in Return Review</button>` : ""}
        </div>
      `;
    } else if (m.type === "field-edit") {
      const f = m.payload.field;
      body = `
        <div class="row between mb-16">
          <div class="h3">Edit ${U.esc(f.line)}</div>
          <button class="icon-btn" data-action="close-modal">${U.icon("close")}</button>
        </div>
        <div class="small muted mb-12">This value was AI-extracted from ${f.sources[0]?.docId ? U.esc(App.Data.documents.find(d=>d.id===f.sources[0].docId)?.name) : "a source document"}. Editing it will mark the field as manually overridden.</div>
        <input class="input" style="width:100%" id="field-edit-input" value="${U.esc(f.value)}" />
        <div class="row gap-8 mt-16">
          <button class="btn btn-primary btn-sm" data-action="save-field-edit" data-field="${f.id}">Save override</button>
          <button class="btn btn-ghost btn-sm" data-action="close-modal">Cancel</button>
        </div>
      `;
    } else if (m.type === "info") {
      body = `
        <div class="row between mb-12">
          <div class="h3">${U.esc(m.payload.title)}</div>
          <button class="icon-btn" data-action="close-modal">${U.icon("close")}</button>
        </div>
        <div class="small">${m.payload.body}</div>
      `;
    }
    return `
      <div class="modal-overlay" data-action="close-modal-bg" style="position:fixed;inset:0;background:rgba(15,27,45,.45);display:flex;align-items:center;justify-content:center;z-index:80">
        <div class="card" style="width:440px;max-width:92vw;max-height:86vh;overflow:auto" data-action="stop">
          <div class="card-pad">${body}</div>
        </div>
      </div>
    `;
  };

  App.Components = C;
})(window.App = window.App || {});
