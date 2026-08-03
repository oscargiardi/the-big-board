// =======================================================================
// THE BIG BOARD — shared constants for money, capacity, and aging.
// Backend later: store these as studio settings, not hardcodes.
// =======================================================================

/** Heat → conversion probability. Weighted forecast = value × prob. */
const HEAT_PROB = {
  cool:   0.10,
  simmer: 0.30,
  hot:    0.55,
  cookin: 0.80,
};

/** Blended studio day-rate (AUD). 1 capacity block = 0.5 day. */
const BLENDED_DAY_RATE = 1400;
const BLOCKS_PER_DAY = 2;
const BLOCK_RATE = BLENDED_DAY_RATE / BLOCKS_PER_DAY; // $700 / half-day

/** People & Load: full week = 10 half-day blocks. */
const BLOCKS_PER_WEEK = 10;

/** Utilisation colour bands. */
const UTIL_BANDS = {
  underused: { max: 0.60, label: "Underused", cls: "util-under" },
  healthy:   { max: 0.90, label: "Healthy",   cls: "util-healthy" },
  atrisk:    { max: Infinity, label: "At risk", cls: "util-risk" },
};

/**
 * Margin health from fee burn vs total fee.
 * remainingRatio = 1 - (burn / totalValue); green ≥40%, amber 15–40%, red <15%.
 */
const MARGIN_BANDS = {
  green: { min: 0.40, label: "Healthy", cls: "margin-green" },
  amber: { min: 0.15, label: "Watch",   cls: "margin-amber" },
  red:   { min: -Infinity, label: "Thin", cls: "margin-red" },
};

/** Days in master stage before amber / red aging flags. */
const STAGE_AGING = {
  opportunity:   { amberDays: null, redDays: null }, // uses stageClose instead
  frontend:      { amberDays: 28, redDays: 42 },
  documentation: { amberDays: 42, redDays: 60 },
  support:       { amberDays: null, redDays: null }, // uses PC date
};

/** Opp past stageClose: amber immediately, red after this many days. */
const OPP_OVERDUE_RED_DAYS = 7;

/** Demo actor after login (mitchj → MJ). Backend later: real session user. */
const DEMO_WHO = "MJ";

const STORAGE_KEYS = {
  eventLog: "bb_event_log",
  invoiceQueue: "bb_invoice_queue",
  onboarded: "bb_onboarded",
  mutations: "bb_mutations",
};
