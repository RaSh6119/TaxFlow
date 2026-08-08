(function (App) {
  const U = {};

  U.esc = (str) => String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

  U.icon = (name) => {
    const map = {
      dashboard: "📊", returns: "🗂️", documents: "📁",
      messages: "💬", tasks: "✅", roles: "👥",
      design: "🎨", clients: "🙍", search: "🔍",
      bell: "🔔", chevronRight: "›", chevronDown: "⌄",
      lock: "🔒", sparkle: "✨", check: "✓", warn: "⚠️",
      clock: "🕒", link: "🔗", back: "←", close: "✕",
      upload: "⬆", download: "⬇", edit: "✎", doc: "📄",
      thread: "💬", flag: "🚩", filter: "▾", info: "ⓘ",
      ai: "🤖", map: "🧭", onboarding: "👋", attach: "📎",
    };
    return map[name] || "";
  };

  U.fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  U.daysUntil = (iso) => {
    const today = new Date("2026-02-02T00:00:00");
    const d = new Date(iso + "T00:00:00");
    return Math.round((d - today) / 86400000);
  };

  U.dueLabel = (iso) => {
    const n = U.daysUntil(iso);
    if (n < 0) return { text: `${Math.abs(n)}d overdue`, tone: "red" };
    if (n === 0) return { text: "Due today", tone: "red" };
    if (n <= 3) return { text: `Due in ${n}d`, tone: "amber" };
    if (n <= 10) return { text: `Due in ${n}d`, tone: "blue" };
    return { text: `Due ${U.fmtDate(iso)}`, tone: "slate" };
  };

  U.confidenceTone = (c) => (c >= 90 ? "conf-high" : c >= 70 ? "conf-med" : "conf-low");

  U.statusBadge = (statusId, size) => {
    const s = App.Data.getStatus(statusId);
    if (!s) return "";
    return `<span class="badge tone-${s.color} ${size === "sm" ? "small" : ""}"><span class="badge-dot"></span>${U.esc(s.label)}</span>`;
  };

  U.avatar = (userId, size) => {
    const u = App.Data.getUser(userId);
    if (!u) return `<span class="avatar" style="width:${size||26}px;height:${size||26}px">?</span>`;
    return `<span class="avatar" style="width:${size||26}px;height:${size||26}px">${U.esc(u.initials)}</span>`;
  };

  U.roleLabel = (roleId) => App.Data.getRoleMeta(roleId)?.label || roleId;

  U.qs = (sel, root) => (root || document).querySelector(sel);
  U.qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  U.debounce = (fn, ms) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  App.Util = U;
})(window.App = window.App || {});
