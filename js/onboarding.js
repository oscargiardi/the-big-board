// =======================================================================
// ONBOARDING + LOADING
// First-visit 3-step overlay. Lightweight skeleton on first paint.
// Backend later: per-user onboarding state from auth profile.
// =======================================================================

function showLoadingSkeleton() {
  const app = document.getElementById("app");
  if (!app) return;
  const overlay = document.createElement("div");
  overlay.id = "loading-skeleton";
  overlay.className = "loading-skeleton";
  overlay.innerHTML = `
    <div class="skel-line skel-lg"></div>
    <div class="skel-line"></div>
    <div class="skel-line skel-mid"></div>
    <div class="skel-cards">
      <div class="skel-card"></div>
      <div class="skel-card"></div>
      <div class="skel-card"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("done");
    setTimeout(() => overlay.remove(), 200);
  }, 180);
}

function initOnboarding() {
  try {
    if (localStorage.getItem(STORAGE_KEYS.onboarded) === "1") return;
  } catch (_) {}

  const overlay = document.getElementById("onboard-overlay");
  if (!overlay) return;

  let step = 0;
  const steps = overlay.querySelectorAll(".onboard-step");
  const dots = overlay.querySelectorAll(".onboard-dot");
  const nextBtn = document.getElementById("onboard-next");
  const skipBtn = document.getElementById("onboard-skip");

  function showStep(i) {
    steps.forEach((s, idx) => s.classList.toggle("active", idx === i));
    dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
    if (nextBtn) nextBtn.textContent = i === steps.length - 1 ? "Enter the board" : "Next";
  }

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEYS.onboarded, "1"); } catch (_) {}
    overlay.classList.remove("visible");
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (step >= steps.length - 1) dismiss();
      else {
        step += 1;
        showStep(step);
      }
    });
  }
  if (skipBtn) skipBtn.addEventListener("click", dismiss);

  showStep(0);
  // Show after login succeeds — caller may also invoke revealOnboarding()
  overlay.dataset.ready = "1";
}

function revealOnboarding() {
  const overlay = document.getElementById("onboard-overlay");
  if (!overlay || overlay.dataset.ready !== "1") return;
  try {
    if (localStorage.getItem(STORAGE_KEYS.onboarded) === "1") return;
  } catch (_) {}
  overlay.classList.add("visible");
}
