// =======================================================================
// CAPACITY — utilisation, fee burn, scenario mode
// Business logic:
//  • 10 blocks/week per person (1 block = half day).
//  • Util % = allocated blocks / 10 → underused <60% / healthy 60–90% / at-risk >90%.
//  • Fee burn $ = blocksBurned × BLOCK_RATE; margin vs totalValue.
//  • Scenario: if Hot + Cookin' opps win, overlay +2 blocks lead + +2 per teammate.
// Backend later: Streamtime sync or weekly ritual entry of block allocations.
// =======================================================================

/** [{ personKey, projectId, blocks }] — personKey is lead initials or team name. */
let WEEK_ALLOCATIONS = [];
let SCENARIO_MODE = false;

function personKeyForLead(initials) { return initials; }
function personKeyForTeam(name) { return name; }

/**
 * Seed weekly allocations from existing lead/team assignments.
 * Spreads blocks across a person's projects so util sits in a believable range.
 */
function seedWeekAllocations(projects) {
  WEEK_ALLOCATIONS = [];
  const byPerson = {};

  function add(personKey, projectId, blocks) {
    if (!personKey || blocks <= 0) return;
    WEEK_ALLOCATIONS.push({ personKey, projectId, blocks });
    byPerson[personKey] = (byPerson[personKey] || 0) + blocks;
  }

  projects.forEach(p => {
    if (p.stage === "opportunity" && p.status === "lost") return;
    // Lead: heavier on hyper / hot work
    let leadBlocks = p.hyper ? 3 : (p.stage === "opportunity" ? 1 : 2);
    if (p.heat === "cookin" || p.heat === "hot") leadBlocks = Math.max(leadBlocks, 2);
    add(p.lead, p.id, leadBlocks);

    (p.team || []).forEach(name => {
      const teamBlocks = p.stage === "support" ? 2 : 1;
      add(name, p.id, teamBlocks);
    });
  });

  // Cap anyone over 12 by scaling down proportionally (demo realism).
  Object.keys(byPerson).forEach(pk => {
    if (byPerson[pk] <= 11) return;
    const scale = 10 / byPerson[pk];
    WEEK_ALLOCATIONS.forEach(a => {
      if (a.personKey === pk) a.blocks = Math.max(1, Math.round(a.blocks * scale));
    });
  });
}

function allocationsFor(personKey) {
  return WEEK_ALLOCATIONS.filter(a => a.personKey === personKey);
}

function allocatedBlocks(personKey) {
  return allocationsFor(personKey).reduce((s, a) => s + a.blocks, 0);
}

function utilPercent(personKey) {
  return allocatedBlocks(personKey) / BLOCKS_PER_WEEK;
}

function utilBand(pct) {
  if (pct < UTIL_BANDS.underused.max) return UTIL_BANDS.underused;
  if (pct < UTIL_BANDS.healthy.max) return UTIL_BANDS.healthy;
  return UTIL_BANDS.atrisk;
}

/**
 * Seed cumulative blocksBurned from pipeline progress.
 * More closed stages → more burn (demo only — not timesheet truth).
 */
function seedBlocksBurned(projects) {
  projects.forEach(p => {
    if (p.stage === "opportunity") {
      p.blocksBurned = p.blocksBurned || 0;
      return;
    }
    const pipe = p.pipeline || [];
    const closed = pipe.filter(s => s.closed).length;
    const base = closed * 6;
    const stageBonus = { frontend: 8, documentation: 14, support: 22 };
    p.blocksBurned = base + (stageBonus[p.stage] || 10);
  });
}

/** Fee burn $ and margin health chip data. */
function feeBurnHealth(project) {
  const burn = (project.blocksBurned || 0) * BLOCK_RATE;
  const total = project.totalValue || 0;
  if (!total) {
    return { burn, remainingRatio: 1, band: MARGIN_BANDS.green };
  }
  // remainingRatio = fee left after burn / total fee
  const remainingRatio = 1 - burn / total;
  let band = MARGIN_BANDS.red;
  if (remainingRatio >= MARGIN_BANDS.green.min) band = MARGIN_BANDS.green;
  else if (remainingRatio >= MARGIN_BANDS.amber.min) band = MARGIN_BANDS.amber;
  return { burn, remainingRatio, band };
}

/**
 * Scenario footprint: if we win Hot + Cookin' opps, each adds
 * lead 2 blocks + each teammate 2 blocks (hypothetical week+6 load).
 */
function scenarioExtraBlocks(projects) {
  const extras = {}; // personKey → [{projectId, blocks, code}]
  const hot = (projects || []).filter(
    p => p.stage === "opportunity" && p.status === "active" &&
      (p.heat === "hot" || p.heat === "cookin")
  );
  hot.forEach(p => {
    function push(pk, blocks) {
      if (!extras[pk]) extras[pk] = [];
      extras[pk].push({ projectId: p.id, blocks, code: p.code, ghost: true });
    }
    push(p.lead, 2);
    (p.team || []).forEach(name => push(name, 2));
  });
  return { extras, oppCount: hot.length };
}

function scenarioSummary(projects) {
  const { extras, oppCount } = scenarioExtraBlocks(projects);
  let totalBlocks = 0;
  const people = Object.keys(extras);
  people.forEach(pk => {
    extras[pk].forEach(a => { totalBlocks += a.blocks; });
  });
  return { totalBlocks, peopleCount: people.length, oppCount, extras };
}

function renderCapacityBar(personKey, projects) {
  const allocs = allocationsFor(personKey);
  const pct = utilPercent(personKey);
  const band = utilBand(pct);
  const blocks = allocatedBlocks(personKey);

  const segments = allocs.map(a => {
    const p = projects.find(pp => pp.id === a.projectId);
    if (!p) return "";
    const color = STAGES[p.stage] ? STAGES[p.stage].color : "green";
    const width = (a.blocks / BLOCKS_PER_WEEK) * 100;
    const letter = (p.code || "").replace("Project ", "").trim();
    return `
      <div class="bar-block capacity-block ${color}${p.hyper ? " hyper" : ""}"
           data-project-id="${p.id}"
           style="flex: 0 0 ${width}%; max-width: ${width}%;"
           title="${letter} · ${a.blocks} block${a.blocks === 1 ? "" : "s"}">
        ${letter}<span class="block-n">×${a.blocks}</span>
      </div>`;
  }).join("");

  let ghostHtml = "";
  if (SCENARIO_MODE) {
    const { extras } = scenarioExtraBlocks(projects);
    const ghosts = extras[personKey] || [];
    ghostHtml = ghosts.map(g => {
      const width = (g.blocks / BLOCKS_PER_WEEK) * 100;
      const letter = (g.code || "").replace("Project ", "").trim();
      return `
        <div class="bar-block capacity-block ghost"
             style="flex: 0 0 ${width}%; max-width: ${width}%;"
             title="Scenario · ${letter} · +${g.blocks}">
          ${letter}
        </div>`;
    }).join("");
  }

  const scenarioBlocks = SCENARIO_MODE
    ? ((scenarioExtraBlocks(projects).extras[personKey] || []).reduce((s, a) => s + a.blocks, 0))
    : 0;
  const combined = blocks + scenarioBlocks;
  const combinedPct = combined / BLOCKS_PER_WEEK;
  const combinedBand = utilBand(combinedPct);

  return {
    barHtml: (segments || ghostHtml)
      ? `<div class="capacity-track">${segments}${ghostHtml}</div>`
      : `<span class="capacity-empty">No blocks this week</span>`,
    blocks,
    pct,
    band: SCENARIO_MODE ? combinedBand : band,
    combined,
    utilLabel: `${Math.round((SCENARIO_MODE ? combinedPct : pct) * 100)}% · ${(SCENARIO_MODE ? combinedBand : band).label}`,
  };
}
