(function (App) {
  const S = App.State, U = App.Util, C = App.Components;

  function clientLabel(id) { return App.Data.returns.find(r => r.id === id)?.clientName || id; }

  const routes = [
    { name: "challenges", pattern: /^#\/challenges$/, page: () => App.Pages.challenges },
    { name: "onboarding", pattern: /^#\/onboarding$/, page: () => App.Pages.onboarding },
    { name: "dashboard", pattern: /^#\/dashboard$/, page: () => App.Pages.dashboard },
    { name: "returns", pattern: /^#\/returns$/, page: () => App.Pages.returns },
    { name: "returnReview", pattern: /^#\/returns\/([\w-]+)\/review$/, params: ["id"], page: () => App.Pages.returnReview },
    { name: "returnDocuments", pattern: /^#\/returns\/([\w-]+)\/documents$/, params: ["id"], page: () => App.Pages.documents },
    { name: "returnDetail", pattern: /^#\/returns\/([\w-]+)$/, params: ["id"], page: () => App.Pages.returnDetail },
    { name: "documents", pattern: /^#\/documents$/, page: () => App.Pages.documents },
    { name: "messages", pattern: /^#\/messages\/([\w-]+)$/, params: ["returnId"], page: () => App.Pages.messages },
    { name: "messages", pattern: /^#\/messages$/, page: () => App.Pages.messages },
    { name: "roles", pattern: /^#\/roles$/, page: () => App.Pages.roles },
    { name: "designSystem", pattern: /^#\/design-system$/, page: () => App.Pages.designSystem },
    { name: "aiInsights", pattern: /^#\/ai-insights$/, page: () => App.Pages.aiInsights },
  ];

  function matchRoute(hash) {
    for (const r of routes) {
      const m = hash.match(r.pattern);
      if (m) {
        const params = {};
        (r.params || []).forEach((p, i) => { params[p] = m[i + 1]; });
        return { def: r, params };
      }
    }
    return null;
  }

  function buildRouteCtx(match, hash) {
    const page = match.def.page();
    const params = match.params;
    const ctx = {
      name: match.def.name,
      wide: !!page.wide,
      crumbs: page.crumbs ? page.crumbs(params) : [{ label: page.title || "TaxFlow" }],
      returnId: params.id || params.returnId || null,
    };
    return ctx;
  }

  let lastMountCleanup = null;

  function render() {
    const hash = location.hash || "#/challenges";
    const match = matchRoute(hash) || matchRoute("#/challenges");
    const page = match.def.page();
    const params = match.params;
    const routeCtx = buildRouteCtx(match, hash);

    if (routeCtx.returnId) {
      const cw = S.state.currentWorkflow;
      if (!cw || cw.returnId !== routeCtx.returnId) {
        if (cw) S.setLastWorkflow(cw);
        S.state.currentWorkflow = { returnId: routeCtx.returnId, hash, label: clientLabel(routeCtx.returnId) + "'s return" };
      } else {
        cw.hash = hash;
      }
    }

    S.pushHistory({ hash, label: routeCtx.crumbs[routeCtx.crumbs.length - 1]?.label || hash });

    const contentHtml = page.render(params);
    const root = document.getElementById("app-root");
    root.innerHTML = C.shell(routeCtx, contentHtml);

    if (page.mount) {
      const container = document.getElementById("page-content-inner");
      page.mount(container, params);
    }
  }

  function onClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) {
      if (S.state.roleMenuOpen && !e.target.closest(".role-switch")) { S.state.roleMenuOpen = false; S.notify(); }
      return;
    }
    const action = el.dataset.action;
    if (action === "go") e.preventDefault();
    const handler = App.Actions[action];
    if (handler) handler(el.dataset, e);
  }

  function boot() {
    document.addEventListener("click", onClick);
    S.subscribe(render);
    window.addEventListener("hashchange", render);
    if (!location.hash) location.hash = "#/challenges";
    render();
  }

  document.addEventListener("DOMContentLoaded", boot);
})(window.App = window.App || {});
