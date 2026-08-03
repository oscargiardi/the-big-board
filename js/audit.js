// =======================================================================
// AUDIT LOG — every mutation records what / old→new / who / when.
// Powers "moved this week", weekly delta, and accountability.
// Backend later: append-only server log with auth + sync.
// =======================================================================

let EVENT_LOG = [];
let _eventId = 0;

function _nowISO() {
  // Anchor demo "now" to week Monday midday so relative dates stay coherent.
  return WEEK_OF + "T11:00:00";
}

/**
 * Business logic: single write path for all board changes.
 * entityType: project | opportunity | invoice | todo | allocation
 */
function recordChange({ entityType, entityId, action, field, from, to, who, at, meta }) {
  const entry = {
    id: "E" + (++_eventId),
    at: at || _nowISO(),
    who: who || DEMO_WHO,
    entityType,
    entityId,
    action: action || "update",
    field: field || null,
    from: from === undefined ? null : from,
    to: to === undefined ? null : to,
    meta: meta || null,
  };
  EVENT_LOG.unshift(entry);
  persistAudit();
  return entry;
}

function persistAudit() {
  try {
    localStorage.setItem(STORAGE_KEYS.eventLog, JSON.stringify({
      nextId: _eventId,
      events: EVENT_LOG.slice(0, 200),
    }));
  } catch (_) { /* ignore quota */ }
}

function loadAudit() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.eventLog);
    if (!raw) return false;
    const data = JSON.parse(raw);
    EVENT_LOG = data.events || [];
    _eventId = data.nextId || EVENT_LOG.length;
    return EVENT_LOG.length > 0;
  } catch (_) {
    return false;
  }
}

/** Seed log from MOVED_THIS_WEEK so the Monday issue already has history. */
function seedAuditFromMoved(movedMap, projects) {
  if (loadAudit()) return;
  Object.keys(movedMap || {}).forEach(pid => {
    const p = projects.find(x => x.id === pid);
    if (!p) return;
    const key = movedMap[pid];
    const stage = (p.pipeline || []).find(s => s.key === key);
    recordChange({
      entityType: "project",
      entityId: pid,
      action: "stage_complete",
      field: "pipeline.closed",
      from: false,
      to: true,
      at: WEEK_OF + "T11:05:00",
      who: p.lead || DEMO_WHO,
      meta: { stageKey: key, label: stage ? stage.label : key, value: stage ? stage.value : 0 },
    });
  });
}

/** Events since the board week Monday (inclusive). */
function eventsThisWeek() {
  const start = WEEK_OF;
  return EVENT_LOG.filter(e => (e.at || "").slice(0, 10) >= start);
}

/** Stage completions this week — drives Projects "Moved this week" total. */
function movedThisWeekFromLog() {
  return eventsThisWeek().filter(e => e.action === "stage_complete");
}

function resetDemoStorage() {
  Object.values(STORAGE_KEYS).forEach(k => {
    try { localStorage.removeItem(k); } catch (_) {}
  });
  location.reload();
}

function renderWeekDelta(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const week = eventsThisWeek();
  if (!week.length) {
    el.innerHTML = `<div class="week-delta-empty">No moves recorded this week yet.</div>`;
    return;
  }
  el.innerHTML = week.slice(0, 12).map(e => {
    const label = e.meta && e.meta.label
      ? e.meta.label
      : (e.field || e.action);
    const code = (typeof PROJECTS !== "undefined" && PROJECTS.find(p => p.id === e.entityId))
      ? PROJECTS.find(p => p.id === e.entityId).code
      : e.entityId;
    return `
      <div class="week-delta-row">
        <span class="wd-who">${escapeHtmlSafe(e.who)}</span>
        <span class="wd-action">${escapeHtmlSafe(e.action.replace(/_/g, " "))}</span>
        <span class="wd-what">${escapeHtmlSafe(code)} · ${escapeHtmlSafe(String(label))}</span>
      </div>
    `;
  }).join("");
}

function escapeHtmlSafe(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
