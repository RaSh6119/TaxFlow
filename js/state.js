/* ============================================================
   TaxFlow — App State
   Tiny pub/sub store. Holds current user/role, nav history
   (for the "return to where you were" banner), and toasts.
   ============================================================ */
(function (App) {
  const S = {};
  const listeners = [];

  S.state = {
    currentUserId: "u_maria",   // default: first-time client experience
    activeRoleContext: "client_individual", // for dual-role users, which "hat" they're wearing
    navHistory: [],             // stack of { hash, label } for context preservation
    lastWorkflow: null,         // { hash, label } — "you were working on..."
    toasts: [],
  };

  S.subscribe = (fn) => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); };
  S.notify = () => listeners.forEach((fn) => fn(S.state));

  S.setUser = (userId) => {
    const u = App.Data.getUser(userId);
    S.state.currentUserId = userId;
    S.state.activeRoleContext = u.role;
    S.notify();
  };

  S.switchRoleContext = (roleId) => {
    S.state.activeRoleContext = roleId;
    S.notify();
  };

  S.currentUser = () => App.Data.getUser(S.state.currentUserId);

  S.pushHistory = (entry) => {
    const h = S.state.navHistory;
    if (h.length && h[h.length - 1].hash === entry.hash) return;
    h.push(entry);
    if (h.length > 25) h.shift();
    S.notify();
  };

  S.setLastWorkflow = (entry) => { S.state.lastWorkflow = entry; S.notify(); };
  S.clearLastWorkflow = () => { S.state.lastWorkflow = null; S.notify(); };

  S.toast = (msg) => {
    const id = Date.now() + Math.random();
    S.state.toasts.push({ id, msg });
    S.notify();
    setTimeout(() => {
      S.state.toasts = S.state.toasts.filter((t) => t.id !== id);
      S.notify();
    }, 2800);
  };

  App.State = S;
})(window.App = window.App || {});
