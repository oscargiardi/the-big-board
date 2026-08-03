// =======================================================================
// READY TO INVOICE QUEUE
// Business logic: when a sub-stage is marked complete, its $ value drops
// into a queue for accounts. Marking "Invoiced" clears it from the queue.
// Backend later: sync to Xero/MYOB; permissions for accounts role only.
// =======================================================================

let INVOICE_QUEUE = [];

function invoiceItemId(projectId, stageKey) {
  return projectId + "::" + stageKey;
}

function loadInvoiceQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.invoiceQueue);
    if (raw) INVOICE_QUEUE = JSON.parse(raw);
  } catch (_) {
    INVOICE_QUEUE = [];
  }
}

function persistInvoiceQueue() {
  try {
    localStorage.setItem(STORAGE_KEYS.invoiceQueue, JSON.stringify(INVOICE_QUEUE));
  } catch (_) {}
}

function getOpenInvoiceQueue() {
  return INVOICE_QUEUE.filter(i => !i.invoicedAt);
}

function invoiceQueueTotal() {
  return getOpenInvoiceQueue().reduce((s, i) => s + (i.value || 0), 0);
}

/**
 * Seed queue from stages already closed this week (MOVED_THIS_WEEK),
 * so accounts sees work ready without re-clicking.
 */
function seedInvoiceQueueFromMoved(projects) {
  loadInvoiceQueue();
  if (INVOICE_QUEUE.length) return;

  projects.forEach(p => {
    (p.pipeline || []).forEach(stage => {
      if (!stage.closed || !stage.movedThisWeek) return;
      pushInvoiceItem(p, stage, { silent: true, at: stage.closedDate || WEEK_OF });
    });
  });
  persistInvoiceQueue();
}

function pushInvoiceItem(project, stage, opts) {
  opts = opts || {};
  const id = invoiceItemId(project.id, stage.key);
  if (INVOICE_QUEUE.some(i => i.id === id)) return null;

  const item = {
    id,
    projectId: project.id,
    code: project.code,
    name: project.name || project.code,
    stageKey: stage.key,
    label: stage.label,
    value: stage.value,
    closedDate: opts.at || WEEK_OF,
    invoicedAt: null,
  };
  INVOICE_QUEUE.unshift(item);
  if (!opts.silent) {
    recordChange({
      entityType: "invoice",
      entityId: id,
      action: "ready_to_invoice",
      field: "queue",
      from: null,
      to: stage.value,
      meta: { projectId: project.id, stageKey: stage.key, label: stage.label, value: stage.value },
    });
    persistInvoiceQueue();
  }
  return item;
}

function removeInvoiceItem(projectId, stageKey) {
  const id = invoiceItemId(projectId, stageKey);
  const idx = INVOICE_QUEUE.findIndex(i => i.id === id && !i.invoicedAt);
  if (idx === -1) return;
  const item = INVOICE_QUEUE[idx];
  INVOICE_QUEUE.splice(idx, 1);
  recordChange({
    entityType: "invoice",
    entityId: id,
    action: "queue_remove",
    field: "queue",
    from: item.value,
    to: null,
    meta: { projectId, stageKey },
  });
  persistInvoiceQueue();
}

function markInvoiced(itemId) {
  const item = INVOICE_QUEUE.find(i => i.id === itemId);
  if (!item || item.invoicedAt) return;
  item.invoicedAt = WEEK_OF;
  recordChange({
    entityType: "invoice",
    entityId: itemId,
    action: "invoiced",
    field: "invoicedAt",
    from: null,
    to: item.invoicedAt,
    meta: { projectId: item.projectId, value: item.value, label: item.label },
  });
  persistInvoiceQueue();
}

/**
 * Toggle a pipeline sub-stage closed/open.
 * Closing → invoice queue. Re-opening (if not invoiced) → remove from queue.
 */
function togglePipelineStage(project, stageKey) {
  const stage = (project.pipeline || []).find(s => s.key === stageKey);
  if (!stage) return;

  if (!stage.closed) {
    stage.closed = true;
    stage.closedDate = WEEK_OF;
    stage.movedThisWeek = true;
    pushInvoiceItem(project, stage);
    recordChange({
      entityType: "project",
      entityId: project.id,
      action: "stage_complete",
      field: "pipeline.closed",
      from: false,
      to: true,
      meta: { stageKey, label: stage.label, value: stage.value },
    });
  } else {
    const qItem = INVOICE_QUEUE.find(
      i => i.projectId === project.id && i.stageKey === stageKey
    );
    if (qItem && qItem.invoicedAt) return; // locked once invoiced
    stage.closed = false;
    stage.closedDate = null;
    stage.movedThisWeek = false;
    removeInvoiceItem(project.id, stageKey);
    recordChange({
      entityType: "project",
      entityId: project.id,
      action: "stage_reopen",
      field: "pipeline.closed",
      from: true,
      to: false,
      meta: { stageKey, label: stage.label, value: stage.value },
    });
  }
}

function renderInvoiceQueue(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const open = getOpenInvoiceQueue();
  const totalEl = document.getElementById("proj-total-invoice");
  if (totalEl) {
    totalEl.textContent = open.length
      ? fmtCurrency(invoiceQueueTotal()) + " · " + open.length
      : "—";
  }

  if (!open.length) {
    el.innerHTML = `<div class="invoice-empty empty-state">Nothing ready to invoice — complete a sub-stage on a project pipeline.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="invoice-queue-head">
      <span class="invoice-queue-title">Ready to invoice</span>
      <span class="invoice-queue-sub">Closed sub-stages awaiting accounts</span>
    </div>
    <div class="invoice-queue-list">
      ${open.map(i => `
        <div class="invoice-row" data-invoice-id="${i.id}">
          <div class="inv-code">${escapeHtmlSafe(i.code)}</div>
          <div class="inv-label">${escapeHtmlSafe(i.label)}</div>
          <div class="inv-value">${fmtCurrency(i.value)}</div>
          <div class="inv-date">${i.closedDate ? fmtDayMonthShort(i.closedDate) : "—"}</div>
          <button type="button" class="inv-mark todo-btn">Mark invoiced</button>
        </div>
      `).join("")}
    </div>
  `;

  el.querySelectorAll(".inv-mark").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".invoice-row");
      markInvoiced(row.dataset.invoiceId);
      if (typeof renderProjects === "function") renderProjects();
      if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
    });
  });
}
