// =======================================================================
// WEIGHTED PIPELINE FORECAST
// Business logic: projected revenue = Σ (estimatedValue × HEAT_PROB[heat]),
// bucketed by month of stageClose. Zero new data entry — heat + value +
// close date already live on every opportunity card.
// Backend later: calibrate probs from historic win rates per studio/state.
// =======================================================================

function weightedOppValue(opp) {
  const prob = HEAT_PROB[opp.heat] != null ? HEAT_PROB[opp.heat] : HEAT_PROB.simmer;
  return (opp.estimatedValue || 0) * prob;
}

/**
 * Returns [{ key, label, weighted, count }, ...] for active opps,
 * plus a total. Months with no weight are omitted unless within near horizon.
 */
function buildWeightedForecast(projects, weekOf) {
  const active = (projects || []).filter(
    p => p.stage === "opportunity" && p.status === "active"
  );
  const byMonth = {};
  let total = 0;

  active.forEach(p => {
    const w = weightedOppValue(p);
    total += w;
    const close = p.stageClose || weekOf;
    const d = new Date(close + "T00:00:00");
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const label = MONTHS[d.getMonth()] + " " + d.getFullYear();
    if (!byMonth[key]) byMonth[key] = { key, label, weighted: 0, count: 0 };
    byMonth[key].weighted += w;
    byMonth[key].count += 1;
  });

  const months = Object.keys(byMonth).sort().map(k => byMonth[k]);
  return { months, total, oppCount: active.length };
}

function renderWeightedForecast(containerId, projects, weekOf) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const { months, total, oppCount } = buildWeightedForecast(projects, weekOf);

  if (!oppCount) {
    el.innerHTML = `
      <div class="forecast-empty empty-state">
        No active opportunities — forecast is empty until heat-rated pitches land.
      </div>`;
    return;
  }

  const cols = months.map(m => `
    <div class="forecast-col">
      <div class="forecast-month">${m.label}</div>
      <div class="forecast-value">${fmtCurrency(Math.round(m.weighted))}</div>
      <div class="forecast-count">${m.count} opp${m.count === 1 ? "" : "s"}</div>
    </div>
  `).join("");

  el.innerHTML = `
    <div class="forecast-head">
      <div>
        <div class="forecast-title">Weighted pipeline forecast</div>
        <div class="forecast-sub">Cool 10% · Simmer 30% · Hot 55% · Cookin' 80% · by stage-close month</div>
      </div>
      <div class="forecast-total">
        <span class="forecast-total-label">Projected</span>
        <strong>${fmtCurrency(Math.round(total))}</strong>
      </div>
    </div>
    <div class="forecast-cols">${cols}</div>
  `;
}
