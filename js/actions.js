/* ============================================================
   TaxFlow — Actions
   Central handlers for data-action clicks across the whole app.
   Every handler mutates App.State / App.Data (mock) then triggers
   a re-render via App.State.notify() (wired in app.js).
   ============================================================ */
(function (App) {
  const A = {};
  const S = () => App.State;
  const D = () => App.Data;

  A.go = (ds) => { location.hash = ds.hash; if (ds.close) { S().state.modal = null; } };

  A.noop = () => {};

  A["toggle-role-menu"] = () => { S().state.roleMenuOpen = !S().state.roleMenuOpen; S().notify(); };

  A["switch-user"] = (ds) => {
    S().state.roleMenuOpen = false;
    S().setUser(ds.user);
    S().clearLastWorkflow();
    S().state.navHistory = [];
    location.hash = ds.hash || "#/challenges";
    App.State.toast(`Switched to ${App.Data.getUser(ds.user).name}`);
  };

  A["switch-role-context"] = (ds) => {
    S().state.roleMenuOpen = false;
    S().switchRoleContext(ds.role);
    const isClient = ds.role.startsWith("client");
    location.hash = isClient ? "#/dashboard" : "#/dashboard";
    App.State.toast(`Now viewing as ${App.Util.roleLabel(ds.role)}`);
  };

  A["dismiss-banner"] = () => { S().clearLastWorkflow(); };

  A["close-modal"] = () => { S().state.modal = null; S().notify(); };
  A["close-modal-bg"] = (ds, ev) => { if (ev.target.closest('[data-action="stop"]')) return; S().state.modal = null; S().notify(); };
  A["stop"] = () => {};

  A["open-doc-modal"] = (ds) => {
    const doc = D().documents.find(d => d.id === ds.doc);
    S().state.modal = { type: "doc", payload: { docId: ds.doc, returnId: doc?.returnId, page: 1, region: ds.region ? JSON.parse(ds.region) : null } };
    S().notify();
  };

  A["select-field"] = (ds) => {
    S().state.ui = S().state.ui || {};
    S().state.ui.selectedField = ds.field;
    S().notify();
  };

  A["edit-field"] = (ds) => {
    const f = D().fields.find(x => x.id === ds.field);
    if (!f || !f.editable) return;
    S().state.modal = { type: "field-edit", payload: { field: f } };
    S().notify();
  };

  A["save-field-edit"] = (ds) => {
    const f = D().fields.find(x => x.id === ds.field);
    const input = document.getElementById("field-edit-input");
    if (f && input) {
      f.value = input.value;
      f.state = "verified";
      f.verifiedBy = S().state.currentUserId;
      f.transformation += ` Manually overridden by ${D().getUser(S().state.currentUserId).name}.`;
    }
    S().state.modal = null;
    S().notify();
    App.State.toast("Field updated and marked verified.");
  };

  A["ai-accept"] = (ds) => {
    const ai = D().aiOutputs.find(x => x.fieldId === ds.field);
    const f = D().fields.find(x => x.id === ds.field);
    if (ai) ai.status = "resolved";
    if (f) f.state = "verified";
    S().notify();
    App.State.toast("Suggestion accepted.");
  };

  A["ai-dismiss"] = (ds) => {
    const ai = D().aiOutputs.find(x => x.fieldId === ds.field);
    if (ai) ai.status = "resolved";
    S().notify();
    App.State.toast("Flag dismissed — you can reopen it anytime.");
  };

  A["ai-correct"] = (ds) => {
    const f = D().fields.find(x => x.id === ds.field);
    if (!f) return;
    S().state.modal = { type: "field-edit", payload: { field: f } };
    S().notify();
  };

  A["resolve-flag"] = (ds) => {
    const f = D().aiFlags.find(x => x.id === ds.flag);
    if (f) f.status = "resolved";
    S().notify();
    App.State.toast("Flag marked resolved.");
  };

  // ---------- Onboarding (Challenge 03) ----------
  A["toggle-checklist"] = (ds) => {
    const item = D().onboardingChecklist?.find(i => i.id === ds.item);
    if (item) item.done = !item.done;
    S().notify();
  };

  A["finish-onboarding"] = () => {
    D().users.find(u => u.id === "u_maria").isNew = false;
    location.hash = "#/dashboard";
    App.State.toast("Welcome aboard! Your dashboard is ready.");
  };

  // ---------- Messages (Challenge 02) ----------
  A["select-thread"] = (ds) => { S().state.ui = S().state.ui || {}; S().state.ui.activeThread = ds.thread; S().notify(); };

  A["send-message"] = (ds) => {
    const box = document.getElementById("compose-box");
    if (!box || !box.value.trim()) return;
    const th = D().threads.find(t => t.id === ds.thread);
    const user = S().currentUser();
    th.messages.push({
      id: "m" + Date.now(), author: user.id, internal: !!ds.internal,
      at: "2026-02-02 " + new Date().toTimeString().slice(0,5), body: box.value.trim(),
    });
    if (!ds.internal) th.status = user.role.startsWith("client") ? "waiting_on_firm" : "waiting_on_client";
    box.value = "";
    S().notify();
  };

  A["resolve-thread"] = (ds) => {
    const th = D().threads.find(t => t.id === ds.thread);
    if (th) { th.status = "resolved"; th.owner = null; }
    S().notify();
    App.State.toast("Thread marked resolved.");
  };

  // ---------- Tasks / Dashboard (Challenge 07) ----------
  A["complete-task"] = (ds) => {
    D().tasks = D().tasks.filter(t => t.id !== ds.task);
    S().notify();
    App.State.toast("Task completed.");
  };

  A["set-dashboard-scope"] = (ds) => {
    S().state.ui = S().state.ui || {};
    S().state.ui.dashboardScope = ds.scope;
    S().notify();
  };

  // ---------- Generic tab switch ----------
  A["set-tab"] = (ds) => {
    S().state.ui = S().state.ui || {};
    S().state.ui[ds.group] = ds.value;
    S().notify();
  };

  A["set-filter"] = (ds) => {
    S().state.ui = S().state.ui || {};
    S().state.ui[ds.key] = ds.value;
    S().notify();
  };

  App.Actions = A;
})(window.App = window.App || {});
