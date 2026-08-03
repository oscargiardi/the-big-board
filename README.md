# The Big Board

Internal weekly operating board for Made For Group.

## Run locally

```bash
cd ~/Projects/the-big-board
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/ — login `mitchj` / `123456`.

## Demo features (v1.1)

- **Weighted forecast** — Opportunities view (heat × value by close month)
- **Ready to invoice** — click a pipeline sub-stage to complete; queue on Projects
- **Fee burn** — margin chips from blocksBurned × blended day-rate
- **Utilisation** — 10 half-day blocks/week on People & Load
- **Scenario mode** — “If we win Hot + Cookin’” overlay
- **Aging** — stalled opp / stage / PC flags
- **Audit** — Overview “Moved this week” from event log
- **Print** — header “Print Monday issue”
- **Onboarding** — first login overlay

Reset demo mutations via footer “Reset demo data”.

## Backend later

Auth, multi-user writes, real timestamps, accounts sync (Xero/MYOB), server PDF/email, calibrated win rates, Streamtime allocation sync.
