(function (App) {
  const U = App.Util, D = App.Data;

  function threadMeta(t) {
    const map = {
      waiting_on_client: { label: "Waiting on client", tone: "amber" },
      waiting_on_firm: { label: "Waiting on preparer", tone: "violet" },
      resolved: { label: "Resolved", tone: "green" },
    };
    return map[t.status] || { label: t.status, tone: "slate" };
  }

  function accessibleThreads(user, roleCtx) {
    if (roleCtx.startsWith("client")) {
      const myReturns = user.returnIds || [user.personalReturnId];
      return D.threads.filter(t => myReturns.includes(t.returnId));
    }
    const assigned = user.assignedReturnIds || D.returns.filter(r => r.preparerId === user.id).map(r => r.id);
    return D.threads.filter(t => assigned.includes(t.returnId) || roleCtx === "admin");
  }

  function threadListItem(t, active, isClient) {
    const meta = threadMeta(t);
    const client = D.returns.find(r => r.id === t.returnId)?.clientName;
    const last = t.messages[t.messages.length - 1];
    return `
      <div class="thread-item ${active ? "active" : ""}" data-action="select-thread" data-thread="${t.id}">
        <div class="thread-item-subject">${U.esc(t.subject)}</div>
        <div class="row gap-6 small mt-4" style="color:var(--${meta.tone}-600)">
          <span class="badge-dot"></span>
          <span>${meta.label}${!isClient ? ` · ${U.esc(client)}` : ""}</span>
        </div>
        <div class="tiny muted thread-item-preview mt-6">${U.esc(D.getUser(last.author)?.name || "—")}: ${U.esc(last.body)}</div>
      </div>
    `;
  }

  function bubble(m, isClient) {
    const author = D.getUser(m.author);
    const mine = isClient ? author?.role?.startsWith("client") : !author?.role?.startsWith("client");
    const cls = m.internal ? "internal" : (author?.role?.startsWith("client") ? "client" : "firm");
    return `
      <div class="col" style="align-items:${cls==='client' && !m.internal ? 'flex-start' : 'flex-end'}">
        <div class="bubble ${cls}">
          ${m.internal ? `<div class="tiny" style="font-weight:700;margin-bottom:3px">${U.icon("lock")} INTERNAL NOTE — not visible to client</div>` : ""}
          <div>${U.esc(m.body)}</div>
        </div>
        <div class="tiny muted mt-4">${U.esc(author?.name || "—")} · ${U.esc(m.at)}</div>
      </div>
    `;
  }

  function threadPane(thread, isClient, ret) {
    const visibleMsgs = thread.messages.filter(m => isClient ? !m.internal : true);
    const linkedDoc = thread.linkedDocId ? D.documents.find(d => d.id === thread.linkedDocId) : null;
    const meta = threadMeta(thread);

    return `
      <div class="card" style="display:flex;flex-direction:column;min-height:420px">
        <div class="card-head">
          <div>
            <div class="h2">${U.esc(thread.subject)}</div>
            <div class="tiny muted mt-4">${U.esc(ret?.clientName || "")}</div>
          </div>
          <div class="row gap-10">
            <span class="badge tone-${meta.tone}">${meta.label}</span>
            ${thread.status !== "resolved" ? `<button class="btn btn-secondary btn-sm" data-action="resolve-thread" data-thread="${thread.id}">Mark resolved</button>` : ""}
          </div>
        </div>
        ${linkedDoc ? `
          <div class="linked-doc-card" data-action="open-doc-modal" data-doc="${linkedDoc.id}">
            <span class="linked-doc-ico">${U.icon("doc")}</span>
            <span class="linked-doc-name">${U.esc(linkedDoc.name)}</span>
            <span class="linked-doc-cta">View document ${U.icon("chevronRight")}</span>
          </div>` : ""}
        <div class="col gap-14 grow scrollbox" style="padding:18px">
          ${visibleMsgs.map(m => bubble(m, isClient)).join("")}
        </div>
        <div class="composer">
          <textarea class="composer-input" id="compose-box" rows="2" placeholder="${isClient ? "Reply to your preparer…" : "Reply to client (or add an internal note)…"}"></textarea>
          <div class="row between mt-8">
            ${!isClient ? `
              <label class="row gap-6 small muted" style="cursor:pointer">
                <input type="checkbox" id="internal-toggle"/> Internal note (firm only)
              </label>` : `<button type="button" class="link-btn small composer-attach">${U.icon("attach")} Attach document</button>`}
            <button class="btn btn-primary btn-sm" id="send-btn" data-thread="${thread.id}">Send reply</button>
          </div>
        </div>
      </div>
    `;
  }

  App.Pages.messages = {
    title: "Messages",
    crumbs: (p) => p.returnId
      ? [{ label: "Returns", hash: "#/returns" }, { label: D.returns.find(r=>r.id===p.returnId)?.clientName || p.returnId, hash: `#/returns/${p.returnId}` }, { label: "Messages" }]
      : [{ label: "Messages" }],
    render: (params) => {
      const S = App.State, user = S.currentUser(), roleCtx = S.state.activeRoleContext;
      const isClient = roleCtx.startsWith("client");
      let threads = accessibleThreads(user, roleCtx);
      if (params.returnId) threads = threads.filter(t => t.returnId === params.returnId);
      threads = threads.slice().sort((a,b) => (a.status==="resolved"?1:0) - (b.status==="resolved"?1:0));

      if (!threads.length) return `<div class="empty-state card card-pad">No conversations yet.</div>`;

      const ui = S.state.ui = S.state.ui || {};
      const activeId = ui.activeThread && threads.some(t=>t.id===ui.activeThread) ? ui.activeThread : threads[0].id;
      const active = threads.find(t => t.id === activeId);
      const ret = D.returns.find(r => r.id === active.returnId);

      const tabsHtml = params.returnId ? `
        <div class="tabs mb-20">
          <a class="tab-btn" data-action="go" data-hash="#/returns/${params.returnId}">Overview</a>
          <a class="tab-btn" data-action="go" data-hash="#/returns/${params.returnId}/review">Return Review</a>
          <a class="tab-btn" data-action="go" data-hash="#/returns/${params.returnId}/documents">Documents</a>
          <a class="tab-btn active">Messages</a>
        </div>` : "";

      return `
        ${tabsHtml}
        <div class="h1 mb-16">${params.returnId ? "Messages — " + U.esc(ret.clientName) : "Messages"}</div>
        <div class="two-pane">
          <div class="col gap-6 msg-thread-list">
            ${threads.map(t => threadListItem(t, t.id===activeId, isClient)).join("")}
          </div>
          <div>${threadPane(active, isClient, ret)}</div>
        </div>
      `;
    },
    mount: (container) => {
      const sendBtn = container.querySelector("#send-btn");
      if (sendBtn) {
        sendBtn.addEventListener("click", () => {
          const internal = container.querySelector("#internal-toggle");
          App.Actions["send-message"]({ thread: sendBtn.dataset.thread, internal: internal && internal.checked ? "1" : "" });
        });
      }
    },
  };
})(window.App = window.App || {});
