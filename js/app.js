// =======================================================================
// THE BIG BOARD — app.js
// Wires up nav, calendar, opportunities, people, design support.
// Reads PROJECTS / LEADS / STAGES from data.js.
// =======================================================================

// ---------- LOGIN GATE ----------
// In-memory only — resets on reload. Single user for the demo.
const VALID_LOGIN = { user: "mitchj", pass: "123456" };
(function setupLogin() {
  const screen = document.getElementById("login-screen");
  const app = document.getElementById("app");
  const form = document.getElementById("login-form");
  const userInput = document.getElementById("login-user");
  const passInput = document.getElementById("login-pass");
  const errorEl = document.getElementById("login-error");

  userInput.focus();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = userInput.value.trim().toLowerCase();
    const p = passInput.value;
    if (u === VALID_LOGIN.user && p === VALID_LOGIN.pass) {
      screen.style.display = "none";
      app.classList.remove("locked");
      errorEl.textContent = "";
      if (typeof showToast === "function") showToast("Welcome back, Mitch — board is live", { tone: "success" });
      if (typeof revealOnboarding === "function") revealOnboarding();
    } else {
      errorEl.textContent = "Incorrect username or password.";
      passInput.value = "";
      passInput.focus();
      if (typeof showToast === "function") showToast("Sign-in failed", { tone: "danger", duration: 2200 });
    }
  });
})();

// ---------- date helpers ----------
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Mon","Tue","Wed","Thu","Fri","Sat"]; // Mon-Sat per spec
const DOW_FULL_7 = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function parseISO(s)  { return new Date(s + "T00:00:00"); }
function fmtISO(d)    { return d.toISOString().slice(0,10); }
function addDays(d,n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function mondayOf(d)  { const x = new Date(d); const day = (x.getDay()+6)%7; x.setDate(x.getDate()-day); return x; }
function fmtDayMonth(s) { const d = parseISO(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function fmtFullDate(s) { const d = parseISO(s); return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`; }
function isoWeekNumber(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
}

const WEEK_MONDAY = parseISO(WEEK_OF);
const TODAY = WEEK_MONDAY; // For demo we anchor "today" to the week's Monday

// ---------- nav ----------
const navButtons = document.querySelectorAll("#nav button");
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const view = document.getElementById("view-" + btn.dataset.view);
    if (view) view.classList.add("active");
    if (btn.dataset.view === "project-list") {
      // Always return to the list when choosing the Projects tab
      if (typeof closeProjectHome === "function") closeProjectHome();
      else if (typeof renderProjectList === "function") renderProjectList();
    }
  });
});

// =======================================================================
// TOOLTIP
// =======================================================================
const tooltipEl = document.getElementById("tooltip");

function showTooltip(evt, project) {
  const stageLabel = STAGES[project.stage].label;
  const lead = LEADS[project.lead];
  const teamInitials = (project.team || []).map(t => TEAM_INITIALS[t] || "").filter(Boolean).join(" · ");

  tooltipEl.innerHTML = `
    <div class="t-code">${project.code} · ${stageLabel}</div>
    <div class="t-title">${escapeHtml(project.blurb.split(" — ")[0] || project.code)}</div>
    <div class="t-detail">${escapeHtml(project.hoverDetail)}</div>
    <dl class="t-meta">
      <dt>Lead</dt><dd>${project.lead} · ${lead.name}</dd>
      <dt>Team</dt><dd>${teamInitials || "—"}</dd>
      ${project.stageClose ? `<dt>Stage close</dt><dd>${fmtFullDate(project.stageClose)}</dd>` : ""}
      ${project.completion ? `<dt>Forecast PC</dt><dd>${fmtFullDate(project.completion)}</dd>` : ""}
      <dt>This week</dt><dd>${escapeHtml(project.weekPriority)}</dd>
    </dl>
  `;
  positionTooltip(evt);
  tooltipEl.classList.add("visible");
}
function moveTooltip(evt) { positionTooltip(evt); }
function hideTooltip() { tooltipEl.classList.remove("visible"); }
function positionTooltip(evt) {
  const pad = 14;
  const w = tooltipEl.offsetWidth || 320;
  const h = tooltipEl.offsetHeight || 200;
  let x = evt.clientX + pad;
  let y = evt.clientY + pad;
  if (x + w > window.innerWidth - 10)  x = evt.clientX - w - pad;
  if (y + h > window.innerHeight - 10) y = evt.clientY - h - pad;
  tooltipEl.style.left = x + "px";
  tooltipEl.style.top  = y + "px";
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

// =======================================================================
// OVERVIEW — metrics + hyper list
// =======================================================================
function renderOverview() {
  const counts = { opportunity:0, frontend:0, documentation:0, support:0 };
  PROJECTS.forEach(p => counts[p.stage]++);
  const hyperCount = PROJECTS.filter(p => p.hyper).length;

  document.getElementById("metrics").innerHTML = `
    <div class="metric metric-all">
      <div class="metric-label">Live Projects</div>
      <div class="metric-value">${PROJECTS.length}</div>
      <div class="metric-sub">across all stages</div>
    </div>
    <div class="metric metric-opp">
      <div class="metric-label">Opportunities</div>
      <div class="metric-value" style="color: var(--green)">${counts.opportunity}</div>
      <div class="metric-sub">pitches &amp; feasibility</div>
    </div>
    <div class="metric metric-active">
      <div class="metric-label">In Design / Doc</div>
      <div class="metric-value" style="color: var(--blue)">${counts.frontend + counts.documentation}</div>
      <div class="metric-sub">${counts.frontend} FED · ${counts.documentation} DOC</div>
    </div>
    <div class="metric metric-hyper">
      <div class="metric-label">Hyper Priorities</div>
      <div class="metric-value" style="color: var(--hyper)">${hyperCount}</div>
      <div class="metric-sub">needing the push</div>
    </div>
  `;

  const hyperList = PROJECTS.filter(p => p.hyper);
  document.getElementById("hyper-list").innerHTML = hyperList.map(p => `
    <div class="hyper-card" data-open-project="${p.id}" role="button" tabindex="0">
      <div class="code">${p.code} · ${STAGES[p.stage].label} · Lead ${p.lead}</div>
      <div class="title">${escapeHtml(p.blurb.split(" — ")[0])}</div>
      <div class="priority">"${escapeHtml(p.weekPriority)}"</div>
      <div class="meta">
        ${p.stageClose ? `<span>Stage close · ${fmtFullDate(p.stageClose)}</span>` : ""}
        <span>Team · ${p.team.map(t=>TEAM_INITIALS[t]).join(" / ") || "—"}</span>
      </div>
    </div>
  `).join("") || `<div style="font-style:italic;color:var(--muted);">No hyper priorities flagged this week.</div>`;
  document.querySelectorAll("#hyper-list .hyper-card[data-open-project]").forEach(card => {
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (typeof openProjectHome === "function") openProjectHome(card.getAttribute("data-open-project"));
      }
    });
  });
  if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
}

// =======================================================================
// KEY DATES — agenda of stage closes, PCs, milestones
// =======================================================================
function collectKeyDates() {
  const items = [];

  PROJECTS.forEach(p => {
    const title = (p.name || p.blurb || p.code || "").split(" — ")[0];
    const stageLabel = STAGES[p.stage] ? STAGES[p.stage].label : p.stage;
    const color = STAGES[p.stage] ? STAGES[p.stage].color : "";

    if (p.stageClose) {
      items.push({
        date: p.stageClose,
        type: "stage_close",
        typeLabel: "Stage close",
        code: p.code,
        title,
        lead: p.lead,
        stage: p.stage,
        stageLabel,
        color,
        hyper: !!p.hyper,
        project: p,
      });
    }

    const pc = p.pcDate || p.completion;
    if (pc) {
      items.push({
        date: pc,
        type: "pc",
        typeLabel: p.stage === "support" ? "Practical completion" : "Forecast PC",
        code: p.code,
        title,
        lead: p.lead,
        stage: p.stage,
        stageLabel,
        color,
        hyper: !!p.hyper,
        project: p,
      });
    }

    (p.dueDates || []).forEach(m => {
      if (!m.date) return;
      items.push({
        date: m.date,
        type: "milestone",
        typeLabel: m.label || "Milestone",
        code: p.code,
        title,
        lead: p.lead,
        stage: p.stage,
        stageLabel,
        color,
        hyper: !!p.hyper,
        project: p,
      });
    });
  });

  items.sort((a, b) => a.date.localeCompare(b.date) || a.code.localeCompare(b.code));
  return items;
}

function keyDateBucket(iso) {
  const d = parseISO(iso);
  const thisWeekEnd = addDays(WEEK_MONDAY, 6);
  const nextTwoEnd = addDays(WEEK_MONDAY, 20);
  if (d < WEEK_MONDAY) return "past";
  if (d <= thisWeekEnd) return "this";
  if (d <= nextTwoEnd) return "next";
  return "later";
}

function renderCalendar() {
  renderKeyDates();
}

function renderKeyDates() {
  const root = document.getElementById("key-dates");
  if (!root) return;

  const all = collectKeyDates();
  const buckets = {
    past: { label: "Overdue / earlier", items: [] },
    this: { label: "This week", items: [] },
    next: { label: "Next two weeks", items: [] },
    later: { label: "Later", items: [] },
  };

  all.forEach(item => {
    buckets[keyDateBucket(item.date)].items.push(item);
  });

  const order = ["this", "next", "later", "past"];
  const sections = order.filter(k => buckets[k].items.length);

  if (!sections.length) {
    root.innerHTML = `<div class="empty-state">No key dates on the board yet.</div>`;
    return;
  }

  root.innerHTML = sections.map(key => {
    const sec = buckets[key];
    return `
      <div class="kd-section${key === "past" ? " kd-past" : ""}${key === "this" ? " kd-this" : ""}">
        <div class="kd-section-head">
          <span>${sec.label}</span>
          <span class="kd-count">${sec.items.length}</span>
        </div>
        <div class="kd-list">
          ${sec.items.map(item => `
            <button type="button" class="kd-row${item.hyper ? " hyper" : ""}" data-open-project="${item.project.id}">
              <div class="kd-date">
                <span class="kd-dow">${DOW_FULL_7[(parseISO(item.date).getDay() + 6) % 7]}</span>
                <span class="kd-daynum">${fmtDayMonth(item.date)}</span>
              </div>
              <div class="kd-body">
                <div class="kd-top">
                  <span class="kd-code">${escapeHtml(item.code)}</span>
                  <span class="kd-type">${escapeHtml(item.typeLabel)}</span>
                  ${item.hyper ? `<span class="kd-hyper">Hyper</span>` : ""}
                </div>
                <div class="kd-title">${escapeHtml(item.title)}</div>
                <div class="kd-meta">
                  <span class="kd-swatch ${item.color}"></span>
                  ${escapeHtml(item.stageLabel)} · Lead ${escapeHtml(item.lead)}
                </div>
              </div>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");

  root.querySelectorAll(".kd-row").forEach(row => {
    const p = PROJECTS.find(pp => pp.id === row.getAttribute("data-open-project"));
    if (!p) return;
    row.addEventListener("mouseenter", e => showTooltip(e, p));
    row.addEventListener("mousemove", moveTooltip);
    row.addEventListener("mouseleave", hideTooltip);
  });
}

// Legacy helpers kept for Design Support / any residual callers
function projectsForDay(dayISO) {
  const list = [];
  PROJECTS.forEach(p => {
    if (p.stage === "support") return;
    if (p.stageClose && p.stageClose === dayISO) list.push(p);
  });
  return list;
}

function milestonesForDay(dayISO) {
  const list = [];
  PROJECTS.forEach(p => {
    (p.dueDates || []).forEach(m => {
      if (m.date === dayISO) list.push({ ...m, code: p.code });
    });
  });
  return list;
}

// =======================================================================
// OPPORTUNITIES
// =======================================================================
// =======================================================================
// OPPORTUNITIES — heat, value, sort, won/lost actions, archive
// =======================================================================

// Heat levels ordered hottest first
const HEAT_LEVELS = ["cool", "simmer", "hot", "cookin"];
const HEAT_LABELS = { cool: "Cool", simmer: "Simmer", hot: "Hot", cookin: "Cookin'" };
const HEAT_RANK   = { cool: 0, simmer: 1, hot: 2, cookin: 3 };

// Seed heat + value + status onto existing opportunity-stage projects.
// Runs once. New opps created via modal already have these fields.
(function seedOpportunityFields() {
  const heatSeed = {
    P01: { heat: "cookin", value: 220000 },  // hyper — must be hot
    P02: { heat: "hot",    value: 180000 },
    P03: { heat: "simmer", value: 320000 },
    P04: { heat: "cool",   value: 95000 },
    P05: { heat: "hot",    value: 145000 },
    P06: { heat: "simmer", value: 110000 },
    P07: { heat: "simmer", value: 75000 },
  };
  PROJECTS.forEach(p => {
    if (p.stage !== "opportunity") return;
    const seed = heatSeed[p.id] || { heat: "simmer", value: 50000 };
    p.heat = seed.heat;
    p.estimatedValue = seed.value;
    p.status = "active"; // active | won | lost
  });
})();

// Current sort mode
let OPP_SORT = "heat";

function renderOpportunities() {
  const grid = document.getElementById("opp-grid");
  const archivedSection = document.getElementById("opp-archived");
  const archivedGrid = document.getElementById("opp-archived-grid");
  const archivedCount = document.getElementById("opp-archived-count");

  if (typeof renderWeightedForecast === "function") {
    renderWeightedForecast("opp-forecast", PROJECTS, WEEK_OF);
  }

  // Active opps only (won have been converted; lost go to archive)
  let active = PROJECTS.filter(p => p.stage === "opportunity" && p.status === "active");

  // Sort
  if (OPP_SORT === "heat") {
    active.sort((a, b) => HEAT_RANK[b.heat] - HEAT_RANK[a.heat]);
  } else if (OPP_SORT === "lead") {
    active.sort((a, b) => a.lead.localeCompare(b.lead));
  } else if (OPP_SORT === "value") {
    active.sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0));
  }

  grid.innerHTML = active.map(p => renderOppCard(p)).join("") ||
    `<div style="grid-column:1/-1;font-style:italic;color:var(--muted);padding:24px;text-align:center;">No active opportunities. Add one to get started.</div>`;
  // Wire interactions for each card
  grid.querySelectorAll(".opp-card").forEach(card => {
    const id = card.dataset.projectId;
    const p = PROJECTS.find(pp => pp.id === id);
    if (!p) return;
    // Heat stop clicks
    card.querySelectorAll(".heat-stop").forEach(btn => {
      btn.addEventListener("click", () => {
        const prev = p.heat;
        p.heat = btn.dataset.heat;
        if (typeof recordChange === "function") {
          recordChange({
            entityType: "opportunity", entityId: p.id, action: "heat_change",
            field: "heat", from: prev, to: p.heat
          });
        }
        if (typeof showToast === "function" && prev !== p.heat) {
          showToast(`${p.code} → ${HEAT_LABELS[p.heat] || p.heat}`, { tone: "neutral", duration: 2000 });
        }
        renderOpportunities();
        renderOverview();
        if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
      });
    });
    // Value edit — inline input, no prompt()
    const valEl = card.querySelector(".opp-value-amount");
    if (valEl) {
      valEl.addEventListener("click", () => {
        if (valEl.querySelector("input")) return;
        const input = document.createElement("input");
        input.type = "number";
        input.className = "opp-value-input";
        input.value = p.estimatedValue || 0;
        input.min = "0";
        input.step = "1000";
        valEl.textContent = "";
        valEl.appendChild(input);
        input.focus();
        input.select();
        const commit = () => {
          const n = parseInt(input.value, 10);
          if (!isNaN(n) && n >= 0 && n !== p.estimatedValue) {
            const prev = p.estimatedValue;
            p.estimatedValue = n;
            if (typeof recordChange === "function") {
              recordChange({
                entityType: "opportunity", entityId: p.id, action: "value_change",
                field: "estimatedValue", from: prev, to: n
              });
            }
            if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
          }
          renderOpportunities();
        };
        input.addEventListener("blur", commit);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); input.blur(); }
          if (e.key === "Escape") { e.preventDefault(); renderOpportunities(); }
        });
      });
    }
    // Won
    card.querySelector(".opp-action-btn.won")?.addEventListener("click", () => {
      openWonModal(p);
    });
    // Lost
    card.querySelector(".opp-action-btn.lost")?.addEventListener("click", () => {
      if (!confirm(`Mark "${p.name || p.code}" as lost?`)) return;
      p.status = "lost";
      p.lostDate = fmtISO(new Date());
      if (typeof recordChange === "function") {
        recordChange({
          entityType: "opportunity", entityId: p.id, action: "lost",
          field: "status", from: "active", to: "lost"
        });
      }
      renderOpportunities();
      renderOverview();
      if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
    });
    // Open project home (ignore interactive controls) — handled by data-open-project delegation
    // Keep stop on heat/value/actions so they don't bubble into open.
    card.querySelectorAll(".heat-stop, .opp-value-amount, .opp-actions").forEach(el => {
      el.addEventListener("click", e => e.stopPropagation());
    });
  });

  // Archived section
  const lost = PROJECTS.filter(p => p.stage === "opportunity" && p.status === "lost");
  if (lost.length) {
    archivedSection.style.display = "block";
    archivedCount.textContent = `${lost.length} archived`;
    archivedGrid.innerHTML = lost.map(p => `
      <div class="opp-archived-card" data-project-id="${p.id}">
        <div class="ac-code">${p.code}${p.lostDate ? " · Lost " + fmtDayMonthShort(p.lostDate) : ""}</div>
        <div class="ac-title">${escapeHtml(p.name || p.blurb.split(" — ")[0])}</div>
        <div class="ac-meta">Lead ${p.lead} · ${fmtCurrency(p.estimatedValue || 0)}</div>
        <button class="ac-restore">Restore</button>
      </div>
    `).join("");
    archivedGrid.querySelectorAll(".opp-archived-card").forEach(card => {
      const id = card.dataset.projectId;
      const p = PROJECTS.find(pp => pp.id === id);
      card.querySelector(".ac-restore").addEventListener("click", () => {
        p.status = "active";
        delete p.lostDate;
        renderOpportunities();
      });
    });
  } else {
    archivedSection.style.display = "none";
  }
}

function renderOppCard(p) {
  const lead = LEADS[p.lead];
  const teamPills = (p.team || []).map(t =>
    `<span class="initial-pill">${TEAM_INITIALS[t]}</span>`
  ).join("");
  const heatStopsHtml = HEAT_LEVELS.map(h => `
    <button type="button" class="heat-stop${p.heat === h ? " active " + h : ""}" data-heat="${h}">${HEAT_LABELS[h]}</button>
  `).join("");
  const title = escapeHtml(p.name || p.blurb.split(" — ")[0]);

  const agingCls = typeof agingClass === "function" ? agingClass(p) : "";
  const agingChip = typeof agingChipHtml === "function" ? agingChipHtml(p) : "";
  return `
    <article class="opp-card heat-${p.heat || "simmer"}${p.hyper ? " hyper" : ""}${agingCls ? " " + agingCls : ""}" data-project-id="${p.id}" data-open-project="${p.id}">
      <div class="opp-code">${p.code}${p.hyper ? " · HYPER PRIORITY" : ""}${agingChip}</div>
      <h3>${title}</h3>
      <p class="blurb">${escapeHtml(p.hoverDetail)}</p>
      <dl class="opp-meta">
        <dt>Lead</dt><dd>${p.lead} · ${lead.name} · ${lead.state}</dd>
        <dt>Stage close</dt><dd>${p.stageClose ? fmtFullDate(p.stageClose) : "—"}</dd>
        <dt>This week</dt><dd>${escapeHtml(p.weekPriority)}</dd>
      </dl>
      <div class="opp-team">
        <span class="initial-pill lead">${p.lead}</span>
        ${teamPills}
      </div>
      <div class="opp-value-row">
        <span class="opp-value-label">Estimated value · click to edit</span>
        <span class="opp-value-amount" title="Click to change">${fmtCurrency(p.estimatedValue || 0)}</span>
      </div>
      <div class="heat-meter">
        <div class="heat-meter-label">
          <span>Heat</span>
          <span class="heat-current">${HEAT_LABELS[p.heat || "simmer"]}</span>
        </div>
        <div class="heat-stops">${heatStopsHtml}</div>
      </div>
      <div class="opp-actions">
        <button class="opp-action-btn won">Mark Won</button>
        <button class="opp-action-btn lost">Mark Lost</button>
      </div>
    </article>
  `;
}

// ---------- OPP CONTROLS (sort dropdown + new button) ----------
function initOppControls() {
  const sortSel = document.getElementById("opp-sort");
  if (sortSel) {
    sortSel.value = OPP_SORT;
    sortSel.addEventListener("change", () => {
      OPP_SORT = sortSel.value;
      renderOpportunities();
    });
  }
  const newBtn = document.getElementById("opp-new-btn");
  if (newBtn) {
    newBtn.addEventListener("click", () => openOppModal());
  }
}

// ---------- NEW OPPORTUNITY MODAL ----------
let _omSelectedHeat = "simmer";
function openOppModal() {
  const overlay = document.getElementById("opp-modal-overlay");
  document.getElementById("om-name").value = "";
  document.getElementById("om-client").value = "";
  document.getElementById("om-value").value = "25000";
  document.getElementById("om-desc").value = "";
  document.getElementById("om-close").value = "";
  _omSelectedHeat = "simmer";
  document.querySelectorAll("#om-heat .heat-stop").forEach(b => {
    b.classList.toggle("active", b.dataset.heat === _omSelectedHeat);
    b.classList.toggle(_omSelectedHeat, b.dataset.heat === _omSelectedHeat);
  });
  // Apply active heat colour to whichever stop is selected
  applyHeatModalColours("om-heat", _omSelectedHeat);
  overlay.classList.add("visible");
}

function applyHeatModalColours(containerId, selected) {
  document.querySelectorAll(`#${containerId} .heat-stop`).forEach(b => {
    HEAT_LEVELS.forEach(h => b.classList.remove(h));
    if (b.dataset.heat === selected) {
      b.classList.add("active", selected);
    } else {
      b.classList.remove("active");
    }
  });
}

function initOppModal() {
  const overlay = document.getElementById("opp-modal-overlay");
  const closeBtn = document.getElementById("opp-modal-close");
  const cancelBtn = document.getElementById("om-cancel");
  const saveBtn = document.getElementById("om-save");
  const leadSel = document.getElementById("om-lead");
  const heatStops = document.querySelectorAll("#om-heat .heat-stop");

  leadSel.innerHTML = Object.keys(LEADS).map(k =>
    `<option value="${k}">${k} · ${LEADS[k].name}</option>`
  ).join("");

  heatStops.forEach(btn => {
    btn.addEventListener("click", () => {
      _omSelectedHeat = btn.dataset.heat;
      applyHeatModalColours("om-heat", _omSelectedHeat);
    });
  });

  function close() { overlay.classList.remove("visible"); }
  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });

  saveBtn.addEventListener("click", () => {
    const name = document.getElementById("om-name").value.trim();
    const client = document.getElementById("om-client").value.trim();
    const desc = document.getElementById("om-desc").value.trim();
    const value = parseInt(document.getElementById("om-value").value, 10) || 0;
    const closeDate = document.getElementById("om-close").value;
    if (!name) { document.getElementById("om-name").focus(); return; }
    if (!client) { document.getElementById("om-client").focus(); return; }

    // New project ID
    let nextNum = 31;
    while (PROJECTS.find(p => p.id === "P" + String(nextNum).padStart(2, "0"))) nextNum++;
    const newId = "P" + String(nextNum).padStart(2, "0");
    const existingCodes = PROJECTS.map(p => p.code.replace("Project ", "").trim());
    const nextCode = "Project " + nextProjectLetter(existingCodes);

    const newOpp = {
      id: newId,
      code: nextCode,
      stage: "opportunity",
      lead: leadSel.value,
      team: [],
      blurb: desc || name,
      hoverDetail: desc || name,
      weekPriority: "NA",
      stageClose: closeDate || null,
      completion: null,
      hyper: false,
      dueDates: [],
      name,
      client,
      heat: _omSelectedHeat,
      estimatedValue: value,
      status: "active",
      // Projects-tab fields: opportunities have a single-stage pipeline
      pipeline: [{
        key: "opportunity_pitch",
        masterStage: "opportunity",
        label: "Pitch / Feasibility",
        value: value,
        closed: false,
        closedDate: null,
        movedThisWeek: false,
      }],
      totalValue: value,
    };
    PROJECTS.push(newOpp);
    close();
    renderOpportunities();
    renderOverview();
    renderProjects();
    renderPeople();
    if (typeof showToast === "function") showToast(`Opportunity added · ${newOpp.code}`, { tone: "success" });
  });
}

// ---------- WON → PROJECT MODAL ----------
let _wmOpp = null;
let _wmStages = [];
let _wmTeam = new Set();

function openWonModal(opp) {
  _wmOpp = opp;
  const overlay = document.getElementById("won-modal-overlay");
  document.getElementById("wm-summary").textContent = `${opp.code} · ${opp.name || opp.blurb.split(" — ")[0]}`;
  document.getElementById("wm-name").value = opp.name || opp.blurb.split(" — ")[0];
  document.getElementById("wm-client").value = opp.client || "";
  document.getElementById("wm-master").value = "frontend";
  document.getElementById("wm-lead").value = opp.lead;

  // Default to Front End sub-stages with the opp value spread across them
  _wmStages = PIPELINE_TEMPLATES.frontend.map(t => ({ label: t.label, value: t.defaultValue }));
  renderWmStages();

  // Team picker — pre-select the opp's existing team
  _wmTeam = new Set(opp.team || []);
  const teamPicker = document.getElementById("wm-team");
  teamPicker.querySelectorAll(".proj-team-pick").forEach(btn => {
    const name = btn.dataset.name;
    btn.classList.toggle("active", _wmTeam.has(name));
  });

  overlay.classList.add("visible");
}

function renderWmStages() {
  const container = document.getElementById("wm-stages");
  container.innerHTML = _wmStages.map((s, i) => `
    <div class="pb-stage-row">
      <input class="m-input wm-label" type="text" data-idx="${i}" value="${escapeHtml(s.label)}" placeholder="Sub-stage name" />
      <input class="m-input wm-value" type="number" data-idx="${i}" value="${s.value}" min="0" step="500" />
      <button class="pb-remove" type="button" data-idx="${i}" title="Remove">×</button>
    </div>
  `).join("");
  container.querySelectorAll(".wm-label").forEach(el => {
    el.addEventListener("input", () => { _wmStages[Number(el.dataset.idx)].label = el.value; });
  });
  container.querySelectorAll(".wm-value").forEach(el => {
    el.addEventListener("input", () => {
      _wmStages[Number(el.dataset.idx)].value = Math.max(0, parseInt(el.value, 10) || 0);
      updateWmTotal();
    });
  });
  container.querySelectorAll(".pb-remove").forEach(el => {
    el.addEventListener("click", () => {
      _wmStages.splice(Number(el.dataset.idx), 1);
      renderWmStages();
      updateWmTotal();
    });
  });
  updateWmTotal();
}

function updateWmTotal() {
  const total = _wmStages.reduce((s, x) => s + (x.value || 0), 0);
  document.getElementById("wm-total").textContent = fmtCurrencyLong(total);
}

function initWonModal() {
  const overlay = document.getElementById("won-modal-overlay");
  const closeBtn = document.getElementById("won-modal-close");
  const cancelBtn = document.getElementById("wm-cancel");
  const saveBtn = document.getElementById("wm-save");
  const leadSel = document.getElementById("wm-lead");
  const masterSel = document.getElementById("wm-master");
  const addStageBtn = document.getElementById("wm-add-stage");
  const teamPicker = document.getElementById("wm-team");

  leadSel.innerHTML = Object.keys(LEADS).map(k =>
    `<option value="${k}">${k} · ${LEADS[k].name}</option>`
  ).join("");

  // Populate team picker once
  teamPicker.innerHTML = TEAM.map(name => {
    const ti = TEAM_INITIALS[name];
    return `<button type="button" class="proj-team-pick" data-name="${escapeHtml(name)}">${ti} · ${escapeHtml(name)}</button>`;
  }).join("");
  teamPicker.querySelectorAll(".proj-team-pick").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      if (_wmTeam.has(name)) {
        _wmTeam.delete(name);
        btn.classList.remove("active");
      } else {
        _wmTeam.add(name);
        btn.classList.add("active");
      }
    });
  });

  masterSel.addEventListener("change", () => {
    _wmStages = PIPELINE_TEMPLATES[masterSel.value].map(t => ({ label: t.label, value: t.defaultValue }));
    renderWmStages();
  });
  addStageBtn.addEventListener("click", () => {
    _wmStages.push({ label: "New sub-stage", value: 10000 });
    renderWmStages();
  });

  function close() { overlay.classList.remove("visible"); }
  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });

  saveBtn.addEventListener("click", () => {
    if (!_wmOpp) return;
    const name = document.getElementById("wm-name").value.trim();
    const client = document.getElementById("wm-client").value.trim();
    if (!name) return;
    if (!_wmStages.length) { alert("Add at least one sub-stage."); return; }
    if (_wmStages.some(s => !s.label.trim())) { alert("Every sub-stage needs a label."); return; }

    const master = masterSel.value;
    // Convert opp in-place: update stage, add pipeline, store legacy heat/value for reference
    _wmOpp.stage = master;
    _wmOpp.lead = leadSel.value;
    _wmOpp.team = [..._wmTeam];
    _wmOpp.name = name;
    _wmOpp.client = client;
    _wmOpp.status = "won";
    _wmOpp.wonDate = fmtISO(new Date());
    _wmOpp.pipeline = _wmStages.map((s, idx) => ({
      key: `${master}_won_${idx}`,
      masterStage: master,
      label: s.label.trim(),
      value: s.value,
      closed: false,
      closedDate: null,
      movedThisWeek: false,
    }));
    _wmOpp.totalValue = _wmOpp.pipeline.reduce((sum, s) => sum + s.value, 0);
    if (master === "support") _wmOpp.pcDate = _wmOpp.pcDate || null;
    _wmOpp.stageEnteredAt = WEEK_OF;
    if (typeof recordChange === "function") {
      recordChange({
        entityType: "opportunity", entityId: _wmOpp.id, action: "won_convert",
        field: "stage", from: "opportunity", to: master,
        meta: { totalValue: _wmOpp.totalValue, name: _wmOpp.name }
      });
    }
    if (typeof seedWeekAllocations === "function") seedWeekAllocations(PROJECTS);

    close();
    renderOpportunities();
    renderProjects();
    renderOverview();
    renderPeople();
    renderCalendar();
    renderDesignSupport();
    if (typeof renderProjectList === "function") renderProjectList();
    if (typeof showToast === "function") {
      showToast(`Won · converted to ${_wmOpp.code}`, { tone: "success" });
    }
    navigateToView("projects");
  });
}

// =======================================================================
// PEOPLE — project leads with color bars + team rows
// =======================================================================
function renderPeople() {
  const container = document.getElementById("leads-list");
  container.innerHTML = "";

  const sumEl = document.getElementById("scenario-summary");
  if (sumEl && typeof scenarioSummary === "function") {
    if (SCENARIO_MODE) {
      const s = scenarioSummary(PROJECTS);
      sumEl.hidden = false;
      sumEl.textContent = s.oppCount
        ? `Scenario · +${s.totalBlocks} blocks across ${s.peopleCount} people if ${s.oppCount} Hot/Cookin' opp${s.oppCount === 1 ? "" : "s"} win`
        : "Scenario · No Hot or Cookin' opportunities to overlay";
    } else {
      sumEl.hidden = true;
    }
  }

  Object.keys(LEADS).forEach(initials => {
    const lead = LEADS[initials];
    const cap = typeof renderCapacityBar === "function"
      ? renderCapacityBar(initials, PROJECTS)
      : { barHtml: "", utilLabel: "", band: { cls: "" }, blocks: 0 };

    const row = document.createElement("div");
    row.className = "lead-row";
    row.innerHTML = `
      <div class="lead-id">
        <div class="lead-initials">${initials}</div>
        <div>
          <div class="lead-name">${lead.name}</div>
          <div class="lead-meta">${lead.role} · ${lead.state} · ${cap.blocks}/${typeof BLOCKS_PER_WEEK !== "undefined" ? BLOCKS_PER_WEEK : 10} blocks</div>
        </div>
      </div>
      <div class="lead-bar">
        ${cap.barHtml}
        <span class="util-pill ${cap.band.cls || ""}">${cap.utilLabel}</span>
      </div>
    `;
    row.querySelectorAll(".bar-block[data-project-id]").forEach(el => {
      const p = PROJECTS.find(pp => pp.id === el.dataset.projectId);
      if (!p) return;
      el.addEventListener("mouseenter", e => showTooltip(e, p));
      el.addEventListener("mousemove", moveTooltip);
      el.addEventListener("mouseleave", hideTooltip);
      el.addEventListener("click", () => {
        if (typeof openProjectHome === "function") openProjectHome(p.id);
      });
    });
    container.appendChild(row);
  });

  const teamGrid = document.getElementById("team-grid");
  teamGrid.innerHTML = "";
  TEAM.forEach(name => {
    const ti = TEAM_INITIALS[name];
    const cap = typeof renderCapacityBar === "function"
      ? renderCapacityBar(name, PROJECTS)
      : { barHtml: "", utilLabel: "", band: { cls: "" }, blocks: 0 };

    const row = document.createElement("div");
    row.className = "lead-row";
    row.innerHTML = `
      <div class="lead-id">
        <div class="lead-initials">${ti}</div>
        <div>
          <div class="lead-name">${name}</div>
          <div class="lead-meta">Team Member · ${cap.blocks}/${typeof BLOCKS_PER_WEEK !== "undefined" ? BLOCKS_PER_WEEK : 10} blocks</div>
        </div>
      </div>
      <div class="lead-bar">
        ${cap.barHtml}
        <span class="util-pill ${cap.band.cls || ""}">${cap.utilLabel}</span>
      </div>
    `;
    row.querySelectorAll(".bar-block[data-project-id]").forEach(el => {
      const p = PROJECTS.find(pp => pp.id === el.dataset.projectId);
      if (!p) return;
      el.addEventListener("mouseenter", e => showTooltip(e, p));
      el.addEventListener("mousemove", moveTooltip);
      el.addEventListener("mouseleave", hideTooltip);
      el.addEventListener("click", () => {
        if (typeof openProjectHome === "function") openProjectHome(p.id);
      });
    });
    teamGrid.appendChild(row);
  });
}

// =======================================================================
// DESIGN SUPPORT — list sorted by PC + 3 month mini calendar with PC markers
// =======================================================================
function renderDesignSupport() {
  const list = document.getElementById("ds-list");
  const ds = PROJECTS.filter(p => p.stage === "support").sort((a, b) => a.pcDate.localeCompare(b.pcDate));

  list.innerHTML = `
    <div class="ds-list-header">
      <div>PC Date</div>
      <div>Project</div>
      <div style="text-align:right;">Lead</div>
    </div>
    ${ds.map(p => {
      const pc = parseISO(p.pcDate);
      const weeksOut = Math.round((pc - TODAY) / (1000*60*60*24*7));
      const teamPills = (p.team || []).map(t => `<span class="initial-pill">${TEAM_INITIALS[t]}</span>`).join("");
      return `
        <div class="ds-item ${typeof agingClass === "function" ? agingClass(p) : ""}" data-open-project="${p.id}">
          <div>
            <div class="ds-pc">${pc.getDate()} ${MONTHS[pc.getMonth()]}</div>
            <div class="ds-pc-sub">${pc.getFullYear()} · ${weeksOut}w</div>
          </div>
          <div class="ds-info">
            <div class="ds-code">${p.code}${typeof agingChipHtml === "function" ? agingChipHtml(p) : ""}</div>
            <div class="ds-blurb">${escapeHtml(p.blurb.split(" — ")[0])}</div>
            <div class="ds-team">${teamPills}</div>
          </div>
          <div class="ds-lead">
            <span class="initial-pill">${p.lead}</span>
          </div>
        </div>
      `;
    }).join("")}
  `;
  list.querySelectorAll(".ds-item").forEach(el => {
    const p = PROJECTS.find(pp => pp.id === el.getAttribute("data-open-project"));
    el.addEventListener("mouseenter", e => showTooltip(e, p));
    el.addEventListener("mousemove", moveTooltip);
    el.addEventListener("mouseleave", hideTooltip);
  });

  // 3 months of mini calendars starting this month
  const stack = document.getElementById("ds-cal-stack");
  stack.innerHTML = "";
  for (let m = 0; m < 3; m++) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + m, 1);
    stack.appendChild(buildMiniCal(d, ds));
  }
}

function buildMiniCal(monthStart, projects) {
  const wrap = document.createElement("div");
  wrap.className = "mini-cal";
  wrap.innerHTML = `<h4>${MONTHS_FULL[monthStart.getMonth()]} ${monthStart.getFullYear()}</h4>`;
  const grid = document.createElement("div");
  grid.className = "mini-cal-grid";
  // dow headers Mon..Sun
  DOW_FULL_7.forEach(d => {
    const h = document.createElement("div");
    h.className = "mc-dow";
    h.textContent = d.charAt(0);
    grid.appendChild(h);
  });
  // leading blanks
  const firstDow = (monthStart.getDay() + 6) % 7; // make Mon = 0
  for (let i = 0; i < firstDow; i++) {
    const blank = document.createElement("div");
    blank.className = "mc-day other";
    grid.appendChild(blank);
  }
  // days
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const iso = fmtISO(date);
    const pcProjects = projects.filter(p => p.pcDate === iso);
    const cell = document.createElement("div");
    cell.className = "mc-day" + (pcProjects.length ? " pc" : "");
    cell.textContent = day;
    if (pcProjects.length) {
      const p = pcProjects[0];
      cell.title = `${p.code} · PC ${fmtFullDate(p.pcDate)}`;
      cell.addEventListener("mouseenter", e => showTooltip(e, p));
      cell.addEventListener("mousemove", moveTooltip);
      cell.addEventListener("mouseleave", hideTooltip);
    }
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);
  return wrap;
}

// =======================================================================
// INIT (views rendered after all seeds — see bottom of file)
// =======================================================================

// =======================================================================
// TO-DO BOARD
// Minutes as source of truth (15–480). My Tasks (default) + Studio board.
// Personal tasks: project === null.
// =======================================================================

const CURRENT_USER = "MJ";
const TASK_MIN_MINUTES = 15;
const TASK_MAX_MINUTES = 480; // 1 day
const DURATION_PRESETS = [15, 30, 45, 60, 120, 240, 480];

const BOARD_PEOPLE = [
  ...Object.keys(LEADS).map(initials => ({
    key: initials,
    name: LEADS[initials].name,
    initials,
    role: LEADS[initials].role,
    state: LEADS[initials].state,
    isLead: true,
  })),
  ...TEAM.map(name => ({
    key: TEAM_INITIALS[name],
    name,
    initials: TEAM_INITIALS[name],
    role: "Team Member",
    state: "",
    isLead: false,
  })),
];

let nextTaskId = 1000;
let TODO_MODE = "mine"; // "mine" | "studio"

function clampTaskMinutes(mins) {
  const n = Math.round(Number(mins) || 0);
  if (n < TASK_MIN_MINUTES) return TASK_MIN_MINUTES;
  if (n > TASK_MAX_MINUTES) return TASK_MAX_MINUTES;
  return n;
}

function fmtDuration(mins) {
  const m = clampTaskMinutes(mins);
  if (m < 60) return m + "m";
  if (m === 480) return "1 day";
  if (m % 60 === 0) return (m / 60) + "h";
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h + "h " + rem + "m";
}

function fmtHoursTotal(mins) {
  const hours = mins / 60;
  if (Number.isInteger(hours)) return hours + "h";
  const rounded = Math.round(hours * 10) / 10;
  return rounded + "h";
}

function makeTask(person, project, desc, minutes, when) {
  return {
    id: "T" + (++nextTaskId),
    person,
    project: project || null,
    desc,
    minutes: clampTaskMinutes(minutes),
    when,
    completed: false,
  };
}

function seedTodoTasks() {
  return [
    makeTask("MJ", "P01", "Lock test-fit option C with the client board ahead of Wednesday pitch deadline", 120, "week"),
    makeTask("MJ", "P03", "Hospitality group strategic positioning — refine narrative slide", 240, "week"),
    makeTask("MJ", "P02", "Sign off Sydney CBD RFP fee schedule with CF", 90, "week"),
    makeTask("MJ", null, "Book Monday leads sync and send agenda", 30, "week"),
    makeTask("MJ", "P03", "Brisbane site visit prep, brief Emma on key questions", 120, "future"),

    makeTask("GC", "P17", "CITIC House — final services coordination markup, issue to BT", 240, "week"),
    makeTask("GC", "P17", "CITIC tender issue — reviewer sign-off pass", 240, "week"),
    makeTask("GC", "P08", "Cbus 435 — scheme C drawing pack review", 120, "week"),
    makeTask("GC", "P15", "Carlton cafe — review BT joinery detail responses", 90, "week"),
    makeTask("GC", "P04", "Collingwood warehouse — call with heritage consultant", 45, "future"),

    makeTask("MN", "P01", "Boutique hotel Fitzroy — finalise test-fit C layout drawings", 480, "week"),
    makeTask("MN", "P01", "Pitch deck narrative pass — client board context", 240, "week"),
    makeTask("MN", "P23", "Brighton tender — joinery package coordination meeting prep", 120, "week"),
    makeTask("MN", "P14", "Cremorne concept pack — final review before issue", 90, "week"),
    makeTask("MN", "P29", "Docklands — defects walkthrough scheduling", 60, "future"),

    makeTask("CF", "P02", "Sydney CBD RFP — concept boards page layout", 480, "week"),
    makeTask("CF", "P02", "RFP fee schedule final check", 120, "week"),
    makeTask("CF", "P20", "Corporate HQ tender — joinery details internal review prep", 240, "week"),

    makeTask("KM", "P11", "Surry Hills co-working — lighting concept workshop facilitation", 240, "week"),
    makeTask("KM", "P19", "Hotel guest room FF&E schedule completion", 240, "week"),
    makeTask("KM", "P06", "Childcare centre — concept narrative draft", 120, "future"),

    makeTask("KP", "P09", "Toorak residence — joinery elevations final pass", 240, "week"),
    makeTask("KP", "P16", "Luxury retail — VIP suite material direction", 240, "week"),
    makeTask("KP", "P22", "Beauty salon Site B — variation drawings", 120, "week"),

    makeTask("ZW", "P05", "Wellness flagship mood board final pass", 90, "week"),
    makeTask("ZW", "P18", "South Melb apartment — engineer drawing coordination", 240, "week"),
    makeTask("ZW", "P10", "South Yarra restaurant — workshop 02 prep", 120, "week"),

    makeTask("LP", "P13", "Bath-house pool hall — structural meeting prep", 240, "week"),
    makeTask("LP", "P07", "Project Mood scope confirmation call", 45, "week"),
    makeTask("LP", "P21", "Wine bar Fitzroy — permit package final check", 120, "week"),

    makeTask("SW", "P14", "Cremorne concept pack — final drawing assembly", 240, "week"),
    makeTask("SW", "P01", "Boutique hotel — test-fit C drafting support", 480, "week"),
    makeTask("SW", "P09", "Toorak — joinery elevation drafting", 240, "future"),

    makeTask("PN", "P11", "Surry Hills lighting — schematic markup", 240, "week"),
    makeTask("PN", "P02", "Sydney CBD RFP — render setup", 240, "week"),
    makeTask("PN", "P20", "Corporate HQ — ceiling detail coordination", 120, "future"),

    makeTask("BT", "P17", "CITIC House — final markup applied to drawings", 480, "week"),
    makeTask("BT", "P17", "Tender issue checklist final pass", 240, "week"),
    makeTask("BT", "P04", "Collingwood warehouse — existing conditions audit pack", 120, "week"),

    makeTask("IA", "P10", "South Yarra — material direction boards prep", 240, "week"),
    makeTask("IA", "P05", "Wellness flagship — image research", 90, "week"),
    makeTask("IA", "P25", "Prahran restaurant — site walk Tuesday", 120, "week"),

    makeTask("SB", "P01", "Boutique hotel — competitor research summary", 120, "week"),
    makeTask("SB", "P16", "Retail flagship — VIP suite reference imagery", 240, "week"),
    makeTask("SB", "P28", "Hawthorn spa — tile setting-out site review", 90, "future"),

    makeTask("SC", "P11", "Surry Hills — DD drawing setup", 240, "week"),
    makeTask("SC", "P19", "Hotel prototype — corridor drawing markup", 240, "week"),

    makeTask("EW", "P18", "South Melb apartment — drawing coordination", 240, "week"),
    makeTask("EW", "P12", "North Sydney health clinic — concept research", 120, "week"),
    makeTask("EW", "P29", "Docklands — handover photography brief", 60, "future"),
  ];
}

function normalizeStoredTask(t) {
  let minutes = t.minutes;
  if (minutes == null && t.hours != null) minutes = Math.round(Number(t.hours) * 60);
  minutes = clampTaskMinutes(minutes || 120);
  const idNum = parseInt(String(t.id || "").replace(/\D/g, ""), 10);
  if (!isNaN(idNum) && idNum >= nextTaskId) nextTaskId = idNum;
  return {
    id: t.id || ("T" + (++nextTaskId)),
    person: t.person,
    project: t.project === "personal" || t.project === "" ? null : (t.project || null),
    desc: t.desc || "",
    minutes,
    when: t.when === "future" ? "future" : "week",
    completed: !!t.completed,
  };
}

function loadTodoTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.todoTasks);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(normalizeStoredTask);
      }
    }
  } catch (_) {}
  return seedTodoTasks();
}

function persistTodoTasks() {
  try {
    localStorage.setItem(STORAGE_KEYS.todoTasks, JSON.stringify(TODO_TASKS));
  } catch (_) {}
}

function loadTodoMode() {
  try {
    const m = localStorage.getItem(STORAGE_KEYS.todoMode);
    if (m === "studio" || m === "mine") return m;
  } catch (_) {}
  return "mine";
}

function persistTodoMode() {
  try {
    localStorage.setItem(STORAGE_KEYS.todoMode, TODO_MODE);
  } catch (_) {}
}

const TODO_TASKS = loadTodoTasks();
TODO_MODE = loadTodoMode();

const futureOpenState = {};

function canEdit(personKey) {
  if (CURRENT_USER === personKey) return true;
  const user = BOARD_PEOPLE.find(p => p.key === CURRENT_USER);
  return user && user.isLead;
}

function tasksFor(personKey, when) {
  return TODO_TASKS.filter(t => t.person === personKey && t.when === when);
}

function weekHours(personKey) {
  const tasks = tasksFor(personKey, "week");
  const remaining = tasks.filter(t => !t.completed).reduce((s, t) => s + t.minutes, 0);
  const total = tasks.reduce((s, t) => s + t.minutes, 0);
  return { remaining, total, completed: total - remaining };
}

function setTodoMode(mode) {
  TODO_MODE = mode === "studio" ? "studio" : "mine";
  persistTodoMode();
  document.querySelectorAll(".todo-mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.todoMode === TODO_MODE);
  });
  const title = document.getElementById("todo-view-title");
  const sub = document.getElementById("todo-view-sub");
  if (TODO_MODE === "mine") {
    if (title) title.textContent = "My Tasks";
    if (sub) sub.textContent = "Your list · 15 min – 1 day · Drag to reorder · Edit / double-click to change";
  } else {
    if (title) title.textContent = "Studio To-Do Board";
    if (sub) sub.textContent = "One column per person · Drag to reorder · Edit / double-click · Tick to complete";
  }
  renderTodoBoard();
}

function renderPersonColumn(person, board) {
  const col = document.createElement("div");
  col.className = "todo-col" + (person.isLead ? " is-lead" : "") + (futureOpenState[person.key] ? " future-open" : "");
  col.dataset.personKey = person.key;

  const hrs = weekHours(person.key);
  const weekTasks = tasksFor(person.key, "week");
  const futureTasks = tasksFor(person.key, "future");

  col.innerHTML = `
    <div class="todo-col-head">
      <div class="todo-col-name-row">
        <div class="todo-col-initials ${person.isLead ? "lead-badge" : ""}">${person.initials}</div>
        <div>
          <div class="todo-col-name">${person.name}</div>
          <div class="todo-col-role">${person.role}${person.state ? " · " + person.state : ""}</div>
        </div>
      </div>
      <div class="todo-hours-row">
        <span class="todo-hours-label">Time remaining</span>
        <span class="todo-hours-value">
          ${fmtHoursTotal(hrs.remaining)}${hrs.completed > 0 ? `<span class="completed">(${fmtHoursTotal(hrs.completed)} done)</span>` : ""}
        </span>
      </div>
    </div>

    <div class="todo-section-label">
      <span>This Week</span>
      <span class="count">${weekTasks.length}</span>
    </div>
    <div class="todo-list" data-when="week" data-person="${person.key}"></div>

    <div class="todo-future">
      <button class="todo-future-toggle" data-person="${person.key}">
        <span>Future · ${futureTasks.length} task${futureTasks.length === 1 ? "" : "s"}</span>
        <span class="arrow">▾</span>
      </button>
      <div class="todo-future-body">
        <div class="todo-list" data-when="future" data-person="${person.key}"></div>
      </div>
    </div>
  `;
  board.appendChild(col);

  const weekListEl = col.querySelector('.todo-list[data-when="week"]');
  const futureListEl = col.querySelector('.todo-list[data-when="future"]');
  weekTasks.forEach(t => weekListEl.appendChild(renderTaskCard(t)));
  futureTasks.forEach(t => futureListEl.appendChild(renderTaskCard(t)));

  if (!weekTasks.length) weekListEl.classList.add("empty");
  if (!futureTasks.length) futureListEl.classList.add("empty");

  col.querySelector(".todo-future-toggle").addEventListener("click", () => {
    futureOpenState[person.key] = !futureOpenState[person.key];
    col.classList.toggle("future-open");
  });

  [weekListEl, futureListEl].forEach(list => {
    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("dragleave", handleDragLeave);
    list.addEventListener("drop", handleDrop);
  });
}

function renderTodoBoard() {
  const board = document.getElementById("todo-board");
  if (!board) return;
  board.innerHTML = "";
  board.classList.toggle("todo-board-mine", TODO_MODE === "mine");
  board.classList.toggle("todo-board-studio", TODO_MODE === "studio");

  const user = BOARD_PEOPLE.find(p => p.key === CURRENT_USER);
  const modeLabel = document.getElementById("todo-mode-label");
  if (modeLabel) {
    modeLabel.textContent = TODO_MODE === "mine"
      ? `Signed in as ${CURRENT_USER} · Your list`
      : `Viewing as ${CURRENT_USER} · ${user.isLead ? "Lead permissions (can edit any column)" : "Edit own column only"}`;
  }

  document.querySelectorAll(".todo-mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.todoMode === TODO_MODE);
  });

  if (TODO_MODE === "mine") {
    const me = BOARD_PEOPLE.find(p => p.key === CURRENT_USER);
    if (me) renderPersonColumn(me, board);
  } else {
    BOARD_PEOPLE.forEach(person => renderPersonColumn(person, board));
  }
}

function renderTaskCard(task) {
  const project = task.project ? PROJECTS.find(p => p.id === task.project) : null;
  const isPersonal = !task.project;
  const stageColor = project ? STAGES[project.stage].color : (isPersonal ? "personal" : "");
  const editable = canEdit(task.person);

  const card = document.createElement("div");
  card.className = `task-card ${stageColor}${task.completed ? " completed" : ""}`;
  card.draggable = editable;
  card.dataset.taskId = task.id;

  const projectLabel = isPersonal
    ? "Personal"
    : (project ? project.code.replace("Project ", "") : "—");

  card.innerHTML = `
    <div class="task-top-row">
      <span class="task-project${isPersonal ? " personal-chip" : ""}">${escapeHtml(projectLabel)}</span>
      <span class="task-hours">${fmtDuration(task.minutes)}</span>
    </div>
    <div class="task-desc" title="${escapeHtml(task.desc)}${editable ? " · Double-click to edit" : ""}">${escapeHtml(task.desc)}</div>
    <div class="task-bot-row">
      <label class="task-check">
        <input type="checkbox" ${task.completed ? "checked" : ""} ${editable ? "" : "disabled"}>
        ${task.completed ? "Done" : "Mark done"}
      </label>
      ${editable ? `
        <div class="task-actions">
          <button type="button" class="task-edit" title="Edit task">Edit</button>
          <button type="button" class="task-delete" title="Delete task">×</button>
        </div>
      ` : ""}
    </div>
  `;

  if (project) {
    card.addEventListener("mouseenter", e => showTooltip(e, project));
    card.addEventListener("mousemove", moveTooltip);
    card.addEventListener("mouseleave", hideTooltip);
  }

  if (editable) {
    card.addEventListener("dragstart", e => {
      hideTooltip();
      card.classList.add("dragging");
      e.dataTransfer.setData("text/plain", task.id);
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  }

  const checkbox = card.querySelector('input[type="checkbox"]');
  if (editable) {
    checkbox.addEventListener("change", e => {
      e.stopPropagation();
      task.completed = checkbox.checked;
      persistTodoTasks();
      renderTodoBoard();
    });
  }

  function openEdit(e) {
    if (e) e.stopPropagation();
    hideTooltip();
    if (typeof openTodoEditModal === "function") openTodoEditModal(task);
  }
  const editBtn = card.querySelector(".task-edit");
  if (editBtn) {
    editBtn.addEventListener("click", openEdit);
    editBtn.addEventListener("mousedown", e => e.stopPropagation());
  }
  if (editable) {
    card.querySelector(".task-desc").addEventListener("dblclick", openEdit);
  }

  const deleteBtn = card.querySelector(".task-delete");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (confirm("Delete this task?")) {
        const idx = TODO_TASKS.findIndex(t => t.id === task.id);
        if (idx > -1) TODO_TASKS.splice(idx, 1);
        persistTodoTasks();
        renderTodoBoard();
        if (typeof showToast === "function") showToast("Task deleted", { tone: "neutral", duration: 2000 });
      }
    });
  }

  return card;
}

function handleDragOver(e) {
  e.preventDefault();
  const list = e.currentTarget;
  const personKey = list.dataset.person;
  if (!canEdit(personKey)) {
    e.dataTransfer.dropEffect = "none";
    return;
  }
  e.dataTransfer.dropEffect = "move";
  list.classList.add("drop-target");

  const dragging = document.querySelector(".task-card.dragging");
  if (!dragging) return;
  const after = getDragAfterElement(list, e.clientY);
  if (after == null) list.appendChild(dragging);
  else list.insertBefore(dragging, after);
}

function handleDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove("drop-target");
  }
}

function handleDrop(e) {
  e.preventDefault();
  const list = e.currentTarget;
  list.classList.remove("drop-target");
  const personKey = list.dataset.person;
  const when = list.dataset.when;
  const taskId = e.dataTransfer.getData("text/plain");
  if (!canEdit(personKey)) return;

  const task = TODO_TASKS.find(t => t.id === taskId);
  if (!task) return;

  task.person = personKey;
  task.when = when;

  const newOrder = [...list.querySelectorAll(".task-card")].map(el => el.dataset.taskId);
  const otherTasks = TODO_TASKS.filter(t => !(t.person === personKey && t.when === when));
  const reorderedHere = newOrder.map(id => TODO_TASKS.find(t => t.id === id)).filter(Boolean);
  TODO_TASKS.length = 0;
  TODO_TASKS.push(...otherTasks, ...reorderedHere);
  persistTodoTasks();
  renderTodoBoard();
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll(".task-card:not(.dragging)")];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: -Infinity }).element;
}

// =======================================================================
// ADD / EDIT TASK MODAL
// =======================================================================
let openTodoEditModal = null;

function initTodoModal() {
  const overlay = document.getElementById("modal-overlay");
  const addBtn = document.getElementById("todo-add-btn");
  const closeBtn = document.getElementById("modal-close");
  const cancelBtn = document.getElementById("m-cancel");
  const saveBtn = document.getElementById("m-save");
  const titleEl = document.getElementById("modal-title");
  const personSel = document.getElementById("m-person");
  const projectSel = document.getElementById("m-project");
  const descEl = document.getElementById("m-desc");
  const wordsEl = document.getElementById("m-words");
  const blockButtons = document.querySelectorAll("#m-blocks .m-block");
  const whenButtons = document.querySelectorAll(".m-when");
  const multiRow = document.getElementById("m-multi-row");
  const multiInput = document.getElementById("m-multi");
  const customRow = document.getElementById("m-custom-duration");
  const minsInput = document.getElementById("m-mins");

  let selectedMinutes = 120;
  let selectedWhen = "week";
  let editingTaskId = null;
  let usingCustom = false;

  const user = BOARD_PEOPLE.find(p => p.key === CURRENT_USER);
  const allowedPeople = user.isLead ? BOARD_PEOPLE : [user];
  personSel.innerHTML = allowedPeople.map(p =>
    `<option value="${p.key}">${p.initials} · ${p.name}</option>`
  ).join("");

  function refreshProjectOptions() {
    projectSel.innerHTML =
      `<option value="">Personal (no project)</option>` +
      PROJECTS.map(p =>
        `<option value="${p.id}">${p.code} · ${escapeHtml(p.blurb.split(" — ")[0])}</option>`
      ).join("");
  }
  refreshProjectOptions();

  function updateWordCount() {
    const words = descEl.value.trim().split(/\s+/).filter(Boolean).length;
    wordsEl.textContent = words;
    wordsEl.parentElement.classList.toggle("over", words > 50);
  }
  descEl.addEventListener("input", updateWordCount);

  function syncMultiVisibility() {
    if (editingTaskId) {
      multiRow.style.display = "none";
      return;
    }
    multiRow.style.display = selectedWhen === "future" ? "block" : "none";
  }

  function paintDurationButtons() {
    blockButtons.forEach(b => {
      const v = b.dataset.mins;
      if (v === "custom") {
        b.classList.toggle("active", usingCustom);
      } else {
        b.classList.toggle("active", !usingCustom && Number(v) === selectedMinutes);
      }
    });
    customRow.style.display = usingCustom ? "block" : "none";
    if (usingCustom) minsInput.value = selectedMinutes;
  }

  function setMinutes(mins, custom) {
    selectedMinutes = clampTaskMinutes(mins);
    usingCustom = !!custom || !DURATION_PRESETS.includes(selectedMinutes);
    paintDurationButtons();
    syncMultiVisibility();
  }

  function setWhen(when) {
    selectedWhen = when;
    whenButtons.forEach(b => b.classList.toggle("active", b.dataset.when === when));
    syncMultiVisibility();
  }

  blockButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.mins === "custom") {
        usingCustom = true;
        selectedMinutes = clampTaskMinutes(parseInt(minsInput.value, 10) || selectedMinutes);
        paintDurationButtons();
        minsInput.focus();
      } else {
        setMinutes(Number(btn.dataset.mins), false);
      }
    });
  });

  minsInput.addEventListener("change", () => {
    setMinutes(parseInt(minsInput.value, 10) || selectedMinutes, true);
  });

  whenButtons.forEach(btn => {
    btn.addEventListener("click", () => setWhen(btn.dataset.when));
  });

  function openAddModal() {
    editingTaskId = null;
    titleEl.textContent = "Add Task";
    saveBtn.textContent = "Add Task";
    refreshProjectOptions();
    overlay.classList.add("visible");
    descEl.value = "";
    updateWordCount();
    multiInput.value = 1;
    personSel.value = CURRENT_USER;
    projectSel.value = "";
    setMinutes(120, false);
    setWhen("week");
    descEl.focus();
  }

  function openEditModal(task) {
    if (!task || !canEdit(task.person)) return;
    editingTaskId = task.id;
    titleEl.textContent = "Edit Task";
    saveBtn.textContent = "Save changes";
    refreshProjectOptions();
    overlay.classList.add("visible");

    if (![...personSel.options].some(o => o.value === task.person)) {
      const person = BOARD_PEOPLE.find(p => p.key === task.person);
      if (person) {
        const opt = document.createElement("option");
        opt.value = person.key;
        opt.textContent = `${person.initials} · ${person.name}`;
        personSel.appendChild(opt);
      }
    }
    personSel.value = task.person;

    if (task.project && ![...projectSel.options].some(o => o.value === task.project)) {
      const project = PROJECTS.find(p => p.id === task.project);
      if (project) {
        const opt = document.createElement("option");
        opt.value = project.id;
        opt.textContent = `${project.code} · ${project.blurb.split(" — ")[0]}`;
        projectSel.appendChild(opt);
      }
    }
    projectSel.value = task.project || "";

    descEl.value = task.desc;
    updateWordCount();
    setMinutes(task.minutes, !DURATION_PRESETS.includes(task.minutes));
    setWhen(task.when === "future" ? "future" : "week");
    multiRow.style.display = "none";
    descEl.focus();
    descEl.setSelectionRange(descEl.value.length, descEl.value.length);
  }

  openTodoEditModal = openEditModal;

  function closeModal() {
    overlay.classList.remove("visible");
    editingTaskId = null;
  }

  addBtn.addEventListener("click", openAddModal);
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && overlay.classList.contains("visible")) closeModal();
  });

  document.querySelectorAll(".todo-mode-btn").forEach(btn => {
    btn.addEventListener("click", () => setTodoMode(btn.dataset.todoMode));
  });

  saveBtn.addEventListener("click", () => {
    const desc = descEl.value.trim();
    const words = desc.split(/\s+/).filter(Boolean).length;
    if (!desc) { descEl.focus(); return; }
    if (words > 50) {
      alert("Description is over the 50 word limit.");
      return;
    }
    if (usingCustom) {
      selectedMinutes = clampTaskMinutes(parseInt(minsInput.value, 10) || selectedMinutes);
    }
    const mins = clampTaskMinutes(selectedMinutes);
    const projectVal = projectSel.value || null;

    if (editingTaskId) {
      const task = TODO_TASKS.find(t => t.id === editingTaskId);
      if (!task) { closeModal(); return; }
      if (!canEdit(task.person) && !canEdit(personSel.value)) return;

      task.person = personSel.value;
      task.project = projectVal;
      task.desc = desc;
      task.minutes = mins;
      task.when = selectedWhen;
      delete task.hours;

      if (selectedWhen === "future") futureOpenState[personSel.value] = true;

      persistTodoTasks();
      closeModal();
      renderTodoBoard();
      if (typeof showToast === "function") showToast("Task updated", { tone: "success", duration: 2200 });
      return;
    }

    const count = selectedWhen === "future"
      ? Math.max(1, parseInt(multiInput.value, 10) || 1)
      : 1;
    for (let i = 0; i < count; i++) {
      TODO_TASKS.push(makeTask(personSel.value, projectVal, desc, mins, selectedWhen));
    }
    if (selectedWhen === "future") futureOpenState[personSel.value] = true;
    persistTodoTasks();
    closeModal();
    renderTodoBoard();
    if (typeof showToast === "function") {
      showToast(count > 1 ? `${count} tasks added` : "Task added", { tone: "success", duration: 2200 });
    }
  });

  setTodoMode(TODO_MODE);
}

initTodoModal();

// =======================================================================
// PROJECTS TAB — accounts/billing pipeline view
// Each project has a `pipeline` of sub-stages with $ values, where each
// sub-stage can be open or closed. "Closed this week" = closed since the
// last Monday upload — flagged visually until next Monday replaces it.
// =======================================================================

// Pipeline templates per master stage. Values are sample defaults the user
// edits when creating a project; once a project exists, sub-stages and
// values are fixed unless edited.
const PIPELINE_TEMPLATES = {
  opportunity: [
    { key: "pitch",       label: "Pitch / Feasibility",  defaultValue: 12000 },
  ],
  frontend: [
    { key: "feasibility", label: "Feasibility",          defaultValue: 18000 },
    { key: "concept",     label: "Concept Design",       defaultValue: 42000 },
    { key: "dd",          label: "Design Development",   defaultValue: 58000 },
  ],
  documentation: [
    { key: "cd",          label: "Construction Docs",    defaultValue: 86000 },
    { key: "tender",      label: "Tender / VM Docs",     defaultValue: 32000 },
  ],
  support: [
    { key: "halfway",     label: "On-site · Halfway",    defaultValue: 28000 },
    { key: "completion",  label: "On-site · Completion", defaultValue: 28000 },
  ],
};

// Client names mapped to existing project IDs (seed)
const PROJECT_CLIENTS = {
  P01: "Halford Hospitality",      P02: "Whitlam Property",
  P03: "Coast & Co. Group",        P04: "Heritage Holdings",
  P05: "Anya Wellness",            P06: "Lighthouse Education",
  P07: "Project Mood",             P08: "Cbus Property",
  P09: "Private — Toorak",         P10: "Saro Restaurants",
  P11: "Collective Works",         P12: "North Shore Health",
  P13: "Project Mood",             P14: "Veridian Group",
  P15: "Carlton Coffee Co.",       P16: "Maison Voltaire",
  P17: "CITIC Property",           P18: "Private — Sth Melbourne",
  P19: "Linden Hotels",            P20: "Argent Corporate",
  P21: "Fitzroy Hospitality",      P22: "Glow & Co.",
  P23: "Private — Brighton",       P24: "Argent Corporate",
  P25: "Saro Restaurants",         P26: "Collective Works",
  P27: "Northbridge Capital",      P28: "Daylight Spa Group",
  P29: "Docklands Tower Pty Ltd",  P30: "Private — Malvern",
};

// Cleaner names for the projects view (existing `blurb` is too long for a row)
const PROJECT_NAMES = {
  P01: "Boutique Hotel · Fitzroy",                P02: "CBD Office RFP · Sydney",
  P03: "Hospitality Multi-Site · QLD",            P04: "Warehouse Reuse · Collingwood",
  P05: "Wellness Flagship · Chapel St",           P06: "Childcare Centre · Nthn Beaches",
  P07: "Bath-House Extension · Windsor",          P08: "Cbus 435 Bourke · L12 Amenity",
  P09: "Private Residence · Toorak",              P10: "Restaurant Fit-out · Sth Yarra",
  P11: "Co-working · Surry Hills",                P12: "Health Clinic · Nth Sydney",
  P13: "Bath-House · Windsor",                    P14: "HQ Relocation · Cremorne",
  P15: "Cafe · Carlton",                          P16: "Luxury Retail Flagship · CBD",
  P17: "CITIC House 99 King Street",              P18: "Apartment Refurb · Sth Melb",
  P19: "Hotel Guest Room Prototype",              P20: "Corporate HQ · Sydney CBD",
  P21: "Wine Bar · Fitzroy",                      P22: "Beauty Salon Chain · 2 Sites",
  P23: "Family Home · Brighton",                  P24: "Office Fit-out · Richmond",
  P25: "Restaurant · Prahran",                    P26: "Co-working Stage 1 · Surry Hills",
  P27: "Corporate Suite · Nth Sydney",            P28: "Day Spa · Hawthorn",
  P29: "Office Refurb · Docklands",               P30: "Residential Extension · Malvern",
};

// Build pipeline state for each existing project. Sub-stages BEFORE the
// current master stage are closed (project has progressed through them);
// sub-stages AT the current master stage are partially closed depending
// on how far along; sub-stages AFTER are all open.
//
// Then flag a handful of projects as having moved THIS WEEK so the
// indicator pattern is visible.
const STAGE_ORDER = ["opportunity", "frontend", "documentation", "support"];

function buildPipelineForProject(p) {
  // Pipeline = all sub-stages from all master stages up to and including the
  // project's current master stage. Anything past the current stage isn't
  // contracted yet for billing purposes — we just show prior + current.
  // EXCEPTION: opportunity-only projects only show the pitch sub-stage.
  const currentIdx = STAGE_ORDER.indexOf(p.stage);
  const pipeline = [];
  for (let i = 0; i <= currentIdx; i++) {
    const masterStage = STAGE_ORDER[i];
    const template = PIPELINE_TEMPLATES[masterStage];
    template.forEach(t => {
      pipeline.push({
        key: `${masterStage}_${t.key}`,
        masterStage,
        label: t.label,
        value: t.defaultValue,
        closed: i < currentIdx, // closed if its master stage is earlier
        closedDate: null,
        movedThisWeek: false,
      });
    });
  }
  // For the current master stage, close some sub-stages based on how
  // recent the project's stageClose is — gives projects a believable
  // progression instead of every project sitting at sub-stage 1.
  // Simple heuristic: if the project has a `completion` date, assume
  // ~half its current-stage sub-stages are already closed.
  const currentStageSubstages = pipeline.filter(s => s.masterStage === p.stage);
  if (currentStageSubstages.length > 1 && p.completion) {
    // Close the earlier sub-stage(s) in the current master stage
    const closeCount = Math.max(0, currentStageSubstages.length - 1);
    for (let i = 0; i < closeCount - 1; i++) currentStageSubstages[i].closed = true;
  }
  return pipeline;
}

// Project IDs that had a stage move this Monday's upload
const MOVED_THIS_WEEK = {
  P08: "frontend_feasibility",   // Cbus moved out of feasibility into concept
  P17: "documentation_cd",       // CITIC closed CD, now in tender/VM
  P24: "support_halfway",        // Richmond office hit halfway milestone
};

// Run once on init to enrich each project with pipeline/client/name/value
// fields. Mutates the existing PROJECTS array in place.
(function seedProjectExtensions() {
  const monday = WEEK_OF;
  PROJECTS.forEach(p => {
    p.client = PROJECT_CLIENTS[p.id] || "—";
    p.name = PROJECT_NAMES[p.id] || p.blurb.split(" — ")[0];
    p.pipeline = buildPipelineForProject(p);
    // Total project value
    p.totalValue = p.pipeline.reduce((sum, s) => sum + s.value, 0);
    // Apply moved-this-week flag if listed
    const movedKey = MOVED_THIS_WEEK[p.id];
    if (movedKey) {
      const stage = p.pipeline.find(s => s.key === movedKey);
      if (stage) {
        stage.closed = true;
        stage.closedDate = monday;
        stage.movedThisWeek = true;
      }
    }
  });
  if (typeof seedBlocksBurned === "function") seedBlocksBurned(PROJECTS);
  if (typeof seedWeekAllocations === "function") seedWeekAllocations(PROJECTS);
  if (typeof seedStageEnteredAt === "function") seedStageEnteredAt(PROJECTS, WEEK_OF);
  if (typeof seedInvoiceQueueFromMoved === "function") seedInvoiceQueueFromMoved(PROJECTS);
  if (typeof seedAuditFromMoved === "function") seedAuditFromMoved(MOVED_THIS_WEEK, PROJECTS);
})();

// ---------- formatting helpers ----------
function fmtCurrency(n) {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(2).replace(/\.?0+$/, "") + "m";
  if (n >= 1000) return "$" + Math.round(n / 1000) + "k";
  return "$" + n;
}
function fmtCurrencyLong(n) {
  return "$" + n.toLocaleString("en-AU");
}
function projectRemaining(p) {
  return p.pipeline.filter(s => !s.closed).reduce((sum, s) => sum + s.value, 0);
}

// =======================================================================
// PROJECTS — RENDER
// =======================================================================
function renderProjects() {
  // Totals across portfolio
  const portfolioTotal = PROJECTS.reduce((s, p) => s + (p.totalValue || 0), 0);
  const remainingTotal = PROJECTS.reduce((s, p) => s + projectRemaining(p), 0);
  let movedTotal = 0;
  let movedCount = 0;
  if (typeof movedThisWeekFromLog === "function") {
    const moves = movedThisWeekFromLog();
    movedCount = moves.length;
    movedTotal = moves.reduce((s, e) => s + ((e.meta && e.meta.value) || 0), 0);
  }
  if (!movedCount) {
    PROJECTS.forEach(p => p.pipeline.forEach(s => {
      if (s.movedThisWeek) { movedTotal += s.value; movedCount++; }
    }));
  }

  document.getElementById("proj-total-portfolio").textContent = fmtCurrency(portfolioTotal);
  document.getElementById("proj-total-remaining").textContent = fmtCurrency(remainingTotal);
  document.getElementById("proj-total-moved").textContent =
    movedCount ? `${fmtCurrency(movedTotal)} · ${movedCount}` : "—";

  if (typeof renderInvoiceQueue === "function") renderInvoiceQueue("invoice-queue");

  const stageOrder = ["opportunity", "frontend", "documentation", "support"];
  const groups = {};
  stageOrder.forEach(st => { groups[st] = []; });
  PROJECTS.forEach(p => groups[p.stage].push(p));

  const container = document.getElementById("proj-groups");
  container.innerHTML = stageOrder.map(st => {
    const projects = groups[st];
    if (!projects.length) return "";
    const stage = STAGES[st];
    const stageRemaining = projects.reduce((s, p) => s + projectRemaining(p), 0);
    return `
      <section class="proj-group">
        <div class="proj-group-head">
          <span class="proj-group-swatch ${stage.color}"></span>
          <span class="proj-group-title">${stage.label}</span>
          <span class="proj-group-count">${projects.length} project${projects.length === 1 ? "" : "s"}</span>
          <span class="proj-group-value">Remaining<strong>${fmtCurrency(stageRemaining)}</strong></span>
        </div>
        ${projects.map(p => renderProjectRow(p)).join("")}
      </section>
    `;
  }).join("");

  container.querySelectorAll(".pipe-stage").forEach(el => {
    const projectId = el.dataset.projectId;
    const stageKey = el.dataset.stageKey;
    if (!projectId) return;
    const p = PROJECTS.find(pp => pp.id === projectId);
    if (!p) return;
    el.addEventListener("mouseenter", e => showTooltip(e, p));
    el.addEventListener("mousemove", moveTooltip);
    el.addEventListener("mouseleave", hideTooltip);
    el.addEventListener("click", e => {
      e.stopPropagation();
      if (typeof togglePipelineStage === "function") {
        togglePipelineStage(p, stageKey);
        renderProjects();
        renderOverview();
        if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
      }
    });
  });
}

function renderProjectRow(p) {
  const remaining = projectRemaining(p);
  const hasMoved = p.pipeline.some(s => s.movedThisWeek);
  const teamPills = (p.team || []).map(t =>
    `<span class="initial-pill">${TEAM_INITIALS[t]}</span>`
  ).join("");
  const agingCls = typeof agingClass === "function" ? agingClass(p) : "";
  const agingChip = typeof agingChipHtml === "function" ? agingChipHtml(p) : "";
  let marginHtml = "";
  if (p.stage !== "opportunity" && typeof feeBurnHealth === "function") {
    const h = feeBurnHealth(p);
    marginHtml = `<div class="margin-chip ${h.band.cls}" title="Burn ${fmtCurrency(Math.round(h.burn))} of ${fmtCurrency(p.totalValue)}">${h.band.label} · burn ${fmtCurrency(Math.round(h.burn))}</div>`;
  }

  const pipelineHtml = p.pipeline.map(stage => {
    const classes = [
      "pipe-stage",
      `s-${stage.masterStage}`,
      stage.closed ? "closed" : "active",
      stage.movedThisWeek ? "moved-this-week" : "",
    ].filter(Boolean).join(" ");
    const stampHtml = stage.closed && stage.closedDate
      ? `<span class="pipe-stamp">Closed ${fmtDayMonthShort(stage.closedDate)}</span>`
      : "";
    return `
      <div class="${classes}" data-project-id="${p.id}" data-stage-key="${stage.key}" title="Click to toggle complete">
        <div class="pipe-label">${escapeHtml(stage.label)}</div>
        <div class="pipe-value">${fmtCurrency(stage.value)}</div>
        ${stampHtml}
      </div>
    `;
  }).join("");

  return `
    <div class="proj-row${hasMoved ? " moved-this-week" : ""}${agingCls ? " " + agingCls : ""}" data-project-id="${p.id}">
      <button type="button" class="proj-identity" data-open-project="${p.id}" title="Open project home">
        <div class="proj-code">${p.code}${agingChip}</div>
        <div class="proj-name">${escapeHtml(p.name)} <span class="ph-open-hint">Open →</span></div>
        <div class="proj-client">${escapeHtml(p.client)}</div>
        <div class="proj-meta">
          <span class="initial-pill">${p.lead}</span>
          <span class="proj-team">${teamPills}</span>
        </div>
      </button>
      <div class="proj-pipeline">${pipelineHtml}</div>
      <div class="proj-remaining">
        <div class="proj-remaining-label">Remaining</div>
        <div class="proj-remaining-value${remaining === 0 ? " zero" : ""}">${remaining === 0 ? "Complete" : fmtCurrency(remaining)}</div>
        <div class="proj-remaining-sub">of ${fmtCurrency(p.totalValue)}</div>
        ${marginHtml}
      </div>
    </div>
  `;
}

function fmtDayMonthShort(iso) {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// =======================================================================
// CREATE NEW PROJECT MODAL
// =======================================================================
function initProjectModal() {
  const overlay = document.getElementById("proj-modal-overlay");
  const openBtn = document.getElementById("proj-new-btn");
  const closeBtn = document.getElementById("proj-modal-close");
  const cancelBtn = document.getElementById("pm-cancel");
  const saveBtn = document.getElementById("pm-save");

  const nameInput = document.getElementById("pm-name");
  const clientInput = document.getElementById("pm-client");
  const masterSel = document.getElementById("pm-master");
  const stagesContainer = document.getElementById("pm-stages");
  const addStageBtn = document.getElementById("pm-add-stage");
  const totalEl = document.getElementById("pm-total");
  const leadSel = document.getElementById("pm-lead");
  const teamPicker = document.getElementById("pm-team");
  const blurbInput = document.getElementById("pm-blurb");

  // In-memory edit state
  let editStages = []; // [{label, value}]
  let pickedTeam = new Set();

  // Populate lead dropdown
  leadSel.innerHTML = Object.keys(LEADS).map(k =>
    `<option value="${k}">${k} · ${LEADS[k].name} (${LEADS[k].role})</option>`
  ).join("");

  // Populate team picker
  teamPicker.innerHTML = TEAM.map(name => {
    const ti = TEAM_INITIALS[name];
    return `<button type="button" class="proj-team-pick" data-name="${escapeHtml(name)}">${ti} · ${escapeHtml(name)}</button>`;
  }).join("");
  teamPicker.querySelectorAll(".proj-team-pick").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      if (pickedTeam.has(name)) {
        pickedTeam.delete(name);
        btn.classList.remove("active");
      } else {
        pickedTeam.add(name);
        btn.classList.add("active");
      }
    });
  });

  function renderStages() {
    stagesContainer.innerHTML = editStages.map((s, i) => `
      <div class="pb-stage-row">
        <input class="m-input pb-label" type="text" data-idx="${i}" value="${escapeHtml(s.label)}" placeholder="Sub-stage name" />
        <input class="m-input pb-value" type="number" data-idx="${i}" value="${s.value}" min="0" step="500" />
        <button class="pb-remove" type="button" data-idx="${i}" title="Remove sub-stage">×</button>
      </div>
    `).join("");
    // Wire events
    stagesContainer.querySelectorAll(".pb-label").forEach(el => {
      el.addEventListener("input", () => {
        editStages[Number(el.dataset.idx)].label = el.value;
      });
    });
    stagesContainer.querySelectorAll(".pb-value").forEach(el => {
      el.addEventListener("input", () => {
        editStages[Number(el.dataset.idx)].value = Math.max(0, parseInt(el.value, 10) || 0);
        updateTotal();
      });
    });
    stagesContainer.querySelectorAll(".pb-remove").forEach(el => {
      el.addEventListener("click", () => {
        editStages.splice(Number(el.dataset.idx), 1);
        renderStages();
        updateTotal();
      });
    });
    updateTotal();
  }
  function updateTotal() {
    const total = editStages.reduce((s, x) => s + (x.value || 0), 0);
    totalEl.textContent = fmtCurrencyLong(total);
  }

  function loadDefaultStages(masterKey) {
    // Build the cumulative pipeline (all earlier master stages + this one).
    // For a brand-new project, the contracted scope normally starts at the
    // current stage — so we default to JUST this master stage's substages.
    // User can add earlier ones manually if they're rolling in prior work.
    editStages = PIPELINE_TEMPLATES[masterKey].map(t => ({
      label: t.label,
      value: t.defaultValue,
    }));
    renderStages();
  }

  masterSel.addEventListener("change", () => loadDefaultStages(masterSel.value));
  addStageBtn.addEventListener("click", () => {
    editStages.push({ label: "New sub-stage", value: 10000 });
    renderStages();
  });

  function openModal() {
    nameInput.value = "";
    clientInput.value = "";
    blurbInput.value = "";
    masterSel.value = "frontend";
    pickedTeam = new Set();
    teamPicker.querySelectorAll(".proj-team-pick.active").forEach(el => el.classList.remove("active"));
    loadDefaultStages("frontend");
    overlay.classList.add("visible");
  }
  function closeModal() { overlay.classList.remove("visible"); }

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const client = clientInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    if (!client) { clientInput.focus(); return; }
    if (!editStages.length) { alert("Add at least one sub-stage."); return; }
    if (editStages.some(s => !s.label.trim())) { alert("Every sub-stage needs a label."); return; }

    // Generate new project ID — find next free P##
    let nextNum = 31;
    while (PROJECTS.find(p => p.id === "P" + String(nextNum).padStart(2, "0"))) nextNum++;
    const newId = "P" + String(nextNum).padStart(2, "0");

    // Generate next project letter code (Project AE, AF, ...)
    // Take the highest existing letter sequence and increment
    const existingCodes = PROJECTS.map(p => p.code.replace("Project ", "").trim());
    const nextLetterCode = nextProjectLetter(existingCodes);

    const master = masterSel.value;
    const pipeline = editStages.map((s, idx) => ({
      key: `${master}_custom_${idx}`,
      masterStage: master,
      label: s.label.trim(),
      value: s.value,
      closed: false,
      closedDate: null,
      movedThisWeek: false,
    }));
    const totalValue = pipeline.reduce((sum, s) => sum + s.value, 0);

    const newProject = {
      id: newId,
      code: "Project " + nextLetterCode,
      stage: master,
      lead: leadSel.value,
      team: [...pickedTeam],
      blurb: blurbInput.value.trim() || name,
      hoverDetail: blurbInput.value.trim() || name,
      weekPriority: "NA",
      stageClose: null,
      completion: null,
      hyper: false,
      dueDates: [],
      name,
      client,
      pipeline,
      totalValue,
    };
    if (master === "support") newProject.pcDate = null;

    PROJECTS.push(newProject);

    // Re-render everything that lists projects
    closeModal();
    renderProjects();
    renderOverview();
    renderOpportunities();
    renderPeople();
    renderDesignSupport();
    if (typeof renderProjectList === "function") renderProjectList();
    if (typeof showToast === "function") showToast(`Project created · ${newProject.code}`, { tone: "success" });
  });
}

function nextProjectLetter(existing) {
  // Convert each existing single/double letter code (e.g. "A", "Z", "AA", "AB")
  // into its base-26 number, find max, increment, convert back.
  function letterToNum(s) {
    let n = 0;
    for (const c of s.toUpperCase()) {
      if (c < "A" || c > "Z") return -1;
      n = n * 26 + (c.charCodeAt(0) - 64);
    }
    return n;
  }
  function numToLetter(n) {
    let s = "";
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }
  let maxN = 0;
  existing.forEach(code => {
    const n = letterToNum(code);
    if (n > maxN) maxN = n;
  });
  return numToLetter(maxN + 1);
}

if (typeof showLoadingSkeleton === "function") showLoadingSkeleton();
if (typeof initOnboarding === "function") initOnboarding();
if (typeof initPrintControls === "function") initPrintControls();

(function initScenarioToggle() {
  const tog = document.getElementById("scenario-toggle");
  if (!tog) return;
  tog.addEventListener("change", () => {
    SCENARIO_MODE = tog.checked;
    renderPeople();
  });
})();

(function initResetDemo() {
  const btn = document.getElementById("reset-demo-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (confirm("Reset all demo mutations and reload?")) resetDemoStorage();
  });
})();

// Render all views after seeds (pipeline, allocations, aging, invoice, audit)
renderOverview();
renderCalendar();
renderOpportunities();
renderPeople();
renderDesignSupport();
renderProjects();
initProjectModal();
initOppControls();
initOppModal();
initWonModal();
try {
  if (typeof initProjectHome === "function") initProjectHome();
} catch (err) {
  console.error("initProjectHome failed", err);
}
if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
// Ensure global for debugging / late handlers
if (typeof openProjectHome === "function") window.openProjectHome = openProjectHome;
