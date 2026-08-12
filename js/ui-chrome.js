// =======================================================================
// UI chrome — toasts, command palette, user menu, view navigation helpers
// =======================================================================

const VIEW_META = [
  { id: "overview", label: "Overview", hint: "Metrics · hyper priorities · audit" },
  { id: "calendar", label: "Key Dates", hint: "Stage closes · PC · milestones" },
  { id: "opportunities", label: "Opportunities", hint: "Heat · forecast · pitches" },
  { id: "people", label: "People", hint: "Load · utilisation · scenario" },
  { id: "project-list", label: "Projects", hint: "Project home · key notes" },
  { id: "projects", label: "Project Progress", hint: "Pipeline · invoice queue" },
  { id: "todo", label: "To-Do Board", hint: "My tasks · studio board" },
  { id: "support", label: "Design Support", hint: "On site · PC dates" },
];

function showToast(message, opts = {}) {
  const host = document.getElementById("toast-host");
  if (!host || !message) return;
  const el = document.createElement("div");
  el.className = "toast" + (opts.tone ? ` toast-${opts.tone}` : "");
  el.innerHTML = `
    <span class="toast-msg">${escapeHtmlChrome(message)}</span>
    <button type="button" class="toast-dismiss" aria-label="Dismiss">×</button>
  `;
  const remove = () => {
    el.classList.add("toast-out");
    setTimeout(() => el.remove(), 220);
  };
  el.querySelector(".toast-dismiss").addEventListener("click", remove);
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("toast-in"));
  setTimeout(remove, opts.duration || 3200);
}

function escapeHtmlChrome(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function navigateToView(viewId) {
  const btn = document.querySelector(`#nav button[data-view="${viewId}"]`);
  if (!btn) return;
  btn.click();
}

function initUserMenu() {
  const chip = document.getElementById("user-chip");
  const dropdown = document.getElementById("user-dropdown");
  const menu = document.getElementById("user-menu");
  if (!chip || !dropdown || !menu) return;

  function close() {
    dropdown.hidden = true;
    chip.setAttribute("aria-expanded", "false");
  }
  function toggle() {
    const open = dropdown.hidden;
    dropdown.hidden = !open;
    chip.setAttribute("aria-expanded", open ? "true" : "false");
  }

  chip.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  const logout = document.getElementById("user-logout");
  if (logout) {
    logout.addEventListener("click", () => {
      close();
      document.getElementById("app")?.classList.add("locked");
      const screen = document.getElementById("login-screen");
      if (screen) screen.style.display = "";
      const pass = document.getElementById("login-pass");
      if (pass) pass.value = "";
      showToast("Signed out", { tone: "neutral" });
      document.getElementById("login-user")?.focus();
    });
  }

  const userPrint = document.getElementById("user-print");
  if (userPrint) {
    userPrint.addEventListener("click", () => {
      close();
      document.getElementById("print-issue-btn")?.click();
    });
  }
}

function initCommandPalette() {
  const overlay = document.getElementById("cmd-overlay");
  const input = document.getElementById("cmd-input");
  const results = document.getElementById("cmd-results");
  const trigger = document.getElementById("cmd-trigger");
  if (!overlay || !input || !results) return;

  let activeIndex = 0;
  let items = [];

  function open() {
    overlay.hidden = false;
    overlay.classList.add("visible");
    input.value = "";
    activeIndex = 0;
    renderResults("");
    setTimeout(() => input.focus(), 10);
  }
  function close() {
    overlay.classList.remove("visible");
    overlay.hidden = true;
    input.blur();
  }

  function collectItems(q) {
    const query = (q || "").trim().toLowerCase();
    const out = [];

    VIEW_META.forEach(v => {
      if (!query || v.label.toLowerCase().includes(query) || v.hint.toLowerCase().includes(query) || v.id.includes(query)) {
        out.push({
          kind: "view",
          id: v.id,
          title: v.label,
          subtitle: v.hint,
          run: () => navigateToView(v.id),
        });
      }
    });

    if (typeof PROJECTS !== "undefined") {
      PROJECTS.forEach(p => {
        const hay = `${p.code} ${p.name || ""} ${p.client || ""} ${p.blurb || ""} ${p.lead || ""}`.toLowerCase();
        if (!query || hay.includes(query)) {
          const stage = (typeof STAGES !== "undefined" && STAGES[p.stage]) ? STAGES[p.stage].label : p.stage;
          out.push({
            kind: p.stage === "opportunity" ? "opp" : "project",
            id: p.id,
            title: p.name || (p.blurb || "").split(" — ")[0] || p.code,
            subtitle: `${p.code} · ${stage} · Lead ${p.lead}`,
            run: () => {
              if (typeof openProjectHome === "function") {
                openProjectHome(p.id);
              } else {
                navigateToView(p.stage === "opportunity" ? "opportunities" : p.stage === "support" ? "support" : "projects");
                showToast(`Opened ${p.code}`, { tone: "neutral", duration: 2000 });
              }
            },
          });
        }
      });
    }

    return out.slice(0, 12);
  }

  function renderResults(q) {
    items = collectItems(q);
    if (!items.length) {
      results.innerHTML = `<div class="cmd-empty">No matches</div>`;
      return;
    }
    results.innerHTML = items.map((item, i) => `
      <button type="button" class="cmd-item${i === activeIndex ? " active" : ""}" data-index="${i}">
        <span class="cmd-item-kind">${item.kind}</span>
        <span class="cmd-item-body">
          <span class="cmd-item-title">${escapeHtmlChrome(item.title)}</span>
          <span class="cmd-item-sub">${escapeHtmlChrome(item.subtitle)}</span>
        </span>
      </button>
    `).join("");
    results.querySelectorAll(".cmd-item").forEach(btn => {
      btn.addEventListener("click", () => runItem(Number(btn.dataset.index)));
      btn.addEventListener("mouseenter", () => {
        activeIndex = Number(btn.dataset.index);
        paintActive();
      });
    });
  }

  function paintActive() {
    results.querySelectorAll(".cmd-item").forEach((el, i) => {
      el.classList.toggle("active", i === activeIndex);
    });
  }

  function runItem(i) {
    const item = items[i];
    if (!item) return;
    close();
    item.run();
  }

  trigger?.addEventListener("click", open);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  input.addEventListener("input", () => {
    activeIndex = 0;
    renderResults(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(items.length - 1, activeIndex + 1);
      paintActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(0, activeIndex - 1);
      paintActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      runItem(activeIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (document.getElementById("app")?.classList.contains("locked")) return;
      if (overlay.classList.contains("visible")) close();
      else open();
    }
  });
}

function initViewTransitions() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  nav.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-view]");
    if (!btn) return;
    const view = document.getElementById("view-" + btn.dataset.view);
    if (!view) return;
    view.classList.remove("view-enter");
    void view.offsetWidth;
    view.classList.add("view-enter");
  });
}

function initNavInk() {
  const nav = document.getElementById("nav");
  if (!nav) return;

  const ink = document.createElement("span");
  ink.className = "nav-ink";
  nav.appendChild(ink);

  function positionInk(animate) {
    const active = nav.querySelector("button.active");
    if (!active) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = active.getBoundingClientRect();
    if (!animate) {
      ink.style.transition = "none";
      ink.style.left = (btnRect.left - navRect.left + nav.scrollLeft) + "px";
      ink.style.width = btnRect.width + "px";
      void ink.offsetWidth;
      ink.style.transition = "";
    } else {
      ink.style.left = (btnRect.left - navRect.left + nav.scrollLeft) + "px";
      ink.style.width = btnRect.width + "px";
    }
  }

  requestAnimationFrame(() => positionInk(false));
  window.addEventListener("load", () => positionInk(false));
  window.addEventListener("resize", () => positionInk(false));
  nav.addEventListener("click", () => requestAnimationFrame(() => positionInk(true)));

  window._positionNavInk = () => positionInk(true);
}

function initChrome() {
  initUserMenu();
  initCommandPalette();
  initViewTransitions();
  initNavInk();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChrome);
} else {
  initChrome();
}
