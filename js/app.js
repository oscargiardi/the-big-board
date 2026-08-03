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
      if (typeof revealOnboarding === "function") revealOnboarding();
    } else {
      errorEl.textContent = "Incorrect username or password.";
      passInput.value = "";
      passInput.focus();
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
    document.getElementById("view-" + btn.dataset.view).classList.add("active");
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
    <div class="metric">
      <div class="metric-label">Live Projects</div>
      <div class="metric-value">${PROJECTS.length}</div>
      <div class="metric-sub">across all stages</div>
    </div>
    <div class="metric">
      <div class="metric-label">Opportunities</div>
      <div class="metric-value" style="color: var(--green)">${counts.opportunity}</div>
      <div class="metric-sub">pitches &amp; feasibility</div>
    </div>
    <div class="metric">
      <div class="metric-label">In Design / Doc</div>
      <div class="metric-value" style="color: var(--blue)">${counts.frontend + counts.documentation}</div>
      <div class="metric-sub">${counts.frontend} FED · ${counts.documentation} DOC</div>
    </div>
    <div class="metric">
      <div class="metric-label">Hyper Priorities</div>
      <div class="metric-value" style="color: var(--hyper)">${hyperCount}</div>
      <div class="metric-sub">needing the push</div>
    </div>
  `;

  const hyperList = PROJECTS.filter(p => p.hyper);
  document.getElementById("hyper-list").innerHTML = hyperList.map(p => `
    <div class="hyper-card">
      <div class="code">${p.code} · ${STAGES[p.stage].label} · Lead ${p.lead}</div>
      <div class="title">${escapeHtml(p.blurb.split(" — ")[0])}</div>
      <div class="priority">"${escapeHtml(p.weekPriority)}"</div>
      <div class="meta">
        ${p.stageClose ? `<span>Stage close · ${fmtFullDate(p.stageClose)}</span>` : ""}
        <span>Team · ${p.team.map(t=>TEAM_INITIALS[t]).join(" / ") || "—"}</span>
      </div>
    </div>
  `).join("") || `<div style="font-style:italic;color:var(--muted);">No hyper priorities flagged this week.</div>`;
  if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
}

// =======================================================================
// CALENDAR — 5 columns: prev / current / +1 / +2 / +3, Mon-Sat
// =======================================================================
function renderCalendar() {
  const grid = document.getElementById("cal-grid");
  grid.innerHTML = "";

  const weeks = [-1, 0, 1, 2, 3].map(offset => {
    const monday = addDays(WEEK_MONDAY, offset * 7);
    return {
      offset,
      monday,
      classes: offset === -1 ? "week-col previous" : offset === 0 ? "week-col current" : "week-col",
    };
  });

  weeks.forEach(week => {
    const col = document.createElement("div");
    col.className = week.classes;

    const sat = addDays(week.monday, 5);
    col.innerHTML = `
      <div class="week-label">
        <span>${week.offset === -1 ? "Last week" : week.offset === 0 ? "This week" : `+${week.offset} week`}</span>
        <span class="wk-num">${fmtDayMonth(fmtISO(week.monday))} – ${fmtDayMonth(fmtISO(sat))}</span>
      </div>
    `;

    for (let i = 0; i < 6; i++) {
      const day = addDays(week.monday, i);
      const dayISO = fmtISO(day);
      const dayProjects = projectsForDay(dayISO);
      const dayMilestones = milestonesForDay(dayISO);

      const isToday = dayISO === fmtISO(TODAY);
      const dayRow = document.createElement("div");
      dayRow.className = "day-row" + (isToday ? " today" : "");
      dayRow.innerHTML = `
        <div class="day-label">${DOW[i]}<span class="num">${day.getDate()}</span></div>
        <div class="day-content">
          ${dayMilestones.map(m => `<div class="milestone">${escapeHtml(m.label)} · ${m.code}</div>`).join("")}
          ${dayProjects.map(p => renderChip(p, week.offset)).join("")}
        </div>
      `;
      // attach hover for each chip
      dayRow.querySelectorAll(".chip").forEach((chipEl, idx) => {
        const p = dayProjects[idx];
        chipEl.addEventListener("mouseenter", e => showTooltip(e, p));
        chipEl.addEventListener("mousemove", moveTooltip);
        chipEl.addEventListener("mouseleave", hideTooltip);
      });

      col.appendChild(dayRow);
    }

    grid.appendChild(col);
  });
}

function renderChip(p, weekOffset) {
  const color = STAGES[p.stage].color;
  const teamInitials = (p.team || []).map(t => TEAM_INITIALS[t]).filter(Boolean).join(" ");
  const continueArrow = projectContinuesPast(p, weekOffset) ? `<span class="continuation">→</span>` : "";
  return `
    <div class="chip ${color}${p.hyper ? " hyper" : ""}">
      <span class="code">${p.code} · ${p.lead}</span>
      ${teamInitials ? `<div class="people">${teamInitials}</div>` : ""}
      ${continueArrow}
    </div>
  `;
}

// Pull projects that have ANY activity that day — simplified: show projects
// whose stage-close date falls inside the week of that day, OR have a
// milestone on that day. Design Support projects show on their PC date only.
function projectsForDay(dayISO) {
  const day = parseISO(dayISO);
  const weekStart = mondayOf(day);
  const weekEnd = addDays(weekStart, 5);
  const list = [];
  PROJECTS.forEach(p => {
    if (p.stage === "support") return; // shown in DS view only
    if (p.stageClose) {
      const close = parseISO(p.stageClose);
      // Render in the day matching the stageClose
      if (fmtISO(close) === dayISO) list.push(p);
    }
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

function projectContinuesPast(p, weekOffset) {
  if (weekOffset !== 3) return false;
  if (!p.completion) return false;
  const compDate = parseISO(p.completion);
  const endOfWindow = addDays(WEEK_MONDAY, 4 * 7 - 1);
  return compDate > endOfWindow;
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
        renderOpportunities();
        renderOverview();
        if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
      });
    });
    // Value edit
    const valEl = card.querySelector(".opp-value-amount");
    if (valEl) {
      valEl.addEventListener("click", () => {
        const next = prompt("Estimated value (AUD):", p.estimatedValue);
        if (next === null) return;
        const n = parseInt(next, 10);
        if (!isNaN(n) && n >= 0) {
          const prev = p.estimatedValue;
          p.estimatedValue = n;
          if (typeof recordChange === "function") {
            recordChange({
              entityType: "opportunity", entityId: p.id, action: "value_change",
              field: "estimatedValue", from: prev, to: n
            });
          }
          renderOpportunities();
          if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
        }
      });
    }
    // Won
    card.querySelector(".opp-action-btn.won")?.addEventListener("click", () => {
      openWonModal(p);
    });
    // Lost
    card.querySelector(".opp-action-btn.lost")?.addEventListener("click", () => {
      if (confirm(`Mark "${p.name || p.blurb.split(" — ")[0]}" as lost?`)) {
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
      }
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
    <article class="opp-card heat-${p.heat || "simmer"}${p.hyper ? " hyper" : ""}${agingCls ? " " + agingCls : ""}" data-project-id="${p.id}">
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
    // Bounce to projects tab
    document.querySelectorAll("#nav button").forEach(b => b.classList.remove("active"));
    document.querySelector('#nav button[data-view="projects"]').classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById("view-projects").classList.add("active");
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
        <div class="ds-item ${typeof agingClass === "function" ? agingClass(p) : ""}" data-project-id="${p.id}">
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
    const p = PROJECTS.find(pp => pp.id === el.dataset.projectId);
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
// Kanban columns per person. Sections: This Week (prominent) + Future (drawer).
// Drag to reorder within a list. Drag across lists to reassign.
// Leads (initials in LEADS) can edit anyone. Non-leads can only edit own.
// All state in memory only — resets on reload.
// =======================================================================

// "Current user" for the demo — defaults to MJ (a lead) so all controls are visible.
const CURRENT_USER = "MJ";

// People on the board: leads + general team
// Each gets a column with This Week + Future tasks
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

// Sample tasks. Each: id, person (initials key), project (id), desc, hours, week|future
let nextTaskId = 1000;
function makeTask(person, project, desc, hours, when) {
  return { id: "T" + (++nextTaskId), person, project, desc, hours, when, completed: false };
}

// Seed sample data so the board feels real
const TODO_TASKS = [
  // MJ
  makeTask("MJ", "P01", "Lock test-fit option C with the client board ahead of Wednesday pitch deadline", 2, "week"),
  makeTask("MJ", "P03", "Hospitality group strategic positioning — refine narrative slide", 4, "week"),
  makeTask("MJ", "P02", "Sign off Sydney CBD RFP fee schedule with CF", 2, "week"),
  makeTask("MJ", "P03", "Brisbane site visit prep, brief Emma on key questions", 2, "future"),

  // GC
  makeTask("GC", "P17", "CITIC House — final services coordination markup, issue to BT", 4, "week"),
  makeTask("GC", "P17", "CITIC tender issue — reviewer sign-off pass", 4, "week"),
  makeTask("GC", "P08", "Cbus 435 — scheme C drawing pack review", 2, "week"),
  makeTask("GC", "P15", "Carlton cafe — review BT joinery detail responses", 2, "week"),
  makeTask("GC", "P04", "Collingwood warehouse — call with heritage consultant", 2, "future"),

  // MN — has the hyper boutique hotel
  makeTask("MN", "P01", "Boutique hotel Fitzroy — finalise test-fit C layout drawings", 8, "week"),
  makeTask("MN", "P01", "Pitch deck narrative pass — client board context", 4, "week"),
  makeTask("MN", "P23", "Brighton tender — joinery package coordination meeting prep", 2, "week"),
  makeTask("MN", "P14", "Cremorne concept pack — final review before issue", 2, "week"),
  makeTask("MN", "P29", "Docklands — defects walkthrough scheduling", 2, "future"),

  // CF
  makeTask("CF", "P02", "Sydney CBD RFP — concept boards page layout", 8, "week"),
  makeTask("CF", "P02", "RFP fee schedule final check", 2, "week"),
  makeTask("CF", "P20", "Corporate HQ tender — joinery details internal review prep", 4, "week"),

  // KM
  makeTask("KM", "P11", "Surry Hills co-working — lighting concept workshop facilitation", 4, "week"),
  makeTask("KM", "P19", "Hotel guest room FF&E schedule completion", 4, "week"),
  makeTask("KM", "P06", "Childcare centre — concept narrative draft", 2, "future"),

  // KP
  makeTask("KP", "P09", "Toorak residence — joinery elevations final pass", 4, "week"),
  makeTask("KP", "P16", "Luxury retail — VIP suite material direction", 4, "week"),
  makeTask("KP", "P22", "Beauty salon Site B — variation drawings", 2, "week"),

  // ZW
  makeTask("ZW", "P05", "Wellness flagship mood board final pass", 2, "week"),
  makeTask("ZW", "P18", "South Melb apartment — engineer drawing coordination", 4, "week"),
  makeTask("ZW", "P10", "South Yarra restaurant — workshop 02 prep", 2, "week"),

  // LP
  makeTask("LP", "P13", "Bath-house pool hall — structural meeting prep", 4, "week"),
  makeTask("LP", "P07", "Project Mood scope confirmation call", 2, "week"),
  makeTask("LP", "P21", "Wine bar Fitzroy — permit package final check", 2, "week"),

  // Team members
  makeTask("SW", "P14", "Cremorne concept pack — final drawing assembly", 4, "week"),
  makeTask("SW", "P01", "Boutique hotel — test-fit C drafting support", 8, "week"),
  makeTask("SW", "P09", "Toorak — joinery elevation drafting", 4, "future"),

  makeTask("PN", "P11", "Surry Hills lighting — schematic markup", 4, "week"),
  makeTask("PN", "P02", "Sydney CBD RFP — render setup", 4, "week"),
  makeTask("PN", "P20", "Corporate HQ — ceiling detail coordination", 2, "future"),

  makeTask("BT", "P17", "CITIC House — final markup applied to drawings", 8, "week"),
  makeTask("BT", "P17", "Tender issue checklist final pass", 4, "week"),
  makeTask("BT", "P04", "Collingwood warehouse — existing conditions audit pack", 2, "week"),

  makeTask("IA", "P10", "South Yarra — material direction boards prep", 4, "week"),
  makeTask("IA", "P05", "Wellness flagship — image research", 2, "week"),
  makeTask("IA", "P25", "Prahran restaurant — site walk Tuesday", 2, "week"),

  makeTask("SB", "P01", "Boutique hotel — competitor research summary", 2, "week"),
  makeTask("SB", "P16", "Retail flagship — VIP suite reference imagery", 4, "week"),
  makeTask("SB", "P28", "Hawthorn spa — tile setting-out site review", 2, "future"),

  makeTask("SC", "P11", "Surry Hills — DD drawing setup", 4, "week"),
  makeTask("SC", "P19", "Hotel prototype — corridor drawing markup", 4, "week"),

  makeTask("EW", "P18", "South Melb apartment — drawing coordination", 4, "week"),
  makeTask("EW", "P12", "North Sydney health clinic — concept research", 2, "week"),
  makeTask("EW", "P29", "Docklands — handover photography brief", 2, "future"),
];

// Track future drawer open/closed state per person
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
  const remaining = tasks.filter(t => !t.completed).reduce((s, t) => s + t.hours, 0);
  const total = tasks.reduce((s, t) => s + t.hours, 0);
  return { remaining, total, completed: total - remaining };
}

// ---------- render ----------
function renderTodoBoard() {
  const board = document.getElementById("todo-board");
  if (!board) return;
  board.innerHTML = "";

  // Update mode label
  const user = BOARD_PEOPLE.find(p => p.key === CURRENT_USER);
  document.getElementById("todo-mode-label").textContent =
    `Viewing as ${CURRENT_USER} · ${user.isLead ? "Lead permissions (can edit any column)" : "Edit own column only"}`;

  BOARD_PEOPLE.forEach(person => {
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
          <span class="todo-hours-label">Hours remaining</span>
          <span class="todo-hours-value">
            ${hrs.remaining}h${hrs.completed > 0 ? `<span class="completed">(${hrs.completed}h done)</span>` : ""}
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

    // Populate task lists
    const weekListEl = col.querySelector('.todo-list[data-when="week"]');
    const futureListEl = col.querySelector('.todo-list[data-when="future"]');
    weekTasks.forEach(t => weekListEl.appendChild(renderTaskCard(t)));
    futureTasks.forEach(t => futureListEl.appendChild(renderTaskCard(t)));

    if (!weekTasks.length) weekListEl.classList.add("empty");
    if (!futureTasks.length) futureListEl.classList.add("empty");

    // Future drawer toggle
    col.querySelector(".todo-future-toggle").addEventListener("click", () => {
      futureOpenState[person.key] = !futureOpenState[person.key];
      col.classList.toggle("future-open");
    });

    // Drop zones
    [weekListEl, futureListEl].forEach(list => {
      list.addEventListener("dragover", handleDragOver);
      list.addEventListener("dragleave", handleDragLeave);
      list.addEventListener("drop", handleDrop);
    });
  });
}

function renderTaskCard(task) {
  const project = PROJECTS.find(p => p.id === task.project);
  const stageColor = project ? STAGES[project.stage].color : "";
  const editable = canEdit(task.person);

  const card = document.createElement("div");
  card.className = `task-card ${stageColor}${task.completed ? " completed" : ""}`;
  card.draggable = editable;
  card.dataset.taskId = task.id;

  card.innerHTML = `
    <div class="task-top-row">
      <span class="task-project">${project ? project.code.replace("Project ","") : "—"}</span>
      <span class="task-hours">${task.hours}h</span>
    </div>
    <div class="task-desc" title="${escapeHtml(task.desc)}">${escapeHtml(task.desc)}</div>
    <div class="task-bot-row">
      <label class="task-check">
        <input type="checkbox" ${task.completed ? "checked" : ""} ${editable ? "" : "disabled"}>
        ${task.completed ? "Done" : "Mark done"}
      </label>
      ${editable ? `<button class="task-delete" title="Delete task">×</button>` : ""}
    </div>
  `;

  // Tooltip on hover (project context)
  card.addEventListener("mouseenter", e => {
    if (project) showTooltip(e, project);
  });
  card.addEventListener("mousemove", moveTooltip);
  card.addEventListener("mouseleave", hideTooltip);

  // Drag
  if (editable) {
    card.addEventListener("dragstart", e => {
      hideTooltip();
      card.classList.add("dragging");
      e.dataTransfer.setData("text/plain", task.id);
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  }

  // Tick
  const checkbox = card.querySelector('input[type="checkbox"]');
  if (editable) {
    checkbox.addEventListener("change", e => {
      e.stopPropagation();
      task.completed = checkbox.checked;
      renderTodoBoard();
    });
  }
  // Delete
  const deleteBtn = card.querySelector(".task-delete");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (confirm("Delete this task?")) {
        const idx = TODO_TASKS.findIndex(t => t.id === task.id);
        if (idx > -1) TODO_TASKS.splice(idx, 1);
        renderTodoBoard();
      }
    });
  }

  return card;
}

// ---------- drag handlers ----------
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

  // Find where to drop based on Y position
  const dragging = document.querySelector(".task-card.dragging");
  if (!dragging) return;
  const after = getDragAfterElement(list, e.clientY);
  if (after == null) {
    list.appendChild(dragging);
  } else {
    list.insertBefore(dragging, after);
  }
}
function handleDragLeave(e) {
  // Only clear when leaving the list itself, not its children
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

  // Update task person/when
  task.person = personKey;
  task.when = when;

  // Reorder in the array based on the DOM order now created
  const newOrder = [...list.querySelectorAll(".task-card")].map(el => el.dataset.taskId);
  // Pull all tasks for this person+when, reorder them to match newOrder
  const otherTasks = TODO_TASKS.filter(t => !(t.person === personKey && t.when === when));
  const reorderedHere = newOrder.map(id => TODO_TASKS.find(t => t.id === id)).filter(Boolean);
  TODO_TASKS.length = 0;
  TODO_TASKS.push(...otherTasks, ...reorderedHere);

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
// ADD TASK MODAL
// =======================================================================
function initTodoModal() {
  const overlay = document.getElementById("modal-overlay");
  const addBtn = document.getElementById("todo-add-btn");
  const closeBtn = document.getElementById("modal-close");
  const cancelBtn = document.getElementById("m-cancel");
  const saveBtn = document.getElementById("m-save");
  const personSel = document.getElementById("m-person");
  const projectSel = document.getElementById("m-project");
  const descEl = document.getElementById("m-desc");
  const wordsEl = document.getElementById("m-words");
  const blockButtons = document.querySelectorAll(".m-block");
  const whenButtons = document.querySelectorAll(".m-when");
  const multiRow = document.getElementById("m-multi-row");
  const multiInput = document.getElementById("m-multi");

  let selectedBlock = "2h";
  let selectedWhen = "week";

  // Populate person dropdown (leads can pick anyone; non-leads only themselves)
  const user = BOARD_PEOPLE.find(p => p.key === CURRENT_USER);
  const allowedPeople = user.isLead ? BOARD_PEOPLE : [user];
  personSel.innerHTML = allowedPeople.map(p =>
    `<option value="${p.key}">${p.initials} · ${p.name}</option>`
  ).join("");

  // Populate project dropdown
  projectSel.innerHTML = PROJECTS.map(p =>
    `<option value="${p.id}">${p.code} · ${escapeHtml(p.blurb.split(" — ")[0])}</option>`
  ).join("");

  // Word counter
  descEl.addEventListener("input", () => {
    const words = descEl.value.trim().split(/\s+/).filter(Boolean).length;
    wordsEl.textContent = words;
    wordsEl.parentElement.classList.toggle("over", words > 50);
  });

  // Block selection
  blockButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      blockButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedBlock = btn.dataset.block;
      // Whole day = 1 only, others can be multiple
      if (selectedBlock === "day") {
        multiRow.style.display = "none";
      } else if (selectedWhen === "future") {
        multiRow.style.display = "block";
      }
    });
  });
  // Default selection
  blockButtons[0].classList.add("active");

  // When selection
  whenButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      whenButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedWhen = btn.dataset.when;
      // Multi-block only for future + 2h/4h
      if (selectedWhen === "future" && selectedBlock !== "day") {
        multiRow.style.display = "block";
      } else {
        multiRow.style.display = "none";
      }
    });
  });

  function openModal() {
    overlay.classList.add("visible");
    // Reset
    descEl.value = "";
    wordsEl.textContent = "0";
    wordsEl.parentElement.classList.remove("over");
    multiInput.value = 1;
    multiRow.style.display = "none";
    blockButtons.forEach(b => b.classList.remove("active"));
    blockButtons[0].classList.add("active");
    selectedBlock = "2h";
    whenButtons.forEach(b => b.classList.remove("active"));
    whenButtons[0].classList.add("active");
    selectedWhen = "week";
  }
  function closeModal() {
    overlay.classList.remove("visible");
  }

  addBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

  saveBtn.addEventListener("click", () => {
    const desc = descEl.value.trim();
    const words = desc.split(/\s+/).filter(Boolean).length;
    if (!desc) { descEl.focus(); return; }
    if (words > 50) {
      alert("Description is over the 50 word limit.");
      return;
    }
    const blockHours = { "2h": 2, "4h": 4, "day": 8 }[selectedBlock];
    const count = (selectedWhen === "future" && selectedBlock !== "day")
      ? Math.max(1, parseInt(multiInput.value, 10) || 1)
      : 1;
    for (let i = 0; i < count; i++) {
      const t = makeTask(personSel.value, projectSel.value, desc, blockHours, selectedWhen);
      TODO_TASKS.push(t);
    }
    // If future, open that person's drawer so they can see what was added
    if (selectedWhen === "future") futureOpenState[personSel.value] = true;
    closeModal();
    renderTodoBoard();
  });
}

renderTodoBoard();
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
    <div class="proj-row${hasMoved ? " moved-this-week" : ""}${agingCls ? " " + agingCls : ""}">
      <div class="proj-identity">
        <div class="proj-code">${p.code}${agingChip}</div>
        <div class="proj-name">${escapeHtml(p.name)}</div>
        <div class="proj-client">${escapeHtml(p.client)}</div>
        <div class="proj-meta">
          <span class="initial-pill">${p.lead}</span>
          <span class="proj-team">${teamPills}</span>
        </div>
      </div>
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
if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
