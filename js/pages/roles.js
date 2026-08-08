/* ============================================================
   Page: Role Architecture — Challenge 05 "Role-Aware Experiences"
   One shell, six roles. This page documents the architecture and
   lets you jump straight into any role to see it live.
   ============================================================ */
(function (App) {
  const U = App.Util, D = App.Data;

  const permissionMatrix = [
    { cap: "View own return & documents", client_individual: true, client_business: true, preparer: true, reviewer: true, admin: true, seasonal: true },
    { cap: "View firm's full return roster", client_individual: false, client_business: false, preparer: "assigned only", reviewer: "assigned only", admin: true, seasonal: "assigned only" },
    { cap: "Edit / override return fields", client_individual: false, client_business: false, preparer: true, reviewer: true, admin: true, seasonal: "limited" },
    { cap: "Approve / sign off a return", client_individual: false, client_business: false, preparer: false, reviewer: true, admin: true, seasonal: false },
    { cap: "Send client-visible messages", client_individual: true, client_business: true, preparer: true, reviewer: true, admin: true, seasonal: true },
    { cap: "Write internal-only notes", client_individual: false, client_business: false, preparer: true, reviewer: true, admin: true, seasonal: true },
    { cap: "Manage firm users & settings", client_individual: false, client_business: false, preparer: false, reviewer: false, admin: true, seasonal: false },
  ];

  function cell(v) {
    if (v === true) return `<span style="color:var(--green-600);font-weight:700">${U.icon("check")}</span>`;
    if (v === false) return `<span style="color:var(--ink-300)">—</span>`;
    return `<span class="tiny" style="color:var(--amber-600);font-weight:700">${U.esc(v)}</span>`;
  }

  App.Pages.roles = {
    title: "Role Architecture",
    crumbs: () => [{ label: "Role Architecture" }],
    wide: true,
    render: () => {
      const S = App.State;
      return `
        <div class="h1 mb-8">One product, six roles</div>
        <div class="muted mb-24" style="max-width:680px">
          TaxFlow is a single codebase and a single shell (same sidebar, topbar, and component library) for every
          role. What changes per role is navigation, what data is visible, and what actions are available —
          never the underlying interaction patterns. Use the account switcher (top right) to try any of these live.
        </div>

        <div class="grid-3 mb-24">
          ${D.roles.map(r => `
            <div class="card card-pad">
              <span class="badge tone-${r.group === "client" ? "blue" : "teal"} mb-8">${r.group === "client" ? "Client-side" : "Firm-side"}</span>
              <div class="h3 mb-6">${U.esc(r.label)}</div>
              <div class="tiny muted">${roleBlurb(r.id)}</div>
            </div>
          `).join("")}
        </div>

        <div class="card mb-24">
          <div class="card-head"><div class="h3">Permission matrix</div><span class="tiny muted">Same screen, different capabilities</span></div>
          <table class="tbl">
            <thead><tr><th>Capability</th>${D.roles.map(r=>`<th style="text-align:center">${U.esc(r.label.split(" — ")[1]||r.label)}</th>`).join("")}</tr></thead>
            <tbody>
              ${permissionMatrix.map(row => `
                <tr>
                  <td style="font-weight:600">${U.esc(row.cap)}</td>
                  ${D.roles.map(r => `<td style="text-align:center">${cell(row[r.id])}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div class="card card-pad mb-24" style="border-color:var(--violet-100)">
          <div class="badge tone-violet mb-12">Multi-role scenario</div>
          <div class="h3 mb-8">A firm employee with a personal return</div>
          <div class="small muted mb-16" style="max-width:640px">
            Aditya Singh is a Senior Tax Preparer at the firm — and also a client, because the firm prepares his
            personal return. Rather than a second login, he switches "hats" from the same account menu.
            The shell re-renders around whichever context he's in: as a preparer he sees the full firm queue;
            as a client, he sees exactly what Rahul or Sangram would see for his own return, nothing more.
          </div>
          <div class="row gap-8">
            <button class="btn btn-primary btn-sm" data-action="switch-user" data-user="u_priya">Log in as Aditya</button>
            <span class="tiny muted" style="align-self:center">then use the account menu to toggle "Working as: Preparer" vs "Working as: Client"</span>
          </div>
        </div>

        <div class="card card-pad">
          <div class="h3 mb-8">Try it now</div>
          <div class="row gap-8 wrap">
            ${D.users.map(u => `<button class="btn btn-secondary btn-sm" data-action="switch-user" data-user="${u.id}">${U.esc(u.name)} — ${U.esc(U.roleLabel(u.role))}</button>`).join("")}
          </div>
        </div>
      `;
    },
  };

  function roleBlurb(id) {
    const map = {
      client_individual: "Sees only their own return, documents, and conversation. Everything is deferred until relevant.",
      client_business: "Same client shell, plus entity-level documents (K-1s, payroll) relevant to a business return.",
      preparer: "Full working queue: assigned returns, document extraction review, and client messaging.",
      reviewer: "Everything a preparer sees, plus approval authority and a team-wide queue toggle on the dashboard.",
      admin: "Firm-wide visibility across every return and role, plus user/settings management.",
      seasonal: "Scoped to a small set of assigned returns with limited edit rights — no override authority.",
    };
    return map[id] || "";
  }
})(window.App = window.App || {});
