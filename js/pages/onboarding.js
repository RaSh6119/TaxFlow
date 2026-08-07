/* ============================================================
   Page: Onboarding — Challenge 03 "Where to Start"
   Goal: a brand-new client knows their next action within 10s.
   One big hero card for the current step; everything else is
   deliberately deferred/collapsed so it doesn't compete for attention.
   ============================================================ */
(function (App) {
  const U = App.Util, D = App.Data;

  function currentStep() {
    return D.onboardingChecklist.find(i => !i.done && !i.locked) || null;
  }

  App.Pages.onboarding = {
    title: "Welcome",
    crumbs: () => [{ label: "Welcome" }],
    render: () => {
      const S = App.State;
      const user = S.currentUser();
      const firstName = U.esc(user.name.split(" ")[0]);

      if (!user.isNew) {
        return `
          <div class="card card-pad" style="max-width:560px">
            <div class="h2 mb-8">You're all set, ${firstName}.</div>
            <div class="muted mb-16">You've already completed onboarding. Head to your dashboard to see where your return stands.</div>
            <button class="btn btn-primary" data-action="go" data-hash="#/dashboard">Go to your dashboard</button>
          </div>
        `;
      }

      const list = D.onboardingChecklist;
      const doneCount = list.filter(i => i.done).length;
      const step = currentStep();
      const allDone = list.every(i => i.done);

      return `
        <div class="mb-24">
          <div class="tiny muted" style="text-transform:uppercase;letter-spacing:.06em">Welcome to TaxFlow, ${firstName}</div>
          <div class="h1 mt-8">Let's get your 2025 return started.</div>
        </div>

        ${step ? `
          <div class="card mb-24" style="border-color:var(--teal-500);border-width:1.5px">
            <div class="card-pad">
              <div class="row gap-10 mb-8">
                <span class="badge tone-teal">Your next step</span>
                <span class="tiny muted">Takes about ${step.minutes} minutes</span>
              </div>
              <div class="h2 mb-8">${U.esc(step.label)}</div>
              <div class="muted mb-16" style="max-width:560px">${U.esc(step.detail)}</div>
              ${step.hash
                ? `<button class="btn btn-primary" data-action="go" data-hash="${step.hash}">Start now</button>`
                : `<button class="btn btn-primary" data-action="toggle-checklist" data-item="${step.id}">Start now</button>`}
            </div>
          </div>
        ` : `
          <div class="card mb-24" style="border-color:var(--green-600);border-width:1.5px">
            <div class="card-pad">
              <div class="badge tone-green mb-12">${U.icon("check")} All caught up</div>
              <div class="h2 mb-8">You've completed everything on your end.</div>
              <div class="muted mb-16">Priya will reach out if anything else is needed. Head to your dashboard to track progress.</div>
              <button class="btn btn-primary" data-action="finish-onboarding">Continue to your dashboard</button>
            </div>
          </div>
        `}

        <div class="row between mb-12" style="align-items:baseline">
          <div class="h3">Your onboarding checklist</div>
          <span class="small muted">${doneCount} of ${list.length} complete</span>
        </div>
        <div class="col">
          ${list.map((item, i) => `
            <div class="checklist-item ${item.locked ? "" : ""}" style="${item.locked ? "opacity:.55" : ""}">
              <div class="check-circle ${item.done ? "done" : item.current || item === step ? "current" : ""}">
                ${item.done ? U.icon("check") : item.locked ? U.icon("lock") : (i + 1)}
              </div>
              <div class="grow">
                <div class="row gap-8" style="font-weight:600;font-size:13.5px">
                  ${U.esc(item.label)}
                  ${item === step ? `<span class="badge tone-blue">Up next</span>` : ""}
                  ${item.locked ? `<span class="tiny muted">Unlocks after previous steps</span>` : ""}
                </div>
                <div class="tiny muted mt-4">${U.esc(item.detail)}</div>
              </div>
              ${!item.locked ? `<button class="btn btn-ghost btn-sm" data-action="toggle-checklist" data-item="${item.id}">${item.done ? "Mark not done" : "Mark done"}</button>` : ""}
            </div>
          `).join("")}
        </div>

        <div class="card card-pad mt-24">
          <div class="h3 mb-8">Why this screen looks the way it does</div>
          <div class="small muted">
            Everything not relevant to the very next action — status history, past returns, firm messaging threads —
            is deliberately absent from this first screen. Once onboarding finishes, the sidebar and dashboard expand
            into the full, ongoing-client experience (try the "Enter as Preparer" link from the Challenge Map, or finish
            this checklist and continue to the dashboard).
          </div>
        </div>
      `;
    },
  };
})(window.App = window.App || {});
