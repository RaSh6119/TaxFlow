(function (App) {
  const D = {};

  D.roles = [
    { id: "client_individual", label: "Client — Individual Taxpayer", group: "client" },
    { id: "client_business", label: "Client — Business Owner", group: "client" },
    { id: "preparer", label: "Tax Preparer", group: "staff" },
    { id: "reviewer", label: "Reviewer", group: "staff" },
    { id: "admin", label: "Firm Administrator", group: "staff" },
    { id: "seasonal", label: "Seasonal Staff", group: "staff" },
  ];

  D.users = [
    { id: "u_maria", name: "Rahul Shetty", initials: "RS", role: "client_individual", isNew: true, returnIds: ["r_maria"] },
    { id: "u_david", name: "Sangram More", initials: "SM", role: "client_business", isNew: false, returnIds: ["r_david"] },
    { id: "u_priya", name: "Aditya Singh", initials: "AS", role: "preparer", title: "Senior Tax Preparer",
      extraRole: "client_individual", personalReturnId: "r_priya",
      assignedReturnIds: ["r_maria","r_david","r_singh","r_lopez","r_kim","r_alvarez","r_nguyen","r_brooks","r_priya"] },
    { id: "u_tom", name: "Saksham Khatwani", initials: "SK", role: "reviewer", title: "Review Manager",
      assignedReturnIds: ["r_singh","r_lopez","r_kim","r_alvarez","r_nguyen","r_brooks"] },
    { id: "u_sam", name: "Gyanig Kumar", initials: "GK", role: "admin", title: "Firm Administrator" },
    { id: "u_jenna", name: "Vamshi Pathi", initials: "VP", role: "seasonal", title: "Seasonal Preparer",
      assignedReturnIds: ["r_wells","r_diaz"] },
  ];

  D.getUser = (id) => D.users.find(u => u.id === id);
  D.getRoleMeta = (id) => D.roles.find(r => r.id === id);

  D.statuses = [
    { id: "not_started",     label: "Not Started",          owner: "firm",   color: "slate",  step: 0 },
    { id: "gathering_docs",  label: "Gathering Documents",  owner: "client", color: "amber",  step: 1 },
    { id: "in_preparation",  label: "In Preparation",       owner: "firm",   color: "blue",   step: 2 },
    { id: "needs_input",     label: "Needs Your Input",     owner: "client", color: "amber",  step: 2 },
    { id: "in_review",       label: "In Review",            owner: "firm",   color: "violet", step: 3 },
    { id: "ready_to_sign",   label: "Ready for Signature",  owner: "client", color: "amber",  step: 4 },
    { id: "filed",           label: "Filed",                owner: "firm",   color: "teal",   step: 5 },
    { id: "accepted",        label: "Accepted",             owner: "none",   color: "green",  step: 6 },
  ];
  D.getStatus = (id) => D.statuses.find(s => s.id === id);

  const DOC_TYPES = [
    { type: "W-2", pages: 1 }, { type: "1099-NEC", pages: 1 }, { type: "1099-DIV", pages: 2 },
    { type: "1099-INT", pages: 1 }, { type: "1099-B", pages: 3 }, { type: "1098 Mortgage Interest", pages: 1 },
    { type: "K-1 (Partnership)", pages: 4 }, { type: "Receipt — Office Supplies", pages: 1 },
    { type: "Receipt — Travel", pages: 1 }, { type: "Bank Statement", pages: 6 },
    { type: "Prior Year Return", pages: 12 }, { type: "Mileage Log", pages: 2 },
    { type: "Charitable Donation Letter", pages: 1 }, { type: "1095-A Health Coverage", pages: 3 },
    { type: "Payroll Report", pages: 5 }, { type: "Invoice", pages: 1 }, { type: "1099-MISC", pages: 1 },
  ];
  const FOLDERS = ["Income", "Deductions", "Business Expenses", "Prior Year", "Correspondence", "Banking"];

  function makeDocs(returnId, clientName, count, seedOffset) {
    const docs = [];
    for (let i = 0; i < count; i++) {
      const dt = DOC_TYPES[(i + seedOffset) % DOC_TYPES.length];
      const folder = FOLDERS[(i + seedOffset) % FOLDERS.length];
      const day = 3 + ((i * 7 + seedOffset) % 26);
      const status = ["extracted", "extracted", "extracted", "needs_review", "reviewed"][(i + seedOffset) % 5];
      docs.push({
        id: `${returnId}_doc${i + 1}`,
        returnId,
        name: `${dt.type} — ${clientName.split(" ")[0]} ${2025}${i > 20 ? " (" + (i) + ")" : ""}`,
        type: dt.type,
        folder,
        pages: dt.pages,
        uploadedBy: i % 4 === 0 ? "firm" : "client",
        uploadedAt: `2026-0${1 + ((i + seedOffset) % 3)}-${String(day).padStart(2, "0")}`,
        status,
        sizeKb: 80 + ((i * 37 + seedOffset) % 900),
      });
    }
    return docs;
  }

  D.returns = [];
  D.documents = [];
  D.fields = [];
  D.aiOutputs = [];
  D.threads = [];
  D.tasks = [];

  const mariaDocs = [
    { id: "doc_w2_acme", returnId: "r_maria", name: "W-2 — Acme Robotics Inc.", type: "W-2", folder: "Income", pages: 1, uploadedBy: "client", uploadedAt: "2026-01-22", status: "reviewed", sizeKb: 210 },
    { id: "doc_w2_globex", returnId: "r_maria", name: "W-2 — Globex Contracting (part-year)", type: "W-2", folder: "Income", pages: 1, uploadedBy: "client", uploadedAt: "2026-01-24", status: "reviewed", sizeKb: 198 },
    { id: "doc_1099int_chase", returnId: "r_maria", name: "1099-INT — Chase Savings", type: "1099-INT", folder: "Income", pages: 1, uploadedBy: "client", uploadedAt: "2026-01-25", status: "extracted", sizeKb: 96 },
    { id: "doc_1099div_schwab", returnId: "r_maria", name: "1099-DIV — Schwab Brokerage", type: "1099-DIV", folder: "Income", pages: 2, uploadedBy: "client", uploadedAt: "2026-01-26", status: "needs_review", sizeKb: 254 },
    { id: "doc_1098_wells", returnId: "r_maria", name: "1098 — Mortgage Interest (Wells Fargo)", type: "1098 Mortgage Interest", folder: "Deductions", pages: 1, uploadedBy: "client", uploadedAt: "2026-01-27", status: "reviewed", sizeKb: 142 },
    { id: "doc_donation_redcross", returnId: "r_maria", name: "Charitable Donation Letter — Red Cross", type: "Charitable Donation Letter", folder: "Deductions", pages: 1, uploadedBy: "client", uploadedAt: "2026-01-28", status: "extracted", sizeKb: 88 },
    { id: "doc_prioryear_maria", returnId: "r_maria", name: "2024 Tax Return (Prior Year)", type: "Prior Year Return", folder: "Prior Year", pages: 9, uploadedBy: "firm", uploadedAt: "2026-01-15", status: "reviewed", sizeKb: 640 },
  ];
  D.documents.push(...mariaDocs, ...makeDocs("r_maria", "Rahul Shetty", 14, 1));

  D.fields.push(
    {
      id: "f_wages", returnId: "r_maria", form: "Form 1040", line: "Line 1a — Wages, salaries, tips",
      value: "$96,420", state: "ai_extracted", editable: true,
      sources: [
        { docId: "doc_w2_acme", page: 1, box: "Box 1", region: { x: 62, y: 18, w: 30, h: 8 }, rawValue: "$71,200" },
        { docId: "doc_w2_globex", page: 1, box: "Box 1", region: { x: 62, y: 18, w: 30, h: 8 }, rawValue: "$25,220" },
      ],
      transformation: "Sum of Box 1 across 2 W-2 forms: $71,200 + $25,220 = $96,420",
      confidence: 98,
    },
    {
      id: "f_interest", returnId: "r_maria", form: "Form 1040", line: "Line 2b — Taxable interest",
      value: "$412", state: "ai_extracted", editable: true,
      sources: [{ docId: "doc_1099int_chase", page: 1, box: "Box 1", region: { x: 55, y: 30, w: 25, h: 6 }, rawValue: "$412" }],
      transformation: "Copied directly from Box 1, no calculation applied.",
      confidence: 99,
    },
    {
      id: "f_dividends", returnId: "r_maria", form: "Form 1040", line: "Line 3b — Ordinary dividends",
      value: "$1,875", state: "needs_review", editable: true,
      sources: [{ docId: "doc_1099div_schwab", page: 1, box: "Box 1a", region: { x: 58, y: 40, w: 25, h: 6 }, rawValue: "$1,875" }],
      transformation: "Copied from Box 1a. Box 1b (qualified) not yet reconciled — flagged for review.",
      confidence: 74,
    },
    {
      id: "f_mortgage_int", returnId: "r_maria", form: "Schedule A", line: "Line 8a — Home mortgage interest",
      value: "$11,340", state: "verified", editable: false,
      sources: [{ docId: "doc_1098_wells", page: 1, box: "Box 1", region: { x: 50, y: 25, w: 30, h: 6 }, rawValue: "$11,340" }],
      transformation: "Copied from Box 1. Verified by Aditya Singh on Jan 30.",
      confidence: 99, verifiedBy: "u_priya", verifiedAt: "2026-01-30",
    },
    {
      id: "f_charity", returnId: "r_maria", form: "Schedule A", line: "Line 11 — Gifts to charity (cash)",
      value: "$2,500", state: "ai_extracted", editable: true,
      sources: [{ docId: "doc_donation_redcross", page: 1, box: "Donation total", region: { x: 30, y: 55, w: 35, h: 8 }, rawValue: "$2,500" }],
      transformation: "Copied directly from donation letter total.",
      confidence: 95,
    },
    {
      id: "f_standard_calc", returnId: "r_maria", form: "Schedule A", line: "Line 17 — Total itemized deductions",
      value: "$13,840", state: "locked", editable: false,
      sources: [{ docId: "doc_1098_wells", page: 1, box: "Calculated", region: null, rawValue: null },
                 { docId: "doc_donation_redcross", page: 1, box: "Calculated", region: null, rawValue: null }],
      transformation: "System calculation: Line 8a ($11,340) + Line 11 ($2,500) = $13,840. Locked — derived field, not directly editable.",
      confidence: 100,
    },
    {
      id: "f_agi", returnId: "r_maria", form: "Form 1040", line: "Line 11 — Adjusted Gross Income",
      value: "$98,707", state: "locked", editable: false,
      sources: [{ docId: null, page: null, box: "Calculated from Lines 1–10", region: null, rawValue: null }],
      transformation: "System calculation: total income ($98,707) minus adjustments ($0).",
      confidence: 100,
    }
  );

  D.aiOutputs.push(
    {
      fieldId: "f_dividends",
      summary: "Flagged for review: qualified dividend amount not reconciled",
      why: "Box 1a (ordinary dividends) was extracted, but Box 1b (qualified dividends) on the same form has a value the model wasn't confident distinguishing from a subtotal line.",
      evidence: [{ docId: "doc_1099div_schwab", page: 1, note: "Box 1a and 1b are close together and the scan is slightly skewed near Box 1b." }],
      confidence: 74,
      uncertainty: "Medium — the ordinary dividend total is reliable; the qualified-dividend split needs a human check.",
      recommendedAction: "Open the source document and confirm Box 1b before filing.",
      status: "open",
    },
    {
      fieldId: "f_wages",
      summary: "Wages combined from two W-2s",
      why: "Two W-2 forms were uploaded for this client (Acme Robotics, full year; Globex Contracting, part-year). Both list the same taxpayer name and SSN, so the model summed Box 1 across both.",
      evidence: [
        { docId: "doc_w2_acme", page: 1, note: "Box 1: $71,200" },
        { docId: "doc_w2_globex", page: 1, note: "Box 1: $25,220" },
      ],
      confidence: 98,
      uncertainty: "Low — both forms matched taxpayer identity with high confidence.",
      recommendedAction: "No action needed. Spot-check if the client mentions a third employer.",
      status: "resolved",
    },
    {
      fieldId: "f_charity",
      summary: "Donation letter total extracted",
      why: "The letter states a single lump-sum cash donation. No in-kind goods were mentioned, so this was classified as a cash gift.",
      evidence: [{ docId: "doc_donation_redcross", page: 1, note: "\"...a cash contribution of $2,500...\"" }],
      confidence: 95,
      uncertainty: "Low.",
      recommendedAction: "No action needed.",
      status: "resolved",
    }
  );

  D.threads.push(
    {
      id: "th_div_question", returnId: "r_maria", subject: "Question about your Schwab 1099-DIV",
      linkedDocId: "doc_1099div_schwab", status: "waiting_on_client", owner: "u_maria",
      messages: [
        { id: "m1", author: "u_priya", internal: false, at: "2026-01-29 09:14", body: "Hi Rahul — quick question on your Schwab 1099-DIV. Box 1b (qualified dividends) looks slightly cut off in the scan. Could you re-upload a clearer copy or confirm the amount is $1,540?" },
        { id: "m2", author: "u_priya", internal: true, at: "2026-01-29 09:15", body: "Internal note: don't file until this is confirmed — affects the qualified dividend tax rate calc." },
      ],
    },
    {
      id: "th_mortgage_confirm", returnId: "r_maria", subject: "Mortgage interest confirmed",
      linkedDocId: "doc_1098_wells", status: "resolved", owner: null,
      messages: [
        { id: "m3", author: "u_priya", internal: false, at: "2026-01-30 11:02", body: "Confirmed your mortgage interest deduction from the Wells Fargo 1098 — no action needed here." },
        { id: "m4", author: "u_maria", internal: false, at: "2026-01-30 14:20", body: "Great, thank you!" },
      ],
    },
    {
      id: "th_general_checkin", returnId: "r_maria", subject: "A couple of outstanding items", status: "waiting_on_client", owner: "u_maria", linkedDocId: null,
      messages: [
        { id: "m5", author: "u_priya", internal: false, at: "2026-02-01 08:40", body: "Two things left before I can finalize: (1) the dividend confirmation above, and (2) your final W-2 if Globex sends a correction. Otherwise you're in great shape!" },
      ],
    }
  );

  const TASK_TYPES = ["Review extracted fields", "Follow up on missing document", "Client call scheduled", "Prepare e-file package", "Resolve AI flag", "QA second review"];

  function addReturn(r) { D.returns.push(r); }

  addReturn({ id: "r_maria", clientId: "u_maria", clientName: "Rahul Shetty", entity: "Individual (1040)",
    preparerId: "u_priya", reviewerId: "u_tom", status: "in_review", blocked: true,
    blockedReason: "Waiting on client to confirm 1099-DIV qualified dividend amount",
    dueDate: "2026-04-15", openItems: 1, priority: "high", year: 2025 });

  addReturn({ id: "r_david", clientId: "u_david", clientName: "Sangram More", entity: "S-Corp (1120-S)",
    preparerId: "u_priya", reviewerId: "u_tom", status: "gathering_docs", blocked: false,
    dueDate: "2026-03-15", openItems: 4, priority: "medium", year: 2025 });

  addReturn({ id: "r_priya", clientId: "u_priya", clientName: "Aditya Singh (personal)", entity: "Individual (1040)",
    preparerId: "u_tom", reviewerId: null, status: "not_started", blocked: false,
    dueDate: "2026-04-15", openItems: 0, priority: "low", year: 2025 });

  addReturn({ id: "r_singh", clientId: null, clientName: "Sanskar Mishra", entity: "Individual (1040)",
    preparerId: "u_priya", reviewerId: "u_tom", status: "needs_input", blocked: true,
    blockedReason: "Missing 1098-T for education credit", dueDate: "2026-02-20", openItems: 2, priority: "high", year: 2025 });

  addReturn({ id: "r_lopez", clientId: null, clientName: "Aditya Dhuri", entity: "Individual (1040)",
    preparerId: "u_priya", reviewerId: "u_tom", status: "in_preparation", blocked: false,
    dueDate: "2026-03-01", openItems: 1, priority: "medium", year: 2025 });

  addReturn({ id: "r_kim", clientId: null, clientName: "Meet Surti", entity: "Individual (1040)",
    preparerId: "u_priya", reviewerId: "u_tom", status: "ready_to_sign", blocked: false,
    dueDate: "2026-02-10", openItems: 0, priority: "high", year: 2025 });

  addReturn({ id: "r_alvarez", clientId: null, clientName: "Manas Dalvi", entity: "Partnership (1065)",
    preparerId: "u_priya", reviewerId: "u_tom", status: "in_review", blocked: false,
    dueDate: "2026-03-15", openItems: 3, priority: "medium", year: 2025 });

  addReturn({ id: "r_nguyen", clientId: null, clientName: "Kedar Deshpande", entity: "Individual (1040)",
    preparerId: "u_priya", reviewerId: "u_tom", status: "filed", blocked: false,
    dueDate: "2026-01-31", openItems: 0, priority: "low", year: 2025 });

  addReturn({ id: "r_brooks", clientId: null, clientName: "Jai Pagdhare", entity: "Individual (1040)",
    preparerId: "u_priya", reviewerId: "u_tom", status: "accepted", blocked: false,
    dueDate: "2026-01-20", openItems: 0, priority: "low", year: 2025 });

  addReturn({ id: "r_wells", clientId: null, clientName: "Neel Korlekar", entity: "Individual (1040)",
    preparerId: "u_jenna", reviewerId: "u_tom", status: "needs_input", blocked: true,
    blockedReason: "Client has not responded to childcare credit question", dueDate: "2026-02-05", openItems: 2, priority: "high", year: 2025 });

  addReturn({ id: "r_diaz", clientId: null, clientName: "Tejas Naik", entity: "Individual (1040)",
    preparerId: "u_jenna", reviewerId: "u_tom", status: "gathering_docs", blocked: false,
    dueDate: "2026-03-20", openItems: 5, priority: "low", year: 2025 });

  const extraNames = ["Darshit Patel","Rajat Naoghare","Hrishikesh Lokhande","Adwait Kaundanya","Yash Bhosale","Omkar Ghadge","Siddharth Kulkarni","Pranav Joshi","Rohan Sawant","Aryan Chavan","Karthik Iyer","Nikhil Rane"];
  extraNames.forEach((name, i) => {
    const statusPool = ["gathering_docs","in_preparation","needs_input","in_review","ready_to_sign","filed"];
    const id = "r_extra" + i;
    addReturn({
      id, clientId: null, clientName: name, entity: i % 3 === 0 ? "S-Corp (1120-S)" : "Individual (1040)",
      preparerId: "u_priya", reviewerId: "u_tom",
      status: statusPool[i % statusPool.length],
      blocked: i % 4 === 0,
      blockedReason: i % 4 === 0 ? "Awaiting signed engagement letter" : null,
      dueDate: `2026-0${2 + (i % 3)}-${String(5 + i).padStart(2,"0")}`,
      openItems: i % 5, priority: ["high","medium","low"][i % 3], year: 2025,
    });
    D.documents.push(...makeDocs(id, name, 12 + (i % 10), i + 3));
  });

  D.documents.push(...makeDocs("r_david", "Sangram More", 26, 9));
  D.documents.push(...makeDocs("r_alvarez", "Manas Dalvi", 30, 15));

  let taskSeq = 1;
  D.returns.forEach((r, i) => {
    if (r.status === "accepted") return;
    const count = r.blocked ? 2 : (r.openItems > 0 ? 1 : (i % 3 === 0 ? 1 : 0));
    for (let k = 0; k < count; k++) {
      const type = r.blocked && k === 0 ? "Resolve AI flag" : TASK_TYPES[(i + k) % TASK_TYPES.length];
      const urgencyDays = (new Date(r.dueDate) - new Date("2026-02-02")) / 86400000;
      D.tasks.push({
        id: "t" + (taskSeq++),
        returnId: r.id,
        clientName: r.clientName,
        assigneeId: r.preparerId,
        type,
        dueDate: r.dueDate,
        urgencyDays: Math.round(urgencyDays),
        blocked: r.blocked && k === 0,
        priority: r.priority,
      });
    }
  });

  D.onboardingChecklist = [
    { id: "ob_engage", label: "Sign your engagement letter", detail: "A quick e-signature authorizing Aditya to prepare your 2025 return.", done: true, minutes: 2 },
    { id: "ob_upload", label: "Upload your tax documents", detail: "W-2s, 1099s, and anything else you'd normally hand your preparer.", done: false, minutes: 10, current: true, hash: "#/documents" },
    { id: "ob_questionnaire", label: "Answer a short questionnaire", detail: "Life changes, dependents, and deduction questions — about 12 questions.", done: false, minutes: 8 },
    { id: "ob_review", label: "Review & sign your return", detail: "Once Aditya finishes preparing it, you'll review and e-sign here.", done: false, minutes: 15, locked: true },
  ];

  function firstDoc(rid) { return D.documents.find(d => d.returnId === rid); }
  D.aiFlags = [
    { id: "flag1", returnId: "r_maria", fieldId: "f_dividends", summary: "Qualified dividend split unreconciled", confidence: 74, status: "open",
      why: "Box 1a and 1b on the 1099-DIV are adjacent and the scan is slightly skewed near Box 1b.",
      evidenceDoc: "doc_1099div_schwab", uncertainty: "Medium", recommendedAction: "Confirm Box 1b with the client before filing." },
    { id: "flag2", returnId: "r_singh", fieldId: null, summary: "Possible missing Form 1098-T", confidence: 61, status: "open",
      why: "The prior-year return claimed an education credit, but no 1098-T has been uploaded this year.",
      evidenceDoc: firstDoc("r_singh")?.id, uncertainty: "Medium-high — could mean the credit no longer applies.", recommendedAction: "Ask the client whether they're still enrolled." },
    { id: "flag3", returnId: "r_david", fieldId: null, summary: "Business meal expenses above typical range", confidence: 68, status: "open",
      why: "Meal & entertainment deductions are 3.2x higher than this client's prior-year average.",
      evidenceDoc: firstDoc("r_david")?.id, uncertainty: "Medium — could be legitimate business growth.", recommendedAction: "Request an itemized breakdown before including the full amount." },
    { id: "flag4", returnId: "r_wells", fieldId: null, summary: "Childcare credit needs dependent confirmation", confidence: 55, status: "open",
      why: "A childcare expense was found in bank statements, but no dependent has been confirmed for this tax year.",
      evidenceDoc: firstDoc("r_wells")?.id, uncertainty: "High — credit cannot be applied without confirmation.", recommendedAction: "Follow up with client directly; currently unanswered." },
    { id: "flag5", returnId: "r_alvarez", fieldId: null, summary: "K-1 allocation percentages sum to 98%", confidence: 82, status: "open",
      why: "Partner allocation percentages across all K-1s for this partnership total 98%, not 100%.",
      evidenceDoc: firstDoc("r_alvarez")?.id, uncertainty: "Low-medium — likely a rounding issue but should be confirmed.", recommendedAction: "Verify with the partnership's accountant." },
    { id: "flag6", returnId: "r_maria", fieldId: "f_wages", summary: "Wages combined from two W-2 forms", confidence: 98, status: "resolved",
      why: "Two W-2s matched taxpayer identity with high confidence and were summed.",
      evidenceDoc: "doc_w2_acme", uncertainty: "Low", recommendedAction: "No action needed." },
    { id: "flag7", returnId: "r_kim", fieldId: null, summary: "Estimated tax payments may be underreported", confidence: 71, status: "resolved",
      why: "Bank statements show 3 estimated payments; only 2 were entered.",
      evidenceDoc: firstDoc("r_kim")?.id, uncertainty: "Medium.", recommendedAction: "Reviewed and corrected by Saksham Khatwani on Jan 28." },
    { id: "flag8", returnId: "r_lopez", fieldId: null, summary: "Home office square footage inconsistent with prior year", confidence: 64, status: "open",
      why: "Prior year claimed 180 sq ft; this year's documents suggest 240 sq ft with no explanation on file.",
      evidenceDoc: firstDoc("r_lopez")?.id, uncertainty: "Medium.", recommendedAction: "Ask client if they moved or remodeled." },
  ];

  App.Data = D;
})(window.App = window.App || {});
