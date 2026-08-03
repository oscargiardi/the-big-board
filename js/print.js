// =======================================================================
// PRINT / PDF — Monday "issue" of the board
// Browser Print → Save as PDF. Backend later: server PDF + email distribution.
// =======================================================================

function initPrintControls() {
  const btn = document.getElementById("print-issue-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    // Ensure key views have fresh content before printing
    if (typeof renderOverview === "function") renderOverview();
    if (typeof renderOpportunities === "function") renderOpportunities();
    if (typeof renderProjects === "function") renderProjects();
    if (typeof renderPeople === "function") renderPeople();
    if (typeof renderWeekDelta === "function") renderWeekDelta("week-delta-list");
    document.body.classList.add("printing");
    window.print();
    setTimeout(() => document.body.classList.remove("printing"), 500);
  });
}
