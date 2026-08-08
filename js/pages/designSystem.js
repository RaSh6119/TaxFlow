(function (App) {
  const U = App.Util, D = App.Data, C = App.Components;

  const sampleFields = [
    { id: "demo1", form: "Form 1040", line: "Line 1a — Wages", value: "$96,420", state: "ai_extracted", editable: true, confidence: 98, sources:[{}], transformation:"" },
    { id: "demo2", form: "Schedule A", line: "Line 8a — Mortgage interest", value: "$11,340", state: "verified", editable: false, confidence: 99, sources:[{}], transformation:"" },
    { id: "demo3", form: "Schedule A", line: "Line 17 — Total itemized", value: "$13,840", state: "locked", editable: false, confidence: 100, sources:[{}], transformation:"" },
    { id: "demo4", form: "Form 1040", line: "Line 3b — Dividends", value: "$1,875", state: "needs_review", editable: true, confidence: 74, sources:[{}], transformation:"" },
  ];

  App.Pages.designSystem = {
    title: "Design System",
    crumbs: () => [{ label: "Design System" }],
    render: () => `
      <div class="h1 mb-8">Clickable vs. Editable</div>
      <div class="muted mb-24" style="max-width:680px">
        This return-prep interface mixes AI output, verified data, system calculations, and human input on the
        same screen. One consistent visual language marks what's safe to trust, what needs a look, and what can't
        change no matter how hard you click it.
      </div>

      <div class="grid-2 mb-24">
        <div class="card card-pad">
          <div class="h3 mb-12">State chips</div>
          <div class="col gap-12">
            <div class="row gap-10">${C.fieldChip("ai_extracted")}<span class="small muted">Pulled automatically from a source document. Editable — a person should still glance at it.</span></div>
            <div class="row gap-10">${C.fieldChip("needs_review")}<span class="small muted">The AI flagged low confidence or ambiguity. Shown with a visible warning, not buried.</span></div>
            <div class="row gap-10">${C.fieldChip("verified")}<span class="small muted">A person has confirmed this value. Still visually distinct from "just extracted."</span></div>
            <div class="row gap-10">${C.fieldChip("locked")}<span class="small muted">Calculated from other fields. Never directly editable — editing the inputs is the only way to change it.</span></div>
          </div>
        </div>
        <div class="card card-pad">
          <div class="h3 mb-12">Interaction rules</div>
          <div class="col gap-12">
            <div class="row gap-10"><span class="field-value state-editable">$96,420</span><span class="small muted">Dashed underline = editable. Click the value itself to open an edit affordance.</span></div>
            <div class="row gap-10"><span class="field-value state-locked">$13,840 ${U.icon("lock")}</span><span class="small muted">Lock icon + no underline = calculated, not editable. Hovering gives no click affordance.</span></div>
            <div class="row gap-10"><span class="link-btn">View source document ${U.icon("chevronRight")}</span><span class="small muted">Teal link-weight text = navigates elsewhere, never mutates data.</span></div>
            <div class="row gap-10"><span class="badge tone-teal">Row hover</span><span class="small muted">Clicking anywhere else on a field's row selects/expands it — distinct from clicking the value to edit it.</span></div>
          </div>
        </div>
      </div>

      <div class="card mb-24">
        <div class="card-head"><div class="h3">Live examples — Return Review context</div><a class="link-btn small" data-action="go" data-hash="#/returns/r_maria/review">Open live ${U.icon("chevronRight")}</a></div>
        ${sampleFields.map(f => C.fieldRow(f)).join("")}
      </div>

      <div class="grid-2">
        <div class="card card-pad">
          <div class="row between mb-12"><div class="h3">Same language — Document Library</div><a class="link-btn tiny" data-action="go" data-hash="#/documents">Open ${U.icon("chevronRight")}</a></div>
          <div class="col gap-8">
            <div class="row between small"><span>W-2 — Acme Robotics</span><span class="field-chip chip-ai">${U.icon("sparkle")} Extracted</span></div>
            <div class="row between small"><span>1099-DIV — Schwab</span><span class="field-chip chip-review">${U.icon("warn")} Needs review</span></div>
            <div class="row between small"><span>1098 — Wells Fargo</span><span class="field-chip chip-verified">${U.icon("check")} Reviewed</span></div>
          </div>
        </div>
        <div class="card card-pad">
          <div class="row between mb-12"><div class="h3">Same language — Messages</div><a class="link-btn tiny" data-action="go" data-hash="#/messages">Open ${U.icon("chevronRight")}</a></div>
          <div class="col gap-8">
            <div class="bubble internal small">${U.icon("lock")} Internal note — dashed border + amber marks firm-only content, same "restricted" meaning as a locked field.</div>
            <div class="bubble client small">Client-visible messages use the neutral bubble style — nothing hidden, nothing flagged.</div>
          </div>
        </div>
      </div>
    `,
  };
})(window.App = window.App || {});
