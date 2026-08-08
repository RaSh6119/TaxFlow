(function (App) {
  const U = App.Util, D = App.Data;

  function tabs(id, active) {
    const items = [
      { key: "overview", label: "Overview", hash: `#/returns/${id}` },
      { key: "review", label: "Return Review", hash: `#/returns/${id}/review` },
      { key: "documents", label: "Documents", hash: `#/returns/${id}/documents` },
      { key: "messages", label: "Messages", hash: `#/messages/${id}` },
    ];
    return `<div class="tabs mb-20">${items.map(it => `<a class="tab-btn ${it.key===active?"active":""}" data-action="go" data-hash="${it.hash}">${it.label}</a>`).join("")}</div>`;
  }

  function trailSteps(field) {
    const steps = [];
    field.sources.forEach((src, i) => {
      if (src.docId) {
        const doc = D.documents.find(d => d.id === src.docId);
        steps.push({
          dot: i + 1,
          title: `Source: ${doc ? doc.name : "Unknown document"}`,
          body: `${src.box || "Field"} on page ${src.page} · raw value <b>${U.esc(src.rawValue || "—")}</b>`,
          docId: src.docId, page: src.page, region: src.region,
        });
      } else {
        steps.push({ dot: i + 1, title: "System calculation", body: "Derived from other fields on this return — no single source document.", docId: null });
      }
    });
    steps.push({ dot: "=", title: "Result on return", body: `${U.esc(field.form)}, ${U.esc(field.line)}: <b>${U.esc(field.value)}</b>`, final: true });
    return steps;
  }

  function fieldGroup(formName, fields, selectedId) {
    return `
      <div class="mb-20">
        <div class="h3 mb-8">${U.esc(formName)}</div>
        <div class="card">
          ${fields.map(f => `
            <div class="field-row state-clickable ${f.id === selectedId ? "highlight-selected" : ""}"
                 data-action="select-field" data-field="${f.id}">
              <div>
                <div class="field-label">${U.esc(f.line)}</div>
                <div class="field-value-line">
                  <span class="field-value ${f.editable ? "state-editable" : ""}" ${f.editable ? `data-action="edit-field" data-field="${f.id}"` : ""}>${U.esc(f.value)}</span>
                  ${!f.editable ? `<span class="lock-ico" title="Calculated field">${U.icon("lock")}</span>` : ""}
                </div>
              </div>
              <div class="col gap-6" style="align-items:flex-end">
                ${App.Components.fieldChip(f.state)}
                ${App.Components.confidenceMini(f.confidence)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  App.Pages.returnReview = {
    title: "Return Review",
    wide: true,
    crumbs: (p) => [{ label: "Returns", hash: "#/returns" }, { label: D.returns.find(r=>r.id===p.id)?.clientName || p.id, hash: `#/returns/${p.id}` }, { label: "Review" }],
    render: (params) => {
      const ret = D.returns.find(r => r.id === params.id);
      if (!ret) return `<div class="empty-state">Return not found.</div>`;
      const fields = D.fields.filter(f => f.returnId === ret.id);

      if (!fields.length) {
        return `
          ${tabs(ret.id, "review")}
          <div class="empty-state card card-pad">
            No field-level traceability data was seeded for this demo return.
            <div class="mt-12"><a class="link-btn" data-action="go" data-hash="#/returns/r_maria/review">Open Rahul Shetty's return to see full traceability →</a></div>
          </div>
        `;
      }

      const ui = App.State.state.ui = App.State.state.ui || {};
      const selectedId = ui.selectedField && fields.some(f => f.id === ui.selectedField) ? ui.selectedField : fields[0].id;
      const selected = fields.find(f => f.id === selectedId);
      const ai = D.aiOutputs.find(a => a.fieldId === selectedId);
      const groups = {};
      fields.forEach(f => { groups[f.form] = groups[f.form] || []; groups[f.form].push(f); });

      const primarySrc = selected.sources.find(s => s.docId) || null;
      const primaryDoc = primarySrc ? D.documents.find(d => d.id === primarySrc.docId) : null;

      return `
        ${tabs(ret.id, "review")}
        <div class="row between mb-16" style="align-items:baseline">
          <div class="small muted">Click any field to see exactly where it came from. Dashed underline = editable; lock icon = system-calculated.</div>
          <a class="link-btn small" data-action="go" data-hash="#/design-system">Legend ${U.icon("info")}</a>
        </div>
        <div class="trace-split">
          <div>
            ${Object.keys(groups).map(g => fieldGroup(g, groups[g], selectedId)).join("")}
            ${ai ? App.Components.aiPanel(ai) : ""}
          </div>
          <div class="col gap-16 trace-sidebar">
            <div class="doc-preview">
              ${App.Components.docPageViz(primaryDoc, primarySrc?.region, { page: primarySrc?.page })}
            </div>
            <div class="card card-pad">
              <div class="h3 mb-8">Traceability trail</div>
              <div class="trail">
                ${trailSteps(selected).map(s => `
                  <div class="trail-step">
                    <div class="dot">${s.dot}</div>
                    <div class="body">
                      <b>${U.esc(s.title)}</b>
                      <span>${s.body}</span>
                      ${s.docId ? `<div class="mt-4"><button class="link-btn tiny" data-action="open-doc-modal" data-doc="${s.docId}" data-region='${JSON.stringify(s.region||{})}'>View source document ${U.icon("chevronRight")}</button></div>` : ""}
                    </div>
                  </div>
                `).join("")}
              </div>
              ${selected.transformation ? `<div class="divider"></div><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.04em">Calculation applied</div><div class="small mt-4">${U.esc(selected.transformation)}</div>` : ""}
            </div>
          </div>
        </div>
      `;
    },
  };
})(window.App = window.App || {});
