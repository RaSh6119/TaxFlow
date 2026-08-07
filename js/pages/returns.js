/* ============================================================
   Page: Returns List — Challenge 06 "Return Status & Progress"
   One shared status model for every audience; staff get the full
   roster with filters, clients are scoped to their own return(s).
   ============================================================ */
(function (App) {
  const U = App.Util, D = App.Data;
  let searchText = "";
  let statusFilter = "all";

  function rowsHtml(list) {
    if (!list.length) return `<tr><td colspan="6" class="empty-state">No returns match your filters.</td></tr>`;
    return list.map(r => `
      <tr class="clickable-row" data-action="go" data-hash="#/returns/${r.id}">
        <td>
          <div style="font-weight:600">${U.esc(r.clientName)}</div>
          <div class="tiny muted">${U.esc(r.entity)}</div>
        </td>
        <td style="min-width:170px">
          ${U.statusBadge(r.status)}
          ${r.blocked ? `<div class="tiny mt-4" style="color:var(--red-600)">${U.icon("flag")} ${U.esc(r.blockedReason || "Blocked")}</div>` : ""}
        </td>
        <td style="min-width:140px">${App.Components.pipelineViz(r.status)}</td>
        <td><span class="small">${U.esc(D.getUser(r.preparerId)?.name || "—")}</span></td>
        <td><span class="badge tone-${U.dueLabel(r.dueDate).tone}">${U.esc(U.dueLabel(r.dueDate).text)}</span></td>
        <td style="text-align:right"><span class="link-btn small">Open ${U.icon("chevronRight")}</span></td>
      </tr>
    `).join("");
  }

  function filterList(all) {
    return all.filter(r => {
      const matchesSearch = !searchText || r.clientName.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = statusFilter === "all" || (statusFilter === "blocked" ? r.blocked : r.status === statusFilter);
      return matchesSearch && matchesStatus;
    }).sort((a, b) => U.daysUntil(a.dueDate) - U.daysUntil(b.dueDate));
  }

  App.Pages.returns = {
    title: "Returns",
    crumbs: () => [{ label: "Returns" }],
    wide: true,
    render: () => {
      const S = App.State;
      const roleCtx = S.state.activeRoleContext;
      const user = S.currentUser();
      const isClient = roleCtx.startsWith("client");
      const all = isClient
        ? D.returns.filter(r => (user.returnIds || []).includes(r.id) || r.id === user.personalReturnId)
        : D.returns;
      const list = filterList(all);

      return `
        <div class="row between mb-16">
          <div class="h1">Returns</div>
          <span class="small muted">${all.length} total</span>
        </div>

        <div class="row gap-12 mb-16 wrap">
          <div class="search-box" style="max-width:280px">
            <span>${U.icon("search")}</span>
            <input id="returns-search" placeholder="Search by client name…" value="${U.esc(searchText)}" />
          </div>
          <div class="row gap-6 wrap" id="status-filters">
            ${["all","blocked",...D.statuses.map(s=>s.id)].map(id => {
              const label = id === "all" ? "All" : id === "blocked" ? "Blocked" : D.getStatus(id).label;
              return `<button class="btn btn-sm ${statusFilter===id ? "btn-primary" : "btn-secondary"}" data-filter="${id}">${U.esc(label)}</button>`;
            }).join("")}
          </div>
        </div>

        <div class="card">
          <table class="tbl">
            <thead><tr><th>Client</th><th>Status</th><th>Progress</th><th>Preparer</th><th>Due</th><th></th></tr></thead>
            <tbody id="returns-tbody">${rowsHtml(list)}</tbody>
          </table>
        </div>
      `;
    },
    mount: (container) => {
      const roleCtx = App.State.state.activeRoleContext;
      const user = App.State.currentUser();
      const isClient = roleCtx.startsWith("client");
      const all = isClient
        ? D.returns.filter(r => (user.returnIds || []).includes(r.id) || r.id === user.personalReturnId)
        : D.returns;

      const tbody = container.querySelector("#returns-tbody");
      const input = container.querySelector("#returns-search");
      const filterBtns = container.querySelectorAll("#status-filters button");

      function refresh() { tbody.innerHTML = rowsHtml(filterList(all)); wireRowClicks(); }
      function wireRowClicks() {
        // rows use data-action=go which is handled by the global delegated listener already.
      }

      input.addEventListener("input", (e) => { searchText = e.target.value; refresh(); });
      filterBtns.forEach(btn => btn.addEventListener("click", () => {
        statusFilter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove("btn-primary"));
        filterBtns.forEach(b => b.classList.add("btn-secondary"));
        btn.classList.remove("btn-secondary");
        btn.classList.add("btn-primary");
        refresh();
      }));
    },
  };
})(window.App = window.App || {});
