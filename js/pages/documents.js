(function (App) {
  const U = App.Util, D = App.Data;

  let search = "";
  let folderFilter = "all";
  let statusFilter = "all";
  let groupByReturn = true;
  let visibleCount = 30;

  function accessibleReturnIds(user, roleCtx) {
    if (roleCtx.startsWith("client")) return user.returnIds || [user.personalReturnId];
    if (roleCtx === "admin") return D.returns.map(r => r.id);
    return user.assignedReturnIds || D.returns.filter(r => r.preparerId === user.id || r.reviewerId === user.id).map(r => r.id);
  }

  function statusChip(status) {
    const map = {
      extracted: `<span class="field-chip chip-ai">${U.icon("sparkle")} Extracted</span>`,
      needs_review: `<span class="field-chip chip-review">${U.icon("warn")} Needs review</span>`,
      reviewed: `<span class="field-chip chip-verified">${U.icon("check")} Reviewed</span>`,
    };
    return map[status] || "";
  }

  function filtered(docs) {
    return docs.filter(d => {
      const s = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase());
      const f = folderFilter === "all" || d.folder === folderFilter;
      const st = statusFilter === "all" || d.status === statusFilter;
      return s && f && st;
    });
  }

  function docRow(d, showClient) {
    const client = showClient ? D.returns.find(r => r.id === d.returnId)?.clientName : null;
    return `
      <tr class="clickable-row" data-action="open-doc-modal" data-doc="${d.id}">
        <td>
          <div style="font-weight:600">${U.esc(d.name)}</div>
          <div class="tiny muted">${U.esc(d.type)} · ${d.pages} pg · ${d.sizeKb} KB</div>
        </td>
        ${showClient ? `<td class="small">${U.esc(client || "—")}</td>` : ""}
        <td><span class="badge tone-slate">${U.esc(d.folder)}</span></td>
        <td>${statusChip(d.status)}</td>
        <td class="small">${U.fmtDate(d.uploadedAt)}</td>
        <td class="small" style="text-transform:capitalize">${U.esc(d.uploadedBy)}</td>
      </tr>
    `;
  }

  function tableHtml(list, showClient) {
    const slice = list.slice(0, visibleCount);
    return `
      <table class="tbl">
        <thead><tr><th>Document</th>${showClient ? "<th>Client</th>" : ""}<th>Folder</th><th>Status</th><th>Uploaded</th><th>By</th></tr></thead>
        <tbody id="doc-tbody">${slice.length ? slice.map(d => docRow(d, showClient)).join("") : `<tr><td colspan="${showClient?6:5}" class="empty-state">No documents match your filters.</td></tr>`}</tbody>
      </table>
      ${list.length > visibleCount ? `<div class="row" style="justify-content:center;padding:14px"><button class="btn btn-secondary btn-sm" id="load-more-btn">Load ${Math.min(30, list.length - visibleCount)} more (${list.length - visibleCount} remaining)</button></div>` : ""}
    `;
  }

  function groupedHtml(list, scopedToReturn) {
    if (scopedToReturn) return tableHtml(list, false);
    if (!groupByReturn) return tableHtml(list, true);
    const byReturn = {};
    list.forEach(d => { (byReturn[d.returnId] = byReturn[d.returnId] || []).push(d); });
    const ids = Object.keys(byReturn).sort((a, b) => byReturn[b].length - byReturn[a].length);
    return ids.map(rid => {
      const client = D.returns.find(r => r.id === rid)?.clientName || rid;
      const docs = byReturn[rid];
      return `
        <div class="card mb-16">
          <div class="card-head">
            <a class="h3" data-action="go" data-hash="#/returns/${rid}/documents" style="cursor:pointer">${U.esc(client)}</a>
            <span class="tiny muted">${docs.length} documents</span>
          </div>
          <table class="tbl">
            <thead><tr><th>Document</th><th>Folder</th><th>Status</th><th>Uploaded</th><th>By</th></tr></thead>
            <tbody>${docs.slice(0, 6).map(d => docRow(d, false)).join("")}</tbody>
          </table>
          ${docs.length > 6 ? `<div class="card-body"><a class="link-btn small" data-action="go" data-hash="#/returns/${rid}/documents">View all ${docs.length} →</a></div>` : ""}
        </div>
      `;
    }).join("");
  }

  function toolbarHtml(folders, scopedToReturn) {
    return `
      <div class="row gap-12 mb-16 wrap">
        <div class="search-box" style="max-width:300px">
          <span>${U.icon("search")}</span>
          <input id="doc-search" placeholder="Search documents…" value="${U.esc(search)}" />
        </div>
        <select class="select" id="folder-filter">
          <option value="all">All folders</option>
          ${folders.map(f => `<option value="${U.esc(f)}" ${folderFilter===f?"selected":""}>${U.esc(f)}</option>`).join("")}
        </select>
        <select class="select" id="status-filter">
          <option value="all">Any status</option>
          <option value="extracted" ${statusFilter==="extracted"?"selected":""}>Extracted</option>
          <option value="needs_review" ${statusFilter==="needs_review"?"selected":""}>Needs review</option>
          <option value="reviewed" ${statusFilter==="reviewed"?"selected":""}>Reviewed</option>
        </select>
        ${!scopedToReturn ? `
          <label class="row gap-6 small muted" style="cursor:pointer">
            <input type="checkbox" id="group-toggle" ${groupByReturn ? "checked" : ""}/> Group by client
          </label>` : ""}
      </div>
    `;
  }

  App.Pages.documents = {
    title: "Documents",
    wide: true,
    crumbs: (p) => p.id
      ? [{ label: "Returns", hash: "#/returns" }, { label: D.returns.find(r=>r.id===p.id)?.clientName || p.id, hash: `#/returns/${p.id}` }, { label: "Documents" }]
      : [{ label: "Document Library" }],
    render: (params) => {
      const S = App.State, user = S.currentUser(), roleCtx = S.state.activeRoleContext;
      const scopedToReturn = !!params.id;
      visibleCount = 30;
      const allDocs = scopedToReturn
        ? D.documents.filter(d => d.returnId === params.id)
        : D.documents.filter(d => accessibleReturnIds(user, roleCtx).includes(d.returnId));
      const folders = [...new Set(allDocs.map(d => d.folder))];
      const list = filtered(allDocs);

      const tabsHtml = scopedToReturn ? `
        <div class="tabs mb-20">
          <a class="tab-btn" data-action="go" data-hash="#/returns/${params.id}">Overview</a>
          <a class="tab-btn" data-action="go" data-hash="#/returns/${params.id}/review">Return Review</a>
          <a class="tab-btn active">Documents</a>
          <a class="tab-btn" data-action="go" data-hash="#/messages/${params.id}">Messages</a>
        </div>` : "";

      return `
        ${tabsHtml}
        <div class="row between mb-8" style="align-items:baseline">
          <div class="h1">${scopedToReturn ? "Documents for " + U.esc(D.returns.find(r=>r.id===params.id)?.clientName || "") : "Document Library"}</div>
          <span class="small muted">${allDocs.length} total${list.length!==allDocs.length ? ` · ${list.length} matching` : ""}</span>
        </div>
        ${!scopedToReturn ? `<div class="muted mb-16 small">Every document across your assigned returns, in one searchable place.</div>` : ""}
        ${toolbarHtml(folders, scopedToReturn)}
        <div id="doc-results">${groupedHtml(list, scopedToReturn)}</div>
      `;
    },
    mount: (container, params) => {
      const S = App.State, user = S.currentUser(), roleCtx = S.state.activeRoleContext;
      const scopedToReturn = !!params.id;
      const allDocs = scopedToReturn
        ? D.documents.filter(d => d.returnId === params.id)
        : D.documents.filter(d => accessibleReturnIds(user, roleCtx).includes(d.returnId));

      function refresh() {
        const list = filtered(allDocs);
        container.querySelector("#doc-results").innerHTML = groupedHtml(list, scopedToReturn);
        wireLoadMore();
      }
      function wireLoadMore() {
        const btn = container.querySelector("#load-more-btn");
        if (btn) btn.addEventListener("click", () => { visibleCount += 30; refresh(); });
      }

      const searchInput = container.querySelector("#doc-search");
      searchInput && searchInput.addEventListener("input", (e) => { search = e.target.value; visibleCount = 30; refresh(); });
      const folderSel = container.querySelector("#folder-filter");
      folderSel && folderSel.addEventListener("change", (e) => { folderFilter = e.target.value; visibleCount = 30; refresh(); });
      const statusSel = container.querySelector("#status-filter");
      statusSel && statusSel.addEventListener("change", (e) => { statusFilter = e.target.value; visibleCount = 30; refresh(); });
      const groupToggle = container.querySelector("#group-toggle");
      groupToggle && groupToggle.addEventListener("change", (e) => { groupByReturn = e.target.checked; refresh(); });
      wireLoadMore();
    },
  };
})(window.App = window.App || {});
