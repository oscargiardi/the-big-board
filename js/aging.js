// =======================================================================
// TIME-IN-STAGE AGING
// Business logic: flag stalled work without new forms.
//  • Opp past stageClose → amber; >7 days past → red
//  • FED/DOC past amber/red day thresholds in current master stage
//  • Design Support past Practical Completion → amber→red
// Backend later: stageEnteredAt set automatically on every stage move.
// =======================================================================

function daysBetween(isoA, isoB) {
  const a = new Date(isoA + "T00:00:00");
  const b = new Date(isoB + "T00:00:00");
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Seed stageEnteredAt so aging is demoable.
 * Older stages / overdue closes get earlier entry dates.
 */
function seedStageEnteredAt(projects, weekOf) {
  projects.forEach((p, idx) => {
    if (p.stageEnteredAt) return;
    if (p.stage === "opportunity") {
      // Entered ~2–5 weeks before close, or already overdue for a few
      const close = p.stageClose || weekOf;
      const offset = (idx % 3 === 0) ? 35 : 18;
      const entered = new Date(close + "T00:00:00");
      entered.setDate(entered.getDate() - offset);
      p.stageEnteredAt = entered.toISOString().slice(0, 10);
    } else if (p.stage === "frontend") {
      const daysBack = 20 + (idx % 5) * 7; // some past amber
      const entered = new Date(weekOf + "T00:00:00");
      entered.setDate(entered.getDate() - daysBack);
      p.stageEnteredAt = entered.toISOString().slice(0, 10);
    } else if (p.stage === "documentation") {
      const daysBack = 30 + (idx % 4) * 10;
      const entered = new Date(weekOf + "T00:00:00");
      entered.setDate(entered.getDate() - daysBack);
      p.stageEnteredAt = entered.toISOString().slice(0, 10);
    } else if (p.stage === "support") {
      const pc = p.pcDate || p.completion || weekOf;
      const entered = new Date(pc + "T00:00:00");
      entered.setDate(entered.getDate() - 45);
      p.stageEnteredAt = entered.toISOString().slice(0, 10);
    }
  });
}

/**
 * Returns { level: null|'amber'|'red', days, label } for a project/opp.
 */
function agingStatus(p, todayISO) {
  const today = todayISO || WEEK_OF;

  if (p.stage === "opportunity" && p.status === "active") {
    if (!p.stageClose) return { level: null, days: 0, label: "" };
    const overdue = daysBetween(p.stageClose, today);
    if (overdue > OPP_OVERDUE_RED_DAYS) {
      return { level: "red", days: overdue, label: overdue + "d past close" };
    }
    if (overdue > 0) {
      return { level: "amber", days: overdue, label: overdue + "d past close" };
    }
    return { level: null, days: 0, label: "" };
  }

  if (p.stage === "support") {
    const pc = p.pcDate || p.completion;
    if (!pc) return { level: null, days: 0, label: "" };
    const past = daysBetween(pc, today);
    if (past > 14) return { level: "red", days: past, label: past + "d past PC" };
    if (past > 0) return { level: "amber", days: past, label: past + "d past PC" };
    return { level: null, days: 0, label: "" };
  }

  const thresholds = STAGE_AGING[p.stage];
  if (!thresholds || thresholds.amberDays == null) {
    return { level: null, days: 0, label: "" };
  }
  const entered = p.stageEnteredAt || today;
  const days = daysBetween(entered, today);
  if (days >= thresholds.redDays) {
    return { level: "red", days, label: days + "d in stage" };
  }
  if (days >= thresholds.amberDays) {
    return { level: "amber", days, label: days + "d in stage" };
  }
  if (days >= 7) {
    return { level: null, days, label: days + "d in stage" };
  }
  return { level: null, days, label: "" };
}

function agingChipHtml(p) {
  const a = agingStatus(p);
  if (!a.label) return "";
  const cls = a.level ? "aging-chip " + a.level : "aging-chip";
  return `<span class="${cls}">${a.label}</span>`;
}

function agingClass(p) {
  const a = agingStatus(p);
  return a.level ? "aging-" + a.level : "";
}
