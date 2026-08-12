// =======================================================================
// PROJECT HOME — store + overlay UI for per-project facts & key notes.
// Demo persistence via localStorage; API shaped for a future backend.
// =======================================================================

let KEY_NOTES = [];
let _keyNoteId = 0;
let _attachmentId = 0;
/** Persisted overrides: { [projectId]: { address, fee } } */
let PROJECT_HOME_FIELDS = {};

let _phOpenId = null;
let _phPendingFiles = []; // { fileName, fileUrl, mimeType }
let _phTeamOpen = false;
let _phEscBound = false;

// ---------- people helpers ----------
function phPersonByKey(key) {
  if (!key) return { key: "?", name: key || "Unknown", initials: "?" };
  if (typeof LEADS !== "undefined" && LEADS[key]) {
    return { key, name: LEADS[key].name, initials: key };
  }
  if (typeof TEAM_INITIALS !== "undefined") {
    const name = Object.keys(TEAM_INITIALS).find(n => TEAM_INITIALS[n] === key);
    if (name) return { key, name, initials: key };
  }
  if (typeof TEAM !== "undefined" && TEAM.includes(key)) {
    return { key: TEAM_INITIALS[key] || key, name: key, initials: TEAM_INITIALS[key] || initialsOfName(key) };
  }
  return { key, name: key, initials: String(key).slice(0, 2).toUpperCase() };
}

function initialsOfName(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function phEscape(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function phNowISO() {
  return new Date().toISOString();
}

function phTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + "d ago";
  try {
    return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  } catch (_) {
    return String(iso).slice(0, 10);
  }
}

function phFullDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return String(iso);
  }
}

// ---------- persistence ----------
function persistKeyNotes() {
  try {
    localStorage.setItem(STORAGE_KEYS.keyNotes, JSON.stringify({
      seedVersion: typeof KEY_NOTES_SEED_VERSION !== "undefined" ? KEY_NOTES_SEED_VERSION : 2,
      nextId: _keyNoteId,
      nextAttId: _attachmentId,
      notes: KEY_NOTES,
    }));
  } catch (_) { /* quota */ }
}

function persistProjectHomeFields() {
  try {
    localStorage.setItem(STORAGE_KEYS.projectHome, JSON.stringify(PROJECT_HOME_FIELDS));
  } catch (_) { /* quota */ }
}

function loadKeyNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.keyNotes);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const want = typeof KEY_NOTES_SEED_VERSION !== "undefined" ? KEY_NOTES_SEED_VERSION : 2;
    if ((data.seedVersion || 0) < want) return false;
    KEY_NOTES = data.notes || [];
    _keyNoteId = data.nextId || KEY_NOTES.length;
    _attachmentId = data.nextAttId || 0;
    return KEY_NOTES.length > 0;
  } catch (_) {
    return false;
  }
}

function loadProjectHomeFields() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.projectHome);
    if (!raw) return;
    PROJECT_HOME_FIELDS = JSON.parse(raw) || {};
  } catch (_) {
    PROJECT_HOME_FIELDS = {};
  }
}

/** Author key for a team full name, or lead initials. */
function phAuthorFromName(name) {
  if (!name) return typeof DEMO_WHO !== "undefined" ? DEMO_WHO : "MJ";
  if (typeof TEAM_INITIALS !== "undefined" && TEAM_INITIALS[name]) return TEAM_INITIALS[name];
  if (typeof LEADS !== "undefined" && LEADS[name]) return name;
  return typeof DEMO_WHO !== "undefined" ? DEMO_WHO : "MJ";
}

function phIsoAt(dayOffset, hour, minute) {
  const base = typeof WEEK_OF !== "undefined" ? WEEK_OF : "2026-05-25";
  const dt = new Date(base + "T00:00:00");
  dt.setDate(dt.getDate() + (dayOffset || 0));
  dt.setHours(hour == null ? 10 : hour, minute || 0, 0, 0);
  // Keep timezone-stable demo strings
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}:00`;
}

function phStageKickoffText(p) {
  const detail = (p.hoverDetail || p.blurb || "").trim();
  if (p.stage === "opportunity") {
    return detail ? `Opportunity live — ${detail}` : "Opportunity opened.";
  }
  if (p.stage === "frontend") {
    return detail ? `Front End Design underway. ${detail}` : "Moved into Front End Design.";
  }
  if (p.stage === "documentation") {
    return detail ? `Documentation package in progress. ${detail}` : "Documentation stage kicked off.";
  }
  if (p.stage === "support") {
    const pc = p.pcDate ? ` PC targeted ${p.pcDate}.` : "";
    return detail ? `On site / Design Support.${pc} ${detail}` : `Design Support phase active.${pc}`;
  }
  return detail || "Project update.";
}

function phPriorityNote(p) {
  const pri = (p.weekPriority || "").trim();
  if (!pri || pri.toUpperCase() === "NA") return null;
  return `This week focus: ${pri}.`;
}

function phMilestoneNote(due) {
  if (!due || !due.label) return null;
  return `Milestone locked in — ${due.label}${due.date ? ` (${due.date})` : ""}.`;
}

function phAttachmentFor(p, kind) {
  const code = (p.code || p.id || "Project").replace(/\s+/g, "-");
  const names = {
    pitch: `${code}-pitch-deck.pdf`,
    scheme: `${code}-scheme-options.pdf`,
    tender: `${code}-tender-set.pdf`,
    site: `${code}-site-photos.zip`,
    markup: `${code}-coordination-markup.pdf`,
  };
  return {
    id: "Aseed" + (++_attachmentId),
    fileName: names[kind] || `${code}-note.pdf`,
    fileUrl: "",
    version: 1,
    uploadedAt: phIsoAt(-2, 15, 0),
  };
}

/**
 * Seed key notes for every project from board data + to-do tasks.
 * Authors are leads / team / todo assignees.
 */
function seedKeyNotesIfEmpty() {
  if (loadKeyNotes()) return;
  KEY_NOTES = [];
  _keyNoteId = 0;
  _attachmentId = 0;

  if (typeof PROJECTS === "undefined") {
    persistKeyNotes();
    return;
  }

  const todosByProject = {};
  const todoSource = (typeof TODO_TASKS !== "undefined" && TODO_TASKS.length)
    ? TODO_TASKS
    : (typeof seedTodoTasks === "function" ? seedTodoTasks() : []);
  todoSource.forEach(t => {
    if (!t.project) return;
    if (!todosByProject[t.project]) todosByProject[t.project] = [];
    todosByProject[t.project].push(t);
  });

  const attByStage = {
    opportunity: "pitch",
    frontend: "scheme",
    documentation: "tender",
    support: "site",
  };

  PROJECTS.forEach((p, idx) => {
    const lead = p.lead || "MJ";
    const teamAuthors = (p.team || []).map(phAuthorFromName);
    const coAuthor = teamAuthors[0] || lead;
    const notes = [];

    notes.push({
      authorId: lead,
      text: phStageKickoffText(p),
      createdAt: phIsoAt(-18 - (idx % 5), 9, 15),
      attachments: (idx % 4 === 0) ? [phAttachmentFor(p, attByStage[p.stage] || "markup")] : [],
    });

    const pri = phPriorityNote(p);
    if (pri) {
      notes.push({
        authorId: coAuthor,
        text: pri,
        createdAt: phIsoAt(-3, 11, 20),
        attachments: [],
      });
    }

    (p.dueDates || []).slice(0, 2).forEach((due, di) => {
      const text = phMilestoneNote(due);
      if (!text) return;
      notes.push({
        authorId: teamAuthors[di % Math.max(teamAuthors.length, 1)] || lead,
        text,
        createdAt: phIsoAt(-10 + di * 2, 14, 5),
        attachments: [],
      });
    });

    if (p.stage === "support" && p.pcDate) {
      notes.push({
        authorId: lead,
        text: `Practical Completion currently forecast ${p.pcDate}. Site coordination continuing — flag variations early.`,
        createdAt: phIsoAt(-5, 16, 40),
        attachments: (idx % 3 === 0) ? [phAttachmentFor(p, "site")] : [],
      });
    }

    const tasks = (todosByProject[p.id] || []).slice(0, 3);
    tasks.forEach((t, ti) => {
      const whenLabel = t.when === "future" ? "parked for a later week" : "on this week's board";
      notes.push({
        authorId: t.person || lead,
        text: `${String(t.desc || "").replace(/\.$/, "")} — ${whenLabel}.`,
        createdAt: phIsoAt(-2 + ti, 8 + ti, 30),
        attachments: [],
      });
    });

    if (notes.length < 2) {
      notes.push({
        authorId: coAuthor,
        text: `${p.blurb || p.name || p.code} — team continuing coordination with ${lead}.`,
        createdAt: phIsoAt(-1, 12, 0),
        attachments: [],
      });
    }

    notes.forEach(s => {
      KEY_NOTES.push({
        id: "KN" + (++_keyNoteId),
        projectId: p.id,
        authorId: s.authorId,
        text: s.text,
        createdAt: s.createdAt,
        editedAt: null,
        deletedAt: null,
        attachments: s.attachments || [],
      });
    });
  });

  KEY_NOTES.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  persistKeyNotes();
}

function seedProjectHomeDefaults() {
  if (typeof PROJECTS === "undefined") return;
  const addressHints = {
    P01: "Fitzroy VIC",
    P02: "Sydney CBD NSW",
    P04: "Collingwood VIC",
    P08: "435 Bourke Street, Melbourne VIC 3000",
    P17: "99 King Street, Melbourne VIC 3000",
  };
  PROJECTS.forEach(p => {
    const saved = PROJECT_HOME_FIELDS[p.id] || {};
    if (saved.name != null) p.name = saved.name;
    if (p.address == null) p.address = saved.address != null ? saved.address : (addressHints[p.id] || "");
    else if (saved.address != null) p.address = saved.address;
    if (p.fee == null) {
      if (saved.fee != null) {
        p.fee = saved.fee;
      } else if (typeof fmtCurrencyLong === "function" && p.totalValue) {
        p.fee = fmtCurrencyLong(p.totalValue) + " ex GST";
      } else if (p.estimatedValue && typeof fmtCurrencyLong === "function") {
        p.fee = fmtCurrencyLong(p.estimatedValue) + " est. ex GST";
      } else {
        p.fee = "";
      }
    } else if (saved.fee != null) {
      p.fee = saved.fee;
    }
  });
}

// ---------- store API ----------
function getProjectHome(projectId) {
  return (typeof PROJECTS !== "undefined" && PROJECTS.find(p => p.id === projectId)) || null;
}

function updateProjectField(projectId, field, value) {
  const p = getProjectHome(projectId);
  if (!p) return null;
  const allowed = ["name", "address", "fee", "stage"];
  if (!allowed.includes(field)) return null;
  const from = p[field];
  if (from === value) return p;
  p[field] = value;
  if (field === "address" || field === "fee" || field === "name") {
    PROJECT_HOME_FIELDS[projectId] = PROJECT_HOME_FIELDS[projectId] || {};
    PROJECT_HOME_FIELDS[projectId][field] = value;
    persistProjectHomeFields();
  }
  if (typeof recordChange === "function") {
    recordChange({
      entityType: "project",
      entityId: projectId,
      action: "update",
      field,
      from,
      to: value,
      who: typeof DEMO_WHO !== "undefined" ? DEMO_WHO : "MJ",
      at: phNowISO(),
    });
  }
  return p;
}

function setProjectTeam(projectId, teamNames) {
  const p = getProjectHome(projectId);
  if (!p) return null;
  const from = (p.team || []).slice();
  const to = (teamNames || []).slice();
  p.team = to;
  if (typeof recordChange === "function") {
    recordChange({
      entityType: "project",
      entityId: projectId,
      action: "update",
      field: "team",
      from,
      to,
      who: typeof DEMO_WHO !== "undefined" ? DEMO_WHO : "MJ",
      at: phNowISO(),
    });
  }
  return p;
}

function listNotes(projectId) {
  return KEY_NOTES
    .filter(n => n.projectId === projectId)
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function createNote(projectId, text, attachments) {
  const note = {
    id: "KN" + (++_keyNoteId),
    projectId,
    authorId: typeof DEMO_WHO !== "undefined" ? DEMO_WHO : "MJ",
    text: (text || "").trim(),
    createdAt: phNowISO(),
    editedAt: null,
    deletedAt: null,
    attachments: attachments || [],
  };
  KEY_NOTES.unshift(note);
  persistKeyNotes();
  if (typeof recordChange === "function") {
    recordChange({
      entityType: "key_note",
      entityId: note.id,
      action: "create",
      field: "text",
      from: null,
      to: note.text,
      who: note.authorId,
      at: note.createdAt,
      meta: { projectId, attachmentCount: note.attachments.length },
    });
  }
  return note;
}

function updateNote(noteId, text) {
  const note = KEY_NOTES.find(n => n.id === noteId);
  if (!note || note.deletedAt) return null;
  const from = note.text;
  const to = (text || "").trim();
  if (from === to) return note;
  note.text = to;
  note.editedAt = phNowISO();
  persistKeyNotes();
  if (typeof recordChange === "function") {
    recordChange({
      entityType: "key_note",
      entityId: noteId,
      action: "edit",
      field: "text",
      from,
      to,
      who: typeof DEMO_WHO !== "undefined" ? DEMO_WHO : "MJ",
      at: note.editedAt,
      meta: { projectId: note.projectId },
    });
  }
  return note;
}

function softDeleteNote(noteId) {
  const note = KEY_NOTES.find(n => n.id === noteId);
  if (!note || note.deletedAt) return null;
  const from = note.text;
  note.deletedAt = phNowISO();
  persistKeyNotes();
  if (typeof recordChange === "function") {
    recordChange({
      entityType: "key_note",
      entityId: noteId,
      action: "delete",
      field: "deletedAt",
      from: null,
      to: note.deletedAt,
      who: typeof DEMO_WHO !== "undefined" ? DEMO_WHO : "MJ",
      at: note.deletedAt,
      meta: { projectId: note.projectId, previousText: from },
    });
  }
  return note;
}

function nextAttachmentVersion(note, fileName) {
  const same = (note.attachments || []).filter(a => a.fileName === fileName);
  if (!same.length) return 1;
  return Math.max(...same.map(a => a.version || 1)) + 1;
}

function addNoteAttachments(noteId, fileEntries) {
  const note = KEY_NOTES.find(n => n.id === noteId);
  if (!note || note.deletedAt) return null;
  const added = [];
  (fileEntries || []).forEach(f => {
    const version = nextAttachmentVersion(note, f.fileName);
    const att = {
      id: "ATT" + (++_attachmentId),
      fileName: f.fileName,
      fileUrl: f.fileUrl || "",
      version,
      uploadedAt: phNowISO(),
    };
    note.attachments.push(att);
    added.push(att);
  });
  persistKeyNotes();
  return added;
}

function noteEditHistory(noteId) {
  if (typeof EVENT_LOG === "undefined") return [];
  return EVENT_LOG.filter(e => e.entityType === "key_note" && e.entityId === noteId && e.action === "edit");
}

// ---------- file reading ----------
function readFilesAsAttachments(fileList) {
  const files = Array.from(fileList || []);
  return Promise.all(files.map(file => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      let url = String(reader.result || "");
      if (url.length > KEY_NOTE_ATTACHMENT_MAX_CHARS) {
        url = "";
        if (typeof showToast === "function") {
          showToast(`${file.name} too large for demo storage — name kept only`, { tone: "neutral" });
        }
      }
      resolve({ fileName: file.name, fileUrl: url, mimeType: file.type || "" });
    };
    reader.onerror = () => resolve({ fileName: file.name, fileUrl: "", mimeType: file.type || "" });
    reader.readAsDataURL(file);
  })));
}

// ---------- list view ----------
function renderProjectList() {
  const container = document.getElementById("project-list-groups");
  if (!container || typeof PROJECTS === "undefined" || typeof STAGES === "undefined") return;

  const stageOrder = ["opportunity", "frontend", "documentation", "support"];
  const groups = {};
  stageOrder.forEach(st => { groups[st] = []; });
  let total = 0;
  PROJECTS.forEach(p => {
    if (p.status === "lost") return;
    const st = groups[p.stage] ? p.stage : "frontend";
    groups[st].push(p);
    total++;
  });

  if (!total) {
    container.innerHTML = `<div class="ph-feed-empty">No projects yet.</div>`;
    const countEl = document.getElementById("project-list-count");
    if (countEl) countEl.textContent = "0";
    return;
  }

  const countEl = document.getElementById("project-list-count");
  if (countEl) countEl.textContent = String(total);

  container.innerHTML = stageOrder.map(st => {
    const projects = groups[st];
    if (!projects.length) return "";
    const stage = STAGES[st];
    return `
      <section class="proj-group">
        <div class="proj-group-head">
          <span class="proj-group-swatch ${stage.color}"></span>
          <span class="proj-group-title">${phEscape(stage.label)}</span>
          <span class="proj-group-count">${projects.length} project${projects.length === 1 ? "" : "s"}</span>
        </div>
        <div class="ph-list">
          ${projects.map(p => {
            const teamPills = (p.team || []).map(t =>
              `<span class="initial-pill">${phEscape(TEAM_INITIALS[t] || initialsOfName(t))}</span>`
            ).join("");
            return `
              <button type="button" class="ph-list-row" data-open-project="${phEscape(p.id)}">
                <div class="ph-list-id">
                  <span class="ph-list-code">${phEscape(p.code)}</span>
                  <span class="ph-list-name">${phEscape(p.name || p.code)}</span>
                  <span class="ph-list-client">${phEscape(p.client || "")}</span>
                </div>
                <div class="ph-list-meta">
                  <span class="ph-list-stage">${phEscape(stage.short || stage.label)}</span>
                  <span class="initial-pill lead">${phEscape(p.lead)}</span>
                  ${teamPills}
                  <span class="ph-open-hint">Open →</span>
                </div>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }).join("");
}

// ---------- open / close (in-tab drill-down on Projects) ----------
function activateProjectListView() {
  document.querySelectorAll("#nav button").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector('#nav button[data-view="project-list"]');
  if (btn) btn.classList.add("active");
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const view = document.getElementById("view-project-list");
  if (view) view.classList.add("active");
  if (typeof window._positionNavInk === "function") window._positionNavInk();
}

function showHomePanel() {
  const listPanel = document.getElementById("project-list-panel");
  const homePanel = document.getElementById("project-home-panel");
  if (listPanel) {
    listPanel.classList.remove("ph-panel-visible");
    listPanel.classList.add("ph-panel-hidden");
  }
  if (homePanel) {
    homePanel.classList.remove("ph-panel-hidden");
    homePanel.classList.add("ph-panel-visible");
  }
}

function showListPanel() {
  const listPanel = document.getElementById("project-list-panel");
  const homePanel = document.getElementById("project-home-panel");
  if (homePanel) {
    homePanel.classList.remove("ph-panel-visible");
    homePanel.classList.add("ph-panel-hidden");
  }
  if (listPanel) {
    listPanel.classList.remove("ph-panel-hidden");
    listPanel.classList.add("ph-panel-visible");
  }
}

function openProjectHome(projectId) {
  try {
    const p = getProjectHome(projectId);
    if (!p) {
      console.warn("Project Home: project not found", projectId);
      if (typeof showToast === "function") showToast("Project not found", { tone: "danger" });
      return;
    }
    _phOpenId = projectId;
    _phPendingFiles = [];
    _phTeamOpen = false;

    activateProjectListView();
    showHomePanel();
    renderProjectHomeBody();
    window.scrollTo(0, 0);

    if (!_phEscBound) {
      _phEscBound = true;
      document.addEventListener("keydown", phOnKeydown);
    }
  } catch (err) {
    console.error("openProjectHome failed", err);
    if (typeof showToast === "function") showToast("Could not open project home", { tone: "danger" });
  }
}

function closeProjectHome() {
  showListPanel();
  _phOpenId = null;
  _phPendingFiles = [];
  _phTeamOpen = false;
  if (typeof renderProjectList === "function") renderProjectList();
  window.scrollTo(0, 0);
}

function phOnKeydown(e) {
  if (e.key === "Escape" && _phOpenId) {
    const editing = document.querySelector("#project-home-body .ph-inline-input, #project-home-body .ph-note-edit-input");
    if (editing) return;
    closeProjectHome();
  }
}

function initProjectHome() {
  try {
    loadProjectHomeFields();
    seedKeyNotesIfEmpty();
    seedProjectHomeDefaults();
  } catch (err) {
    console.error("Project Home seed failed", err);
  }

  const closeBtn = document.getElementById("ph-close");
  if (closeBtn) {
    closeBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeProjectHome();
    };
  }

  // Capture-phase opener for list + progress + cards
  document.addEventListener("click", function (e) {
    if (e.target.closest("#ph-close")) return;
    if (e.target.closest(".pipe-stage, .opp-actions, .heat-stop, .opp-value-amount, .ac-restore")) return;
    // Don't re-trigger while interacting inside an open home
    if (e.target.closest("#project-home-body")) return;

    const opener = e.target.closest("[data-open-project]");
    if (!opener) return;
    const id = opener.getAttribute("data-open-project");
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    openProjectHome(id);
  }, true);

  // Expose globally for inline onclick handlers
  window.openProjectHome = openProjectHome;
  window.closeProjectHome = closeProjectHome;

  renderProjectList();
  showListPanel();
}

// ---------- render home body ----------
function renderProjectHomeBody() {
  const body = document.getElementById("project-home-body");
  const p = getProjectHome(_phOpenId);
  if (!body || !p) return;

  const stageOptions = Object.keys(STAGES).map(key =>
    `<option value="${key}"${p.stage === key ? " selected" : ""}>${phEscape(STAGES[key].label)}</option>`
  ).join("");

  const team = p.team || [];
  const teamPills = team.length
    ? team.map(t => `<span class="initial-pill" title="${phEscape(t)}">${phEscape(TEAM_INITIALS[t] || initialsOfName(t))}</span>`).join("")
    : `<span class="ph-team-empty">No team yet</span>`;

  const notes = listNotes(p.id);
  const author = phPersonByKey(typeof DEMO_WHO !== "undefined" ? DEMO_WHO : "MJ");

  body.innerHTML = `
    <div class="ph-headline">
      <div class="ph-headline-top">
        <div class="ph-headline-main">
          <div class="ph-eyebrow">Project · click any field to edit</div>
          <div class="ph-title-row">
            <span class="ph-code">${phEscape(p.code)}</span>
            <div class="ph-editable ph-name" data-field="name" id="ph-title">${phEscape(p.name || "Untitled project")}</div>
          </div>
        </div>
        <div class="ph-stage-wrap">
          <label class="m-label" for="ph-stage">Stage</label>
          <select id="ph-stage" class="m-input ph-stage-select">${stageOptions}</select>
        </div>
      </div>
      <div class="ph-facts">
        <div class="ph-fact">
          <div class="m-label">Address</div>
          <div class="ph-editable ph-multiline" data-field="address" data-placeholder="Add address">${p.address ? phEscape(p.address) : "<span class=\"ph-placeholder\">Add address</span>"}</div>
        </div>
        <div class="ph-fact">
          <div class="m-label">Fee</div>
          <div class="ph-editable" data-field="fee" data-placeholder="Add fee">${p.fee ? phEscape(p.fee) : "<span class=\"ph-placeholder\">Add fee</span>"}</div>
        </div>
        <div class="ph-fact ph-fact-team">
          <div class="m-label">Team</div>
          <div class="ph-team-row">
            <div class="ph-team-pills">${teamPills}</div>
            <button type="button" class="todo-btn ghost ph-team-toggle" id="ph-team-toggle">${_phTeamOpen ? "Done" : "Edit team"}</button>
          </div>
          <div class="proj-team-picker ph-team-picker" id="ph-team-picker" ${_phTeamOpen ? "" : "hidden"}></div>
        </div>
      </div>
    </div>

    <div class="ph-notes-head">
      <h2 class="ph-notes-title">Key Notes</h2>
      <span class="ph-notes-count">${notes.length} update${notes.length !== 1 ? "s" : ""}</span>
    </div>

    <div class="ph-notes-card">
      <div class="ph-composer">
        <span class="initial-pill lead">${phEscape(author.initials)}</span>
        <div class="ph-composer-body">
          <textarea id="ph-draft" class="ph-draft" rows="2" placeholder="Post an update for anyone on this project…"></textarea>
          <div class="ph-pending" id="ph-pending"></div>
          <div class="ph-composer-actions">
            <button type="button" class="todo-btn ghost" id="ph-attach">Attach</button>
            <input type="file" id="ph-file" multiple hidden>
            <button type="button" class="todo-btn primary" id="ph-post" disabled>Post</button>
          </div>
        </div>
      </div>
      <div class="ph-feed" id="ph-feed">
        ${notes.map(n => renderNoteHtml(n)).join("") || `<div class="ph-feed-empty">No key notes yet — post the first update.</div>`}
      </div>
    </div>
  `;

  wireProjectHomeInteractions(p);
}

function renderNoteHtml(note) {
  if (note.deletedAt) {
    const who = phPersonByKey(note.authorId);
    return `
      <div class="ph-note ph-note-deleted" data-note-id="${phEscape(note.id)}">
        <span class="initial-pill">${phEscape(who.initials)}</span>
        <div class="ph-note-body">
          <div class="ph-note-meta">
            <span class="ph-note-author">${phEscape(who.name)}</span>
            <span class="ph-note-time" title="${phEscape(phFullDate(note.deletedAt))}">Removed · ${phEscape(phTimeAgo(note.deletedAt))}</span>
          </div>
          <p class="ph-note-tombstone">Note removed</p>
        </div>
      </div>
    `;
  }

  const who = phPersonByKey(note.authorId);
  const edits = noteEditHistory(note.id);
  const editTitle = edits.length
    ? edits.map(e => `Was: ${e.from}`).join("\n")
    : "";
  const editedBadge = note.editedAt
    ? `<span class="ph-note-edited" title="${phEscape(editTitle || phFullDate(note.editedAt))}">Edited</span>`
    : "";

  const atts = (note.attachments || []).map(a => {
    const label = a.version > 1 ? `${a.fileName} (v${a.version})` : a.fileName;
    const href = a.fileUrl ? ` href="${phEscape(a.fileUrl)}" download="${phEscape(a.fileName)}"` : "";
    const tag = a.fileUrl ? "a" : "span";
    return `<${tag} class="ph-att-chip"${href} title="${phEscape(a.fileName)} · v${a.version}">${phEscape(label)}</${tag}>`;
  }).join("");

  const canEdit = true; // demo: anyone on the board can edit/delete

  return `
    <div class="ph-note" data-note-id="${phEscape(note.id)}">
      <span class="initial-pill">${phEscape(who.initials)}</span>
      <div class="ph-note-body">
        <div class="ph-note-meta">
          <span class="ph-note-author">${phEscape(who.name)}</span>
          <span class="ph-note-time" title="${phEscape(phFullDate(note.createdAt))}">${phEscape(phTimeAgo(note.createdAt))}</span>
          ${editedBadge}
          ${canEdit ? `
            <button type="button" class="ph-note-action" data-action="edit">Edit</button>
            <button type="button" class="ph-note-action" data-action="attach">Attach</button>
            <button type="button" class="ph-note-action" data-action="delete">Remove</button>
          ` : ""}
        </div>
        <p class="ph-note-text">${phEscape(note.text)}</p>
        ${atts ? `<div class="ph-att-row">${atts}</div>` : ""}
        <input type="file" class="ph-note-file" multiple hidden data-note-id="${phEscape(note.id)}">
      </div>
    </div>
  `;
}

function wireProjectHomeInteractions(p) {
  // Inline editable fields
  document.querySelectorAll("#project-home-body .ph-editable").forEach(el => {
    el.addEventListener("click", () => startInlineEdit(el, p));
  });

  // Stage
  const stageSel = document.getElementById("ph-stage");
  if (stageSel) {
    stageSel.addEventListener("change", () => {
      updateProjectField(p.id, "stage", stageSel.value);
      refreshAfterProjectHomeChange();
      renderProjectHomeBody();
    });
  }

  // Team picker
  const toggle = document.getElementById("ph-team-toggle");
  const picker = document.getElementById("ph-team-picker");
  if (toggle && picker) {
    if (_phTeamOpen) fillTeamPicker(picker, p);
    toggle.addEventListener("click", () => {
      _phTeamOpen = !_phTeamOpen;
      renderProjectHomeBody();
    });
  }

  // Composer
  const draft = document.getElementById("ph-draft");
  const postBtn = document.getElementById("ph-post");
  const attachBtn = document.getElementById("ph-attach");
  const fileInput = document.getElementById("ph-file");
  const pendingEl = document.getElementById("ph-pending");

  function syncPostEnabled() {
    if (!postBtn) return;
    const hasText = draft && draft.value.trim();
    postBtn.disabled = !hasText && _phPendingFiles.length === 0;
  }

  function renderPending() {
    if (!pendingEl) return;
    pendingEl.innerHTML = _phPendingFiles.map((f, i) => `
      <span class="ph-att-chip pending">
        ${phEscape(f.fileName)}
        <button type="button" data-pending-idx="${i}" aria-label="Remove">×</button>
      </span>
    `).join("");
    pendingEl.querySelectorAll("button[data-pending-idx]").forEach(btn => {
      btn.addEventListener("click", () => {
        _phPendingFiles.splice(Number(btn.dataset.pendingIdx), 1);
        renderPending();
        syncPostEnabled();
      });
    });
  }

  if (draft) {
    draft.addEventListener("input", syncPostEnabled);
  }
  if (attachBtn && fileInput) {
    attachBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      if (!fileInput.files || !fileInput.files.length) return;
      const entries = await readFilesAsAttachments(fileInput.files);
      _phPendingFiles = _phPendingFiles.concat(entries);
      fileInput.value = "";
      renderPending();
      syncPostEnabled();
    });
  }
  if (postBtn) {
    postBtn.addEventListener("click", () => {
      if (postBtn.disabled) return;
      const text = draft ? draft.value.trim() : "";
      const atts = _phPendingFiles.map(f => {
        const version = 1;
        return {
          id: "ATT" + (++_attachmentId),
          fileName: f.fileName,
          fileUrl: f.fileUrl,
          version,
          uploadedAt: phNowISO(),
        };
      });
      // Version within the new note's own attachments if duplicate names in one post
      const seen = {};
      atts.forEach(a => {
        seen[a.fileName] = (seen[a.fileName] || 0) + 1;
        a.version = seen[a.fileName];
      });
      createNote(p.id, text, atts);
      _phPendingFiles = [];
      renderProjectHomeBody();
    });
  }

  // Note actions
  document.querySelectorAll("#ph-feed .ph-note").forEach(row => {
    const noteId = row.dataset.noteId;
    const fileInput = row.querySelector(".ph-note-file");
    row.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.action;
        if (action === "delete") {
          softDeleteNote(noteId);
          renderProjectHomeBody();
        } else if (action === "edit") {
          startNoteEdit(row, noteId);
        } else if (action === "attach" && fileInput) {
          fileInput.click();
        }
      });
    });
    if (fileInput) {
      fileInput.addEventListener("change", async () => {
        if (!fileInput.files || !fileInput.files.length) return;
        const entries = await readFilesAsAttachments(fileInput.files);
        addNoteAttachments(noteId, entries);
        if (typeof recordChange === "function") {
          recordChange({
            entityType: "key_note",
            entityId: noteId,
            action: "attach",
            field: "attachments",
            from: null,
            to: entries.map(e => e.fileName),
            who: typeof DEMO_WHO !== "undefined" ? DEMO_WHO : "MJ",
            at: phNowISO(),
            meta: { projectId: p.id },
          });
        }
        fileInput.value = "";
        renderProjectHomeBody();
      });
    }
  });
}

function fillTeamPicker(picker, p) {
  const selected = new Set(p.team || []);
  picker.innerHTML = (typeof TEAM !== "undefined" ? TEAM : []).map(name => {
    const ti = TEAM_INITIALS[name] || initialsOfName(name);
    const active = selected.has(name) ? " active" : "";
    return `<button type="button" class="proj-team-pick${active}" data-name="${phEscape(name)}">${phEscape(ti)} · ${phEscape(name)}</button>`;
  }).join("");
  picker.querySelectorAll(".proj-team-pick").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      if (selected.has(name)) selected.delete(name);
      else selected.add(name);
      setProjectTeam(p.id, Array.from(selected));
      refreshAfterProjectHomeChange();
      btn.classList.toggle("active");
      // Refresh pills without closing picker
      _phTeamOpen = true;
      renderProjectHomeBody();
    });
  });
}

function startInlineEdit(el, p) {
  if (el.querySelector("input, textarea")) return;
  const field = el.dataset.field;
  const multiline = el.classList.contains("ph-multiline");
  const current = p[field] || "";
  const input = document.createElement(multiline ? "textarea" : "input");
  input.className = "ph-inline-input m-input";
  if (multiline) input.rows = 2;
  else input.type = "text";
  input.value = current;
  const prev = el.innerHTML;
  el.innerHTML = "";
  el.appendChild(input);
  input.focus();
  input.select();

  let cancelled = false;
  const commit = () => {
    if (cancelled) return;
    cancelled = true;
    updateProjectField(p.id, field, input.value);
    refreshAfterProjectHomeChange();
    renderProjectHomeBody();
  };
  const cancel = () => {
    cancelled = true;
    el.innerHTML = prev;
  };
  input.addEventListener("blur", commit);
  input.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    } else if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      input.blur();
    }
  });
}

function startNoteEdit(row, noteId) {
  const note = KEY_NOTES.find(n => n.id === noteId);
  if (!note || note.deletedAt) return;
  const textEl = row.querySelector(".ph-note-text");
  if (!textEl || row.querySelector(".ph-note-edit-input")) return;
  const ta = document.createElement("textarea");
  ta.className = "ph-note-edit-input m-input";
  ta.rows = 3;
  ta.value = note.text;
  textEl.replaceWith(ta);
  ta.focus();

  const actions = document.createElement("div");
  actions.className = "ph-note-edit-actions";
  actions.innerHTML = `
    <button type="button" class="todo-btn ghost" data-edit="cancel">Cancel</button>
    <button type="button" class="todo-btn primary" data-edit="save">Save</button>
  `;
  ta.after(actions);

  actions.querySelector('[data-edit="cancel"]').addEventListener("click", () => renderProjectHomeBody());
  actions.querySelector('[data-edit="save"]').addEventListener("click", () => {
    updateNote(noteId, ta.value);
    renderProjectHomeBody();
  });
  ta.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      renderProjectHomeBody();
    }
  });
}

function refreshAfterProjectHomeChange() {
  if (typeof renderProjects === "function") renderProjects();
  if (typeof renderProjectList === "function") renderProjectList();
  if (typeof renderOpportunities === "function") renderOpportunities();
  if (typeof renderDesignSupport === "function") renderDesignSupport();
  if (typeof renderOverview === "function") renderOverview();
  if (typeof renderCalendar === "function") renderCalendar();
  if (typeof renderPeople === "function") renderPeople();
}
