# Ad Daimah EPF — RFQ technical website

A single-page, offline-capable technical explainer for the **Rental Early Production Facilities (EPF) at Ad Daimah / M_NU10 hub** RFQ, built from the five documents issued with the tender. It explains the scope, the design basis, the process, the area-wise equipment lists, the skid/module count, and includes an interactive 3D massing model of the facility.

> **Every quantity in the equipment lists, the skid counts and the 3D model is an engineering estimate derived from the RFQ documents. Nothing here is a Company-approved design, a vendor quotation or a substitute for the Scope of Work.**

## Run it

**Option 1 — just open the file**

Double-click `index.html`. The page is fully static: no build step, no server, no network access. Three.js is vendored locally in `assets/vendor/`.

**Option 2 — local web server (recommended)**

Node, Python, Bun and Deno are not installed on this machine, so a small PowerShell static file server is included:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\serve.ps1
```

Then open <http://127.0.0.1:8123/>. The server binds to loopback only, writes its PID to `.serve.pid`, and logs requests to the console. Press `Ctrl+C` to stop it.

## What is on the page

| Section | Content |
| --- | --- |
| 01 Overview | Project frame: 3 reservoir-specific trains, 25,000 bopd, rental EPF model, contract structure |
| 02 Design basis | Capacity table (SOW Table 4.1), export crude specification (Table 4.1.1), reservoir fluids, key design decisions |
| 03 Process | Hand-drawn SVG flowsheet per train plus reservoir-specific notes (Mishrif/Khasib, Nahr Umr, Yamama) |
| 04 Equipment | 13 areas (A–M), 108 tagged items, filterable, each with size/duty and notes; Company-scope items flagged |
| 05 Skids | Skid and package count by area, KPI totals, and the road-module view |
| 06 3D model | Interactive massing model: 7 camera presets, isolation per area, labels, click-to-inspect |
| 07 Electrical & ICSS | Power island, MV/LV distribution, UPS, ICSS/telecom, hazardous area notes |
| 08 Execution | Schedule logic, heavy-haul limits, modularisation constraints, commissioning |
| 09 Commercial | Rental term, availability regime, price basis points, clarifications |
| 10 Sources | Document register, assumptions, and every deliberate estimate |

## Deployment

The site is a static site (no build step). It is published in two places:

* **Freebuff Sites (production):** https://site-1f9bf1eb698f4d668fb374c1f5d0fbc4.freebuff.page — deployed from the
  `public/` staging directory via `worker.js` + `manifest.json` (Worker serves `env.ASSETS`).
* **GitHub Pages:** https://kfa21.github.io/EPF/ — served from the repository root on `main`.
* **Repository:** https://github.com/kfa21/EPF

To redeploy to Freebuff Sites: refresh `public/` (`cp index.html cost-model.html public/ && cp -r assets public/`),
then `sites_deploy` with a new `requestId` and `sites_set_published` published=true. To update GitHub Pages:
`git add -A && git commit && git push` — Pages rebuilds automatically.

## Cost model and rental pricing

`cost-model.html` is a second page that prices the scope: 40 bottom-up capital lines, 13 operating
lines, and a monthly operating rate built from capital recovery (annuity over the firm term at WACC),
operating cost, a risk allowance and target margin. Every input is adjustable and the whole model —
CAPEX, OPEX, price build-up, module rate card, cash-flow chart, NPV/IRR/payback and a ten-scenario
sensitivity table — recalculates in the browser. `Download CSV` exports the complete model
(CAPEX, OPEX, price build-up, rate card, sensitivity, assumptions) for a bid workbook.

Default outputs at the base case (36-month term, 25,000 bopd, 95% availability):

* Total installed cost **$131.4 M** — capital bucket $105.3 M, mobilisation $26.1 M, $5,256 per daily barrel
* Operating cost **$2.0 M/month**, $2.78/bbl
* Required monthly rate **$6.5 M** = $9.01/bbl; recommended bid $6.51 M = $9.02/bbl
* Contract value **$263.6 M** over 36 months, project IRR 23.8%, payback 32 months

The model is a Class 4 estimate (±25%) in 2026 real USD, built from the RFQ documents and the
Contractor's own Gulf rental-market unit rates. It excludes Company scope (wells, flowlines, civil
works, trunkline, CPF tie-in, permanent power). It is a pricing tool, not a quotation.

## The skid answer

The RFQ asks how many skids are required. The site answers it in three layers, because "skid" means three different things in this project:

* **97 process skids** — the mechanical packages that do the work (separation, desalting, heating, metering, chemical injection, utilities…).
* **27 electrical & ICSS packages** — switchgear, MCCs, UPS, ICSS/ESD/F&G, telecoms, generally as containers or E-houses.
* **4 site containers** — control room, workshop/store, laboratory/office, camp module.
* **= 128 packaged units**, which consolidate into roughly **38–46 road-transportable modules** after the heavy-haul limits (60 t / 5.0 m wide / 4.2 m high / 13.7 m long) are applied.

All of these are labelled indicative (±10%) in the page itself.

## Files

```
index.html              all page content and the inline SVG flowsheet
cost-model.html         cost model and rental pricing page
assets/css/styles.css   design system, responsive layout, print styles
assets/css/cost.css     styles for the cost model page
assets/js/data.js       EQUIPMENT_AREAS (A–M) and SKID_GROUPS source data
assets/js/site.js       rendering, equipment search, skid table maths, scrollspy
assets/js/scene.js      procedural three.js model of the facility
assets/js/cost.js       CAPEX/OPEX model, price build-up, cash flow, CSV export
assets/vendor/three.min.js   three.js r149 (MIT), vendored for offline use
tools/serve.ps1         loopback static file server for local preview
```

Editing the equipment or skid numbers only requires changing `assets/js/data.js`; the tables, KPIs, bar charts and hero counts are all derived from it. The 3D model is code-generated in `assets/js/scene.js` — no model files to swap.

## Source documents

1. `Scope of Work for Rental Early Production Facilities – Ad Daimah.pdf` — ADA-2604-ENG-SOS-EPFA-GEN-001 Rev.0, 25-Oct-2026
2. `13_Surface_Facilities_Basis of Design.pdf` — 18-08-2025
3. `14_Surface_Facilities _EPF Execution Strategy.pdf` — 18-08-2025
4. `ADA-2501-PRO-RE-0000-PCN-003 Rev.K — EPF Concept, Phase 1a, Case 2, 25 kbopd, M_NU10`
5. `ANNEXURE 2 PRE-FEED AND FEED DELIVERABLE LIST Rev.C`

Two genuine discrepancies between the documents are highlighted in the page rather than silently resolved:

* **Yamama desalting** — SOW §3.3.2 requires two-stage electrostatic desalting; the 2025 Execution Strategy describes a filter-coalescer.
* **Stripping gas** — the Yamama H₂S stripper depends on Nahr Umr separator off-gas, an inter-train dependency that has to be able to fail safely.

## Printing

`Print / PDF` in the header (or `Ctrl+P`) switches to a print stylesheet: dark sections become white on black text, the navigation and 3D controls are hidden (the model panel keeps whatever frame is on screen), a page break is forced before the 3D section, and tables and cards avoid splitting across pages.

## Status

Built and tested locally only — not deployed. Send the folder as-is, or ask for it to be published to a hosted preview.
