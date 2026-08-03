// =======================================================================
// THE BIG BOARD — SAMPLE DATA
// 30 projects spread across stages, plus people and week metadata.
// Dates in this preview are anchored to the week of Mon 25 May 2026.
// =======================================================================

const WEEK_OF = "2026-05-25"; // Monday of CURRENT week (used by both views)

const LEADS = {
  KP: { name: "Kaitlyn Poole",       state: "MEL", role: "Director" },
  ZW: { name: "Zoe Wiley",           state: "MEL", role: "Associate" },
  MN: { name: "Matt Nightingale",    state: "MEL", role: "Associate Director" },
  KM: { name: "Kat McMahon",         state: "SYD", role: "Sydney Lead" },
  CF: { name: "Chris Free",          state: "SYD", role: "Sydney Director" },
  LP: { name: "Lara Pillot",         state: "MEL", role: "Associate" },
  GC: { name: "Gabrielle Charp",     state: "MEL", role: "Architectural Director" },
  MJ: { name: "Mitch (Founder)",     state: "MEL", role: "Creative Director" },
};

const TEAM = [
  "Isabella Alvarado","Shannon Craig","Belinda Taylor","Sophie Woods",
  "Pedrum Naz","Storm Bell","Emma Williamson",
];
// Initials for the team members (used on calendar chips)
const TEAM_INITIALS = {
  "Isabella Alvarado": "IA",
  "Shannon Craig":     "SC",
  "Belinda Taylor":    "BT",
  "Sophie Woods":      "SW",
  "Pedrum Naz":        "PN",
  "Storm Bell":        "SB",
  "Emma Williamson":   "EW",
};

// Stage definitions — keep colours in sync with CSS variables
const STAGES = {
  opportunity:   { label: "Opportunities & Feasibilities", short: "OPP", color: "green"  },
  frontend:      { label: "Front End Design",              short: "FED", color: "blue"   },
  documentation: { label: "Documentation",                 short: "DOC", color: "lilac"  },
  support:       { label: "Design Support",                short: "DS",  color: "sand"   },
};

// Helper to make dates relative to the current week Monday
function d(offsetDays) {
  const base = new Date(WEEK_OF + "T00:00:00");
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

// =======================================================================
// PROJECTS
// stage:          opportunity | frontend | documentation | support
// lead:           initials key from LEADS
// team:           array of full names (initials looked up in TEAM_INITIALS)
// blurb:          ≤ 20 words — shown on calendar chip hover
// hoverDetail:    ≤ 30 words — shown on hover/click in the deep views
// weekPriority:   the THIS-WEEK focus, or "NA"
// stageClose:     forecasted close date for current stage (YYYY-MM-DD)
// completion:     forecasted project completion date OR null
// hyper:          true = glowing-box hyper priority for the week
// dueDates:       additional milestone dates rendered on the calendar [{date, label}]
// pcDate:         only for stage 'support' — Practical Completion date
// =======================================================================
const PROJECTS = [
  // -------------------- OPPORTUNITIES & FEASIBILITIES (green) --------------------
  {
    id:"P01", code:"Project A", stage:"opportunity", lead:"MN",
    team:["Sophie Woods","Storm Bell"],
    blurb:"Boutique hotel feasibility, Fitzroy — concept narrative and ROM costing for client board pitch.",
    hoverDetail:"Boutique hotel feasibility for Fitzroy site. Concept narrative, ROM costing and three test-fit options for client board pitch on the 5th.",
    weekPriority:"Lock test-fit option C by Wednesday",
    stageClose:d(11), completion:null, hyper:true,
    dueDates:[{date:d(2),label:"Client workshop"},{date:d(11),label:"Pitch submission"}],
  },
  {
    id:"P02", code:"Project B", stage:"opportunity", lead:"CF",
    team:["Pedrum Naz"],
    blurb:"Sydney CBD office RFP — 1,800sqm speculative fit-out response.",
    hoverDetail:"Sydney CBD office RFP for 1,800sqm speculative fit-out. Concept boards and fee schedule. Competing against two larger studios.",
    weekPriority:"Fee schedule sign-off with MJ",
    stageClose:d(8), completion:null, hyper:false,
    dueDates:[{date:d(8),label:"RFP due"}],
  },
  {
    id:"P03", code:"Project C", stage:"opportunity", lead:"MJ",
    team:["Emma Williamson"],
    blurb:"Hospitality group multi-site feasibility — three venues across QLD.",
    hoverDetail:"Hospitality group multi-site feasibility covering three QLD venues. Strategic positioning piece for repeat client expanding portfolio in 2027.",
    weekPriority:"NA",
    stageClose:d(18), completion:null, hyper:false,
    dueDates:[{date:d(17),label:"Brisbane site visit"}],
  },
  {
    id:"P04", code:"Project D", stage:"opportunity", lead:"GC",
    team:["Belinda Taylor"],
    blurb:"Adaptive reuse — heritage warehouse, Collingwood — feasibility scoping.",
    hoverDetail:"Adaptive reuse feasibility for heritage warehouse in Collingwood. Existing conditions audit complete, awaiting heritage consultant input before sketch options.",
    weekPriority:"Heritage report follow-up",
    stageClose:d(15), completion:null, hyper:false,
    dueDates:[{date:d(4),label:"Heritage consultant call"}],
  },
  {
    id:"P05", code:"Project E", stage:"opportunity", lead:"ZW",
    team:["Isabella Alvarado"],
    blurb:"Wellness brand flagship — Chapel Street — pitch deck and mood direction.",
    hoverDetail:"Wellness brand flagship on Chapel Street. Pitch deck, mood direction and indicative spatial plan. Client decision expected late June.",
    weekPriority:"Final mood board pass",
    stageClose:d(10), completion:null, hyper:false,
    dueDates:[{date:d(10),label:"Pitch presentation"}],
  },
  {
    id:"P06", code:"Project F", stage:"opportunity", lead:"KM",
    team:["Shannon Craig"],
    blurb:"Childcare centre — Northern Beaches — design competition entry.",
    hoverDetail:"Childcare centre design competition entry, Northern Beaches site. Concept narrative and three indicative renders required for first stage submission.",
    weekPriority:"NA",
    stageClose:d(13), completion:null, hyper:false,
    dueDates:[{date:d(13),label:"Stage 1 submission"}],
  },
  {
    id:"P07", code:"Project G", stage:"opportunity", lead:"LP",
    team:["Storm Bell"],
    blurb:"Bath-house extension — Windsor — Project Mood follow-on stages.",
    hoverDetail:"Bath-house extension feasibility for Project Mood client. Scope expansion beyond original brief, exploring rooftop terrace and treatment rooms addition.",
    weekPriority:"Confirm scope with client",
    stageClose:d(9), completion:null, hyper:false,
    dueDates:[],
  },

  // -------------------- FRONT END DESIGN (blue) --------------------
  {
    id:"P08", code:"Project H", stage:"frontend", lead:"GC",
    team:["Belinda Taylor","Pedrum Naz"],
    blurb:"Cbus 435 Bourke — concept development, level 12 amenity floor.",
    hoverDetail:"Cbus 435 Bourke Street, concept development for level 12 shared amenity floor. Three scheme options progressing to client workshop next week.",
    weekPriority:"Scheme option boards complete by Thursday",
    stageClose:d(12), completion:"2027-03-15", hyper:true,
    dueDates:[{date:d(4),label:"Internal review"},{date:d(11),label:"Client workshop"}],
  },
  {
    id:"P09", code:"Project I", stage:"frontend", lead:"KP",
    team:["Sophie Woods","Emma Williamson"],
    blurb:"Private residence — Toorak — design development of ground floor.",
    hoverDetail:"Private residence in Toorak. Design development of ground floor with focus on kitchen, dining and feature stair. Joinery elevations underway.",
    weekPriority:"Joinery elevations issued for review",
    stageClose:d(19), completion:"2026-12-20", hyper:false,
    dueDates:[{date:d(5),label:"Stone selection"}],
  },
  {
    id:"P10", code:"Project J", stage:"frontend", lead:"ZW",
    team:["Isabella Alvarado","Storm Bell"],
    blurb:"Restaurant fit-out — South Yarra — concept design.",
    hoverDetail:"Restaurant fit-out in South Yarra, 220sqm tenancy. Concept design exploring two material directions: refined timber vs. raw plaster and steel.",
    weekPriority:"NA",
    stageClose:d(14), completion:"2026-11-30", hyper:false,
    dueDates:[{date:d(6),label:"Client workshop 02"}],
  },
  {
    id:"P11", code:"Project K", stage:"frontend", lead:"KM",
    team:["Shannon Craig"],
    blurb:"Co-working space — Surry Hills — DD of common areas.",
    hoverDetail:"Co-working space in Surry Hills. Design development of common areas including reception, café bar and breakout zones. Lighting concept pending.",
    weekPriority:"Lighting concept workshop",
    stageClose:d(20), completion:"2027-01-25", hyper:false,
    dueDates:[{date:d(3),label:"Lighting designer briefing"}],
  },
  {
    id:"P12", code:"Project L", stage:"frontend", lead:"CF",
    team:["Pedrum Naz"],
    blurb:"Health clinic — North Sydney — concept design for waiting and consult areas.",
    hoverDetail:"Health clinic in North Sydney. Concept design for waiting areas and consult rooms balancing clinical requirements with warm, residential feel.",
    weekPriority:"NA",
    stageClose:d(16), completion:"2027-02-10", hyper:false,
    dueDates:[],
  },
  {
    id:"P13", code:"Project M", stage:"frontend", lead:"LP",
    team:["Emma Williamson","Belinda Taylor"],
    blurb:"Bath-house — Windsor — DD of pool hall and treatment wing.",
    hoverDetail:"Bath-house DD of pool hall and treatment wing. Stone selection in progress, structural coordination ongoing for new roof opening.",
    weekPriority:"Structural coordination meeting Wednesday",
    stageClose:d(21), completion:"2027-04-30", hyper:false,
    dueDates:[{date:d(2),label:"Structural meeting"},{date:d(15),label:"DD package issue"}],
  },
  {
    id:"P14", code:"Project N", stage:"frontend", lead:"MN",
    team:["Sophie Woods"],
    blurb:"Office — Cremorne — concept for headquarters relocation.",
    hoverDetail:"Office concept for headquarters relocation, Cremorne. Brand-aligned scheme exploring activity-based working zones across two upper levels.",
    weekPriority:"Concept pack to client Friday",
    stageClose:d(4), completion:"2026-10-15", hyper:false,
    dueDates:[{date:d(4),label:"Concept pack issue"}],
  },
  {
    id:"P15", code:"Project O", stage:"frontend", lead:"GC",
    team:["Isabella Alvarado"],
    blurb:"Cafe — Carlton — small footprint DD.",
    hoverDetail:"Cafe DD in Carlton, 80sqm tenancy. Focus on bespoke joinery counter and rear courtyard treatment. Tight budget requiring careful spec choices.",
    weekPriority:"NA",
    stageClose:d(7), completion:"2026-09-15", hyper:false,
    dueDates:[{date:d(7),label:"Budget alignment review"}],
  },
  {
    id:"P16", code:"Project P", stage:"frontend", lead:"KP",
    team:["Storm Bell","Pedrum Naz"],
    blurb:"Luxury retail flagship — Melbourne CBD — concept design for two-level store.",
    hoverDetail:"Luxury retail flagship in Melbourne CBD. Concept design for two-level store including feature stair, VIP suite and rear styling salon.",
    weekPriority:"VIP suite material direction lock",
    stageClose:d(17), completion:"2027-03-30", hyper:false,
    dueDates:[{date:d(10),label:"International brand review call"}],
  },

  // -------------------- DOCUMENTATION (lilac) --------------------
  {
    id:"P17", code:"Project Q", stage:"documentation", lead:"GC",
    team:["Belinda Taylor","Sophie Woods"],
    blurb:"CITIC House 99 King Street — tender documentation issue.",
    hoverDetail:"CITIC House 99 King Street tender documentation. Final coordination with services consultants ahead of issue. Builder shortlist confirmed.",
    weekPriority:"Final services coordination",
    stageClose:d(6), completion:"2027-05-15", hyper:true,
    dueDates:[{date:d(6),label:"Tender issue"}],
  },
  {
    id:"P18", code:"Project R", stage:"documentation", lead:"ZW",
    team:["Emma Williamson"],
    blurb:"Apartment refurb — South Melbourne — technical drawings package.",
    hoverDetail:"Apartment refurbishment in South Melbourne. Technical drawings package for building permit submission. Awaiting engineer drawings to coordinate.",
    weekPriority:"NA",
    stageClose:d(9), completion:"2026-12-10", hyper:false,
    dueDates:[{date:d(9),label:"Permit submission"}],
  },
  {
    id:"P19", code:"Project S", stage:"documentation", lead:"KM",
    team:["Shannon Craig"],
    blurb:"Hotel guest room prototype — Sydney — full tender set.",
    hoverDetail:"Hotel guest room prototype in Sydney. Full tender set for two room types and corridor. Loose furniture schedule and finishes board in parallel.",
    weekPriority:"FF&E schedule complete",
    stageClose:d(14), completion:"2027-02-28", hyper:false,
    dueDates:[{date:d(14),label:"Tender issue"}],
  },
  {
    id:"P20", code:"Project T", stage:"documentation", lead:"CF",
    team:["Pedrum Naz","Storm Bell"],
    blurb:"Corporate HQ — Sydney CBD — Stage 5 tender documentation.",
    hoverDetail:"Corporate HQ in Sydney CBD, Stage 5 tender documentation. Large floor plate across three levels. Joinery and ceiling details in final coordination.",
    weekPriority:"Joinery details internal review Tuesday",
    stageClose:d(22), completion:"2027-06-15", hyper:false,
    dueDates:[{date:d(2),label:"Internal joinery review"}],
  },
  {
    id:"P21", code:"Project U", stage:"documentation", lead:"LP",
    team:["Isabella Alvarado"],
    blurb:"Wine bar — Fitzroy — technical drawings for permit.",
    hoverDetail:"Wine bar technical drawings in Fitzroy. Permit submission package including liquor licensing layout. Compact tenancy requires careful services planning.",
    weekPriority:"NA",
    stageClose:d(11), completion:"2026-10-20", hyper:false,
    dueDates:[{date:d(11),label:"Permit lodgement"}],
  },
  {
    id:"P22", code:"Project V", stage:"documentation", lead:"KP",
    team:["Sophie Woods"],
    blurb:"Beauty salon chain — fit-out documentation for two new sites.",
    hoverDetail:"Beauty salon chain, fit-out documentation for two new sites. Standardised template applied with site-specific variations for landlord requirements.",
    weekPriority:"Site B variation drawings",
    stageClose:d(8), completion:"2026-11-15", hyper:false,
    dueDates:[],
  },
  {
    id:"P23", code:"Project W", stage:"documentation", lead:"MN",
    team:["Emma Williamson","Belinda Taylor"],
    blurb:"Family home — Brighton — tender documentation.",
    hoverDetail:"Family home tender documentation in Brighton. Full house renovation and rear extension. Joinery package extensive across kitchen, butler and laundry.",
    weekPriority:"Coordination meeting with builder",
    stageClose:d(20), completion:"2027-04-10", hyper:false,
    dueDates:[{date:d(5),label:"Builder coordination"}],
  },

  // -------------------- DESIGN SUPPORT (sand) -- on site with PC dates --------------------
  {
    id:"P24", code:"Project X", stage:"support", lead:"GC",
    team:["Sophie Woods"],
    blurb:"Office fit-out — Richmond — on site, joinery installation.",
    hoverDetail:"Office fit-out in Richmond. On site, joinery installation underway. Weekly site walks Wednesdays. Minor variations being tracked carefully.",
    weekPriority:"Site walk Wednesday",
    stageClose:null, completion:"2026-07-10", hyper:false, pcDate:"2026-07-10",
  },
  {
    id:"P25", code:"Project Y", stage:"support", lead:"ZW",
    team:["Isabella Alvarado"],
    blurb:"Restaurant — Prahran — on site, finishes phase.",
    hoverDetail:"Restaurant in Prahran. On site, finishes phase. Stone benches arriving from Italy week of 8 June. Lighting commissioning in final two weeks.",
    weekPriority:"NA",
    stageClose:null, completion:"2026-07-24", hyper:false, pcDate:"2026-07-24",
  },
  {
    id:"P26", code:"Project Z", stage:"support", lead:"KM",
    team:["Shannon Craig"],
    blurb:"Co-working space — Surry Hills Stage 1 — on site.",
    hoverDetail:"Co-working space Stage 1 in Surry Hills. On site, partition walls complete, services rough-in finishing. PC mid August.",
    weekPriority:"Variation request review",
    stageClose:null, completion:"2026-08-14", hyper:false, pcDate:"2026-08-14",
  },
  {
    id:"P27", code:"Project AA", stage:"support", lead:"CF",
    team:["Pedrum Naz"],
    blurb:"Corporate suite refurb — North Sydney — on site, FF&E delivery.",
    hoverDetail:"Corporate suite refurbishment in North Sydney. On site, FF&E delivery and installation phase. Defects walkthrough scheduled late August.",
    weekPriority:"NA",
    stageClose:null, completion:"2026-08-28", hyper:false, pcDate:"2026-08-28",
  },
  {
    id:"P28", code:"Project AB", stage:"support", lead:"LP",
    team:["Storm Bell"],
    blurb:"Day spa — Hawthorn — on site, finishes and joinery.",
    hoverDetail:"Day spa in Hawthorn. On site, finishes and joinery installation. Custom tile pattern requiring close supervision. PC mid June.",
    weekPriority:"Tile setting-out site review",
    stageClose:null, completion:"2026-06-18", hyper:false, pcDate:"2026-06-18",
  },
  {
    id:"P29", code:"Project AC", stage:"support", lead:"MN",
    team:["Emma Williamson"],
    blurb:"Office refurb — Docklands — defects period.",
    hoverDetail:"Office refurbishment in Docklands. Defects period. Final landlord handover scheduled for mid June. Photography brief in preparation.",
    weekPriority:"NA",
    stageClose:null, completion:"2026-06-12", hyper:false, pcDate:"2026-06-12",
  },
  {
    id:"P30", code:"Project AD", stage:"support", lead:"KP",
    team:["Belinda Taylor"],
    blurb:"Residential extension — Malvern — on site, brickwork phase.",
    hoverDetail:"Residential extension in Malvern. On site, brickwork phase. Pool excavation complete. Long PC date pushed by client travel — late October.",
    weekPriority:"Brick selection sign-off",
    stageClose:null, completion:"2026-10-23", hyper:false, pcDate:"2026-10-23",
  },
];
