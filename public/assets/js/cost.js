/* ==========================================================================
   Ad Daimah Rental EPF — cost model and rental pricing engine
   Bottom-up Class 4 estimate. All values USD, 2026 real terms.
   No framework, no build step. Recomputes on every input change.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- inputs */

  const INPUT_GROUPS = [
    {
      id: 'contract',
      title: 'Contract & production',
      note: 'What the Company buys and for how long.',
      items: [
        { k: 'term', label: 'Firm rental term', unit: 'months', min: 12, max: 84, step: 1, def: 36, help: 'SOW leaves the term to the proposal; CPF handover sets the natural end. Every month of term cuts the monthly capital charge.' },
        { k: 'optionTerm', label: 'Extension option', unit: 'months', min: 0, max: 24, step: 1, def: 12, help: 'Priced at the same rate; shown in the rate card as an option, not in the base contract value.' },
        { k: 'mobPeriod', label: 'Mobilisation period to first oil', unit: 'months', min: 4, max: 18, step: 1, def: 9, help: 'Award to first oil. CAPEX is spent across this window and no revenue is earned.' },
        { k: 'bopd', label: 'Nameplate capacity', unit: 'bopd', min: 5000, max: 40000, step: 1000, def: 25000, help: '10,000 + 10,000 + 5,000 bopd across the three reservoir-specific trains (SOW Table 4.1).' },
        { k: 'throughput', label: 'Assumed throughput', unit: '%', min: 40, max: 110, step: 5, def: 100, help: '25,000 bopd is nameplate. Rigs are paid monthly, so lower throughput raises the cost per barrel.' },
        { k: 'availability', label: 'Guaranteed availability', unit: '%', min: 85, max: 100, step: 1, def: 95, help: 'SOW §4.2: minimum 95% rolling average from first day of operation.' },
        { k: 'expectedAvail', label: 'Expected availability', unit: '%', min: 80, max: 100, step: 1, def: 95, help: 'Below the guarantee the operating rate is cut 3% for the previous month, per point. Model the downside here.' },
        { k: 'daysPerMonth', label: 'Billing days per month', unit: 'days', min: 28, max: 31, step: 0.1, def: 30.4, help: 'Used only to convert the monthly rate into a barrel tariff.' },
      ],
    },
    {
      id: 'capital',
      title: 'Capital',
      note: 'What the Contractor has to own to deliver the three modules.',
      items: [
        { k: 'fleetReuse', label: 'Redeployed owned fleet', unit: '%', min: 0, max: 60, step: 5, def: 0, help: 'Share of the process skids taken from existing rental stock at 45% of the refurbished cost. This is the single biggest lever on the tariff.' },
        { k: 'contingency', label: 'Estimate contingency', unit: '%', min: 0, max: 25, step: 1, def: 8, help: 'Applied to all CAPEX. A Class 4 estimate carries −15%/+25% accuracy on the total.' },
        { k: 'wacc', label: 'Weighted average cost of capital', unit: '%/yr', min: 6, max: 20, step: 0.5, def: 11, help: 'Discount rate for the capital charge, cash-flow NPV and the investor return test.' },
        { k: 'demob', label: 'Demobilisation & site restoration', unit: 'USD', min: 0, max: 12000000, step: 100000, def: 3800000, help: 'Reverse logistics, decommissioning, removal and site restoration, charged as a one-off.' },
      ],
    },
    {
      id: 'opex',
      title: 'Operating cost',
      note: 'Everything the Contractor pays to keep 95% availability, 24/7/365.',
      items: [
        { k: 'headcount', label: 'Site headcount', unit: 'positions', min: 30, max: 200, step: 1, def: 83, help: 'Rotational staffing, including back-to-back cover. Three trains with separate operators, labs and wellpad cover.' },
        { k: 'costPerPosition', label: 'Fully loaded cost per position', unit: 'USD/month', min: 3000, max: 15000, step: 250, def: 8500, help: 'Salary, rotation flights, accommodation, visas, payroll burden.' },
        { k: 'expatCount', label: 'Expat specialists', unit: 'positions', min: 0, max: 30, step: 1, def: 6, help: 'Process, rotating equipment, ICSS and commissioning support.' },
        { k: 'expatCost', label: 'Cost per expat', unit: 'USD/month', min: 8000, max: 30000, step: 500, def: 18000, help: 'Fully loaded, 6/2 rotation.' },
        { k: 'chemicalsPerBbl', label: 'Chemicals', unit: 'USD/bbl', min: 0, max: 0.6, step: 0.01, def: 0.16, help: 'Demulsifier, corrosion and scale inhibitor, biocide, oxygen scavenger, H₂S scavenger for Yamama.' },
        { k: 'maintenanceRate', label: 'Maintenance & repair', unit: '%/yr of plant', min: 0, max: 8, step: 0.1, def: 3.5, help: 'Static and rotating maintenance on the process, electrical and automation plant value.' },
        { k: 'oemSupport', label: 'OEM & specialist contracts', unit: 'USD/month', min: 0, max: 400000, step: 10000, def: 72000, help: 'Generator, compressor and ICSS vendor support, third-party certification upkeep.' },
        { k: 'sparesMonthly', label: 'Spares consumption', unit: 'USD/month', min: 0, max: 300000, step: 5000, def: 60000, help: 'Consumable spares beyond the capital spares held in stock.' },
        { k: 'dieselLitres', label: 'Diesel backup', unit: 'litres/month', min: 0, max: 400000, step: 5000, def: 60000, help: 'Produced gas fuels the generators free of charge (Basis of Design, Phase 1); diesel covers trips and outages.' },
        { k: 'dieselPrice', label: 'Diesel price', unit: 'USD/litre', min: 0.4, max: 1.8, step: 0.05, def: 0.9, help: 'Delivered to site in southern Iraq.' },
        { k: 'campPax', label: 'Camp population', unit: 'persons', min: 40, max: 250, step: 5, def: 90, help: 'Including ten Company personnel that the SOW requires the Contractor to cater for.' },
        { k: 'campRate', label: 'Camp & catering', unit: 'USD/person/day', min: 25, max: 120, step: 5, def: 55, help: 'Accommodation, catering, laundry, potable water, waste.' },
        { k: 'logistics', label: 'Logistics & transport', unit: 'USD/month', min: 0, max: 500000, step: 10000, def: 120000, help: 'Supply convoys Basra to M_NU10, vehicles, warehousing, customs.' },
        { k: 'hse', label: 'HSE, medical & training', unit: 'USD/month', min: 0, max: 200000, step: 5000, def: 45000, help: 'Clinic and medevac standby, PPE, inductions, competence assurance.' },
        { k: 'insuranceRate', label: 'Operating insurance', unit: '%/yr of TIC', min: 0, max: 3, step: 0.1, def: 0.9, help: 'Plant all-risks, third-party liability, employer’s liability, pollution.' },
        { k: 'ict', label: 'Telecoms, IT & cyber', unit: 'USD/month', min: 0, max: 120000, step: 5000, def: 25000, help: 'Satellite and radio links, cyber security services, software licences.' },
        { k: 'gna', label: 'Corporate overhead allocation', unit: 'USD/month', min: 0, max: 600000, step: 10000, def: 220000, help: 'Head office engineering authority, procurement, finance, QHSE and legal support.' },
        { k: 'localContent', label: 'Local content, permits & community', unit: 'USD/month', min: 0, max: 200000, step: 5000, def: 35000, help: 'Local employment and content obligations, permits, community programmes.' },
      ],
    },
    {
      id: 'commercial',
      title: 'Commercial return',
      note: 'What the Contractor needs on top of cost.',
      items: [
        { k: 'risk', label: 'Risk allowance', unit: '% of cost', min: 0, max: 15, step: 0.5, def: 5, help: 'Covers availability penalties, feed variability, currency and security exposure not in the contingency.' },
        { k: 'margin', label: 'Target margin', unit: '% of price', min: 0, max: 25, step: 0.5, def: 12, help: 'Gross margin on the monthly operating rate and on mobilisation.' },
        { k: 'tax', label: 'Profit tax', unit: '%', min: 0, max: 35, step: 1, def: 15, help: 'Applied to revenue less OPEX less straight-line depreciation of the capital bucket.' },
      ],
    },
  ];

  /* ------------------------------------------------------------------ capex */

  const CAPEX_LINES = [
    { id: 'A1', group: 'Process equipment', item: 'Mishrif / Khasib 10,000 bopd process skids', qty: 1, unit: 'train', rate: 12400000, bucket: 'capital', basis: 'Two-stage separation, electrostatic dehydrator, two-stage desalter, stabiliser, flow tanks, transfer and export pumps, flare KO and stack.' },
    { id: 'A2', group: 'Process equipment', item: 'Nahr Umr 10,000 bopd process skids', qty: 1, unit: 'train', rate: 11900000, bucket: 'capital', basis: 'Same flowsheet tuned for sand and asphaltene, upstream sand removal, HP off-gas available as stripping gas.' },
    { id: 'A3', group: 'Process equipment', item: 'Yamama 5,000 bopd process skids — sour', qty: 1, unit: 'train', rate: 10800000, bucket: 'capital', basis: 'Half the throughput but CRA metallurgy, H₂S stripper with 2 m of structured packing, N₂ inerting and sour water handling; cost per barrel is the highest of the three.' },

    { id: 'B1', group: 'Electrical & power', item: 'Gas generator sets + emergency diesel generator', qty: 16.5, unit: 'MW', rate: 580000, bucket: 'capital', basis: 'Six 2.75 MW units, N+1 per train group, synchronised with full backup redundancy (SOW §6.1).' },
    { id: 'B2', group: 'Electrical & power', item: 'MV / LV switchgear, MCC, VFD, APFC', qty: 1, unit: 'lot', rate: 4800000, bucket: 'capital', basis: '11 kV and 0.4 kV boards, motor control centres, variable frequency drives, power factor correction to 0.95 lagging.' },
    { id: 'B3', group: 'Electrical & power', item: 'Transformers 33/11/0.4 kV', qty: 2, unit: 'set', rate: 700000, bucket: 'capital', basis: 'Two 24 kV class step-down transformers, N+1.' },
    { id: 'B4', group: 'Electrical & power', item: 'UPS, batteries and DC distribution', qty: 4, unit: 'system', rate: 350000, bucket: 'capital', basis: 'Parallel redundant AC and DC UPS, 2 × 50% battery configuration, minimum 2 hours autonomy.' },
    { id: 'B5', group: 'Electrical & power', item: 'Cables, earthing, lighting, trace heating', qty: 1, unit: 'lot', rate: 3200000, bucket: 'capital', basis: 'CU/XLPE/SWA power and control cables, earthing grid, hazardous-area lighting.' },

    { id: 'C1', group: 'Automation & telecom', item: 'ICSS — DCS, ESD, F&G, SIL 3 SIS', qty: 1, unit: 'system', rate: 4200000, bucket: 'capital', basis: 'Integrated control and safety system, cause and effect, SIL 3 loops, operator training simulator.' },
    { id: 'C2', group: 'Automation & telecom', item: 'SCADA, RTU, wellpad integration, cyber', qty: 1, unit: 'lot', rate: 1600000, bucket: 'capital', basis: 'Remote monitoring of the wellpads, MPFM and WHCP integration, IEC 62443 hardening.' },
    { id: 'C3', group: 'Automation & telecom', item: 'Telecoms, PAGA, CCTV, radio', qty: 1, unit: 'lot', rate: 1200000, bucket: 'capital', basis: 'Site radio network, public address and general alarm, CCTV, satellite link to the Company network.' },

    { id: 'D1', group: 'Buildings & accommodation', item: 'Control room and local equipment room', qty: 1, unit: 'building', rate: 1600000, bucket: 'capital', basis: 'Blast-rated CCR container, HVAC, fire and gas protection, operator consoles.' },
    { id: 'D2', group: 'Buildings & accommodation', item: 'Workshop and store', qty: 1, unit: 'building', rate: 1100000, bucket: 'capital', basis: 'Maintenance workshop, laydown, covered store and spare parts racking.' },
    { id: 'D3', group: 'Buildings & accommodation', item: 'Laboratory and site offices', qty: 1, unit: 'building', rate: 800000, bucket: 'capital', basis: 'Crude assay and water analysis laboratory, site offices for Company and Contractor.' },
    { id: 'D4', group: 'Buildings & accommodation', item: 'Accommodation camp, 120 persons', qty: 1, unit: 'camp', rate: 3400000, bucket: 'capital', basis: 'Sleeping modules, mess, recreation, potable water, sewage treatment, power and cooling.' },
    { id: 'D5', group: 'Buildings & accommodation', item: 'Warehouse and laydown', qty: 1, unit: 'building', rate: 900000, bucket: 'capital', basis: 'Covered warehousing for spares and chemicals, bunded chemical store.' },

    { id: 'E1', group: 'Bulk materials', item: 'Piping, valves and fittings', qty: 1, unit: 'lot', rate: 4600000, bucket: 'capital', basis: 'Carbon steel and CRA pipework, isolation valves, PSVs, small-bore and utility distribution.' },
    { id: 'E2', group: 'Bulk materials', item: 'Structural steel and gratings', qty: 1, unit: 'lot', rate: 2200000, bucket: 'capital', basis: 'Pipe racks, skid support steel, access platforms and stairs.' },
    { id: 'E3', group: 'Bulk materials', item: 'Insulation, painting and fireproofing', qty: 1, unit: 'lot', rate: 1500000, bucket: 'capital', basis: 'Hot and cold insulation, protective coating system, passive fire protection.' },
    { id: 'E4', group: 'Bulk materials', item: 'Instrument and cable bulk', qty: 1, unit: 'lot', rate: 1400000, bucket: 'capital', basis: 'Field instruments, junction boxes, tubing, cable trays and glands.' },

    { id: 'F1', group: 'Engineering & management', item: 'Engineering — process, mechanical, electrical, instrument', qty: 1, unit: 'lot', rate: 4400000, bucket: 'capital', basis: 'Fitness-for-service, P&IDs, datasheets, cause and effect, load list, plot and civil interface inputs.' },
    { id: 'F2', group: 'Engineering & management', item: 'HAZID, HAZOP, LOPA, SIL, QRA', qty: 1, unit: 'lot', rate: 900000, bucket: 'capital', basis: 'Hazard studies, SIL verification, quantitative risk assessment, ALARP demonstration.' },
    { id: 'F3', group: 'Engineering & management', item: 'Third-party inspection and certification', qty: 1, unit: 'lot', rate: 800000, bucket: 'capital', basis: 'Lifting gear certification, pressure vessel and relief valve certification, NACE and welding inspection.' },
    { id: 'F4', group: 'Engineering & management', item: 'Project management and site supervision', qty: 1, unit: 'lot', rate: 2600000, bucket: 'capital', basis: 'Project team for the mobilisation period, planners, cost control, document control, construction supervision.' },

    { id: 'G1', group: 'Mobilisation', item: 'Heavy haul — 46 modules', qty: 46, unit: 'module', rate: 95000, bucket: 'mob', basis: 'Road convoy from port to M_NU10 within 60 t / 5.0 m / 4.2 m / 13.7 m, permits, escorts, route survey.' },
    { id: 'G2', group: 'Mobilisation', item: 'Packaging, sea freight and containers', qty: 1, unit: 'lot', rate: 600000, bucket: 'mob', basis: 'Sea freight of modules and containers, export packing, marine cargo insurance.' },
    { id: 'G3', group: 'Mobilisation', item: 'Port, customs, permits and escorts', qty: 1, unit: 'lot', rate: 1100000, bucket: 'mob', basis: 'Umm Qasr handling, customs clearance, security escorts, temporary import permits.' },

    { id: 'H1', group: 'Installation & hook-up', item: 'Foundation interface and grouting', qty: 1, unit: 'lot', rate: 1800000, bucket: 'mob', basis: 'Company provides the civil works and foundation pads; the Contractor sets, levels and grouts.' },
    { id: 'H2', group: 'Installation & hook-up', item: 'Mechanical and piping erection', qty: 1, unit: 'lot', rate: 4400000, bucket: 'mob', basis: 'Module setting, interconnecting pipework, hydrotest, flange management.' },
    { id: 'H3', group: 'Installation & hook-up', item: 'Electrical and instrument installation', qty: 1, unit: 'lot', rate: 2900000, bucket: 'mob', basis: 'Cable pulling and termination, loop checks, instrument installation, earthing.' },
    { id: 'H4', group: 'Installation & hook-up', item: 'Cranes and heavy lift', qty: 1, unit: 'lot', rate: 1900000, bucket: 'mob', basis: 'Crane spread, heavy lift supervision, lifting plans and permits.' },

    { id: 'J1', group: 'Commissioning', item: 'Pre-commissioning and commissioning', qty: 1, unit: 'lot', rate: 2400000, bucket: 'mob', basis: 'Flushing, drying, inerting, function testing, first oil, performance test.' },
    { id: 'J2', group: 'Commissioning', item: 'Vendor representatives and start-up support', qty: 1, unit: 'lot', rate: 800000, bucket: 'mob', basis: 'Generator, ICSS and rotating equipment specialists on site through start-up.' },
    { id: 'J3', group: 'Commissioning', item: 'Performance test and handover', qty: 1, unit: 'lot', rate: 400000, bucket: 'mob', basis: 'Capacity and product quality demonstration, availability baseline, handover documentation.' },

    { id: 'K1', group: 'Spares & owner’s costs', item: 'Capital spares', qty: 1, unit: 'lot', rate: 3200000, bucket: 'capital', basis: 'Critical rotating and static spares held on site to protect the 95% availability guarantee.' },
    { id: 'K2', group: 'Spares & owner’s costs', item: 'Two-year operating spares', qty: 1, unit: 'lot', rate: 1600000, bucket: 'capital', basis: 'Consumable spares, filters, gaskets, instrument spares.' },
    { id: 'L1', group: 'Spares & owner’s costs', item: 'Construction and transit insurance', qty: 1, unit: 'lot', rate: 900000, bucket: 'capital', basis: 'CAR/EAR, marine cargo, delay in start-up.' },
    { id: 'L2', group: 'Spares & owner’s costs', item: 'Bonds, guarantees and financing fees', qty: 1, unit: 'lot', rate: 1800000, bucket: 'capital', basis: 'Performance bond, advance payment guarantee, arrangement fees on the working capital facility.' },
    { id: 'L3', group: 'Spares & owner’s costs', item: 'Owner’s project team and mobilisation', qty: 1, unit: 'lot', rate: 1300000, bucket: 'capital', basis: 'Contractor head office effort, travel, visas, pre-award and mobilisation costs.' },
  ];

  /* ---------------------------------------------------------------- helpers */

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const usd2 = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const usdM = (n) => '$' + (n / 1e6).toFixed(1) + ' M';
  const pct1 = (n) => n.toFixed(1) + '%';
  const pct0 = (n) => Math.round(n) + '%';
  const num = (n) => Math.round(n).toLocaleString('en-US');

  function crf(annualRatePct, months) {
    const r = annualRatePct / 100 / 12;
    if (r === 0) return 1 / months;
    const f = Math.pow(1 + r, months);
    return (r * f) / (f - 1);
  }

  function defaults() {
    const v = {};
    INPUT_GROUPS.forEach((g) => g.items.forEach((it) => { v[it.k] = it.def; }));
    return v;
  }

  /* ----------------------------------------------------------------- model */

  function compute(v) {
    /* --- barrels ------------------------------------------------------- */
    const bblMonthNameplate = v.bopd * v.daysPerMonth;
    const bblMonth = bblMonthNameplate * (v.throughput / 100) * (v.expectedAvail / 100);

    /* --- capex --------------------------------------------------------- */
    const capexFactor = v.capexFactor || 1;
    const rows = CAPEX_LINES.map((l) => {
      let amount = l.qty * l.rate * capexFactor;
      let note = '';
      if (l.group === 'Process equipment' && v.fleetReuse > 0) {
        const saved = amount * (v.fleetReuse / 100) * 0.55;
        amount -= saved;
        note = 'Includes ' + pct0(v.fleetReuse) + ' fleet redeployment at 45% of refurbished cost';
      }
      return Object.assign({}, l, { amount: amount, note: note });
    });

    const capexSub = rows.filter((r) => r.bucket === 'capital').reduce((s, r) => s + r.amount, 0);
    const mobSub = rows.filter((r) => r.bucket === 'mob').reduce((s, r) => s + r.amount, 0);
    const contingencyCapital = capexSub * (v.contingency / 100);
    const contingencyMob = mobSub * (v.contingency / 100);

    const capexCapital = capexSub + contingencyCapital;
    const capexMob = mobSub + contingencyMob + v.demob * capexFactor;
    const tic = capexCapital + capexMob;

    /* --- opex ---------------------------------------------------------- */
    const personnel = v.headcount * v.costPerPosition + v.expatCount * v.expatCost;
    const chemicals = bblMonth * v.chemicalsPerBbl;
    const plantValue = rows
      .filter((r) => ['Process equipment', 'Electrical & power', 'Automation & telecom'].indexOf(r.group) >= 0)
      .reduce((s, r) => s + r.amount, 0);
    const maintenance = (plantValue * (v.maintenanceRate / 100)) / 12;
    const diesel = v.dieselLitres * v.dieselPrice;
    const camp = v.campPax * v.campRate * v.daysPerMonth;
    const insurance = (tic * (v.insuranceRate / 100)) / 12;

    const opexRows = [
      { id: 'O1', group: 'People', item: 'Site operations, maintenance and laboratory staff', amount: personnel, basis: num(v.headcount) + ' rotational positions at ' + usd(v.costPerPosition) + '/month plus ' + num(v.expatCount) + ' expat specialists' },
      { id: 'O2', group: 'Consumables', item: 'Production chemicals', amount: chemicals, basis: usd2(v.chemicalsPerBbl) + '/bbl on ' + num(bblMonth) + ' bbl/month' },
      { id: 'O3', group: 'Consumables', item: 'Diesel backup and lubricants', amount: diesel + 15000, basis: num(v.dieselLitres) + ' L/month at ' + usd2(v.dieselPrice) + '/L plus lubricants' },
      { id: 'O4', group: 'Maintenance', item: 'Maintenance and repair on plant', amount: maintenance, basis: pct1(v.maintenanceRate) + '/yr on ' + usdM(plantValue) + ' of process, electrical and automation plant' },
      { id: 'O5', group: 'Maintenance', item: 'OEM and specialist service contracts', amount: v.oemSupport, basis: 'Generator, ICSS and rotating equipment vendor support' },
      { id: 'O6', group: 'Maintenance', item: 'Spares consumption', amount: v.sparesMonthly, basis: 'Consumable spares drawn from site stock' },
      { id: 'O7', group: 'Logistics', item: 'Logistics and transport', amount: v.logistics, basis: 'Supply convoys, vehicles, warehousing, customs' },
      { id: 'O8', group: 'Logistics', item: 'Camp and catering', amount: camp, basis: num(v.campPax) + ' persons at ' + usd(v.campRate) + '/person/day' },
      { id: 'O9', group: 'Logistics', item: 'HSE, medical, training and PPE', amount: v.hse, basis: 'Clinic, medevac standby, inductions, competence assurance' },
      { id: 'O10', group: 'Corporate', item: 'Operating insurance', amount: insurance, basis: pct1(v.insuranceRate) + '/yr of TIC' },
      { id: 'O11', group: 'Corporate', item: 'Telecoms, IT and cyber security', amount: v.ict, basis: 'Satellite and radio links, cyber services, licences' },
      { id: 'O12', group: 'Corporate', item: 'Corporate overhead allocation', amount: v.gna, basis: 'Head office engineering authority, procurement, finance, QHSE' },
      { id: 'O13', group: 'Corporate', item: 'Local content, permits and community', amount: v.localContent, basis: 'Local employment and content obligations, permits, community programmes' },
    ];
    const opex = opexRows.reduce((s, r) => s + r.amount, 0);

    /* --- price build-up ------------------------------------------------ */
    const capitalCharge = capexCapital * crf(v.wacc, v.term);
    const risk = (capitalCharge + opex) * (v.risk / 100);
    const required = (capitalCharge + opex + risk) / (1 - v.margin / 100);

    const penaltyFactor = v.expectedAvail >= v.availability ? 1 : 1 - 0.03 * (v.availability - v.expectedAvail);
    const effectiveRevenue = required * penaltyFactor;

    /* Recommended bid: round the required rate up to the next $10k. */
    const bid = Math.ceil(required / 10000) * 10000;
    const bidPerBbl = (bid * penaltyFactor) / bblMonth;
    const requiredPerBbl = (required * penaltyFactor) / bblMonth;

    const mobPrice = capexMob * (1 + v.margin / 100);
    const contractBase = mobPrice + bid * v.term;
    const optionValue = bid * v.optionTerm;

    /* --- module allocation --------------------------------------------- */
    const trainRows = rows.filter((r) => r.group === 'Process equipment');
    const trainSum = trainRows.reduce((s, r) => s + r.amount, 0) || 1;
    const capWeights = [0.4, 0.4, 0.2];
    let weights = trainRows.map((r, i) => 0.5 * (r.amount / trainSum) + 0.5 * capWeights[i]);
    const wSum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map((w) => w / wSum);

    const modules = [
      { code: 'EPF-01', name: 'Mishrif / Khasib', cap: '10,000 bopd' },
      { code: 'EPF-02', name: 'Nahr Umr', cap: '10,000 bopd' },
      { code: 'EPF-03', name: 'Yamama (sour)', cap: '5,000 bopd' },
    ].map((m, i) => ({
      code: m.code,
      name: m.name,
      cap: m.cap,
      weight: weights[i],
      monthly: bid * weights[i],
      mob: mobPrice * weights[i],
      tarif: (bid * weights[i] * penaltyFactor) / (bblMonth * weights[i]),
    }));

    /* --- cash flow, NPV, IRR ------------------------------------------- */
    const depn = capexCapital / v.term;
    const flows = [];
    const spend = tic / v.mobPeriod;
    for (let m = 0; m < v.mobPeriod; m++) flows.push(-spend);
    const monthlyOpex = opex;
    for (let m = 0; m < v.term; m++) {
      const rev = bid * penaltyFactor;
      const taxable = Math.max(0, rev - monthlyOpex - depn);
      const taxAmt = taxable * (v.tax / 100);
      const f = rev - monthlyOpex - taxAmt;
      flows.push(m === 0 ? f + mobPrice : f);
    }

    const rm = Math.pow(1 + v.wacc / 100, 1 / 12) - 1;
    const npv = flows.reduce((s, f, i) => s + f / Math.pow(1 + rm, i), 0);

    const irrMonthly = (() => {
      const f = (r) => flows.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i), 0);
      let lo = -0.5, hi = 1.0;
      if (f(lo) * f(hi) > 0) return null;
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
      }
      return (lo + hi) / 2;
    })();
    const irrAnnual = irrMonthly === null ? null : Math.pow(1 + irrMonthly, 12) - 1;

    let cum = 0, payback = null;
    for (let i = 0; i < flows.length; i++) {
      cum += flows[i];
      if (cum >= 0 && payback === null) payback = i;
    }

    const breakEvenMonthly = capitalCharge + opex;
    const breakEvenPerBbl = (breakEvenMonthly * penaltyFactor) / bblMonth;

    /* --- annual cash for the chart ------------------------------------- */
    const years = [];
    for (let y = 0; y < flows.length; y += 12) {
      years.push({ label: y === 0 ? 'Award' : 'Year ' + (y / 12 + (v.mobPeriod > 0 ? 0 : 1)), value: flows.slice(y, y + 12).reduce((a, b) => a + b, 0) });
    }

    return {
      v: v,
      rows: rows,
      capexSub: capexSub,
      mobSub: mobSub,
      contingencyCapital: contingencyCapital,
      contingencyMob: contingencyMob,
      capexCapital: capexCapital,
      capexMob: capexMob,
      tic: tic,
      opexRows: opexRows,
      opex: opex,
      personnel: personnel,
      chemicals: chemicals,
      bblMonth: bblMonth,
      bblMonthNameplate: bblMonthNameplate,
      capitalCharge: capitalCharge,
      risk: risk,
      required: required,
      requiredPerBbl: requiredPerBbl,
      bid: bid,
      bidPerBbl: bidPerBbl,
      penaltyFactor: penaltyFactor,
      mobPrice: mobPrice,
      contractBase: contractBase,
      optionValue: optionValue,
      modules: modules,
      weights: weights,
      flows: flows,
      npv: npv,
      irr: irrAnnual,
      payback: payback,
      breakEvenMonthly: breakEvenMonthly,
      breakEvenPerBbl: breakEvenPerBbl,
      years: years,
      depn: depn,
      mobPricePerModule: mobPrice,
      opexPerBbl: opex / bblMonth,
      capexPerBopd: tic / v.bopd,
    };
  }

  /* -------------------------------------------------------------- rendering */

  let V = defaults();
  let R = compute(V);

  function inputMarkup() {
    return INPUT_GROUPS.map((g) => {
      const items = g.items.map((it) => {
        const width = 100 * ((V[it.k] - it.min) / (it.max - it.min));
        return '' +
          '<div class="cm-input" data-k="' + it.k + '">' +
            '<div class="cm-input-head">' +
              '<label for="in-' + it.k + '">' + it.label + '</label>' +
              '<span class="cm-unit">' + it.unit + '</span>' +
            '</div>' +
            '<div class="cm-input-row">' +
              '<input id="in-' + it.k + '" type="number" min="' + it.min + '" max="' + it.max + '" step="' + it.step + '" value="' + V[it.k] + '">' +
              '<input class="cm-range" type="range" min="' + it.min + '" max="' + it.max + '" step="' + it.step + '" value="' + V[it.k] + '" aria-label="' + it.label + '" style="--fill:' + width + '%">' +
            '</div>' +
            '<p class="cm-help">' + it.help + '</p>' +
          '</div>';
      }).join('');
      return '' +
        '<div class="cm-group">' +
          '<div class="cm-group-head"><h3>' + g.title + '</h3><p>' + g.note + '</p></div>' +
          '<div class="cm-inputs">' + items + '</div>' +
        '</div>';
    }).join('');
  }

  function bindInputs() {
    $$('.cm-input').forEach((el) => {
      const k = el.dataset.k;
      const numberEl = $('input[type=number]', el);
      const rangeEl = $('input[type=range]', el);
      const set = (val, from) => {
        const def = INPUT_GROUPS.flatMap((g) => g.items).find((i) => i.k === k);
        let n = parseFloat(val);
        if (isNaN(n)) return;
        n = Math.min(def.max, Math.max(def.min, n));
        V[k] = n;
        if (from !== 'number') numberEl.value = n;
        if (from !== 'range') rangeEl.value = n;
        rangeEl.style.setProperty('--fill', (100 * ((n - def.min) / (def.max - def.min))) + '%');
        recompute();
      };
      numberEl.addEventListener('input', () => set(numberEl.value, 'number'));
      rangeEl.addEventListener('input', () => set(rangeEl.value, 'range'));
    });
  }

  function recompute() {
    R = compute(V);
    renderAll();
  }

  function renderKpis() {
    const el = $('#cmKpis');
    el.innerHTML = [
      ['Installed capital', usdM(R.tic), 'Capital bucket ' + usdM(R.capexCapital) + ' · mobilisation ' + usdM(R.capexMob)],
      ['Capital per daily barrel', '$' + num(R.capexPerBopd), 'TIC divided by 25,000 bopd nameplate'],
      ['Required monthly rate', usdM(R.required), usd2(R.requiredPerBbl) + '/bbl at ' + pct0(R.v.expectedAvail) + ' availability'],
      ['Recommended bid', usdM(R.bid), usd2(R.bidPerBbl) + '/bbl · ' + usdM(R.contractBase) + ' over ' + R.v.term + ' months'],
    ].map((k) => '<div class="cm-kpi"><span class="cm-kpi-l">' + k[0] + '</span><strong>' + k[1] + '</strong><span class="cm-kpi-s">' + k[2] + '</span></div>').join('');
  }

  function renderCapex() {
    const body = $('#capexBody');
    let out = '';
    let lastGroup = null;
    R.rows.forEach((r) => {
      if (r.group !== lastGroup) {
        out += '<tr class="grp"><td colspan="5">' + r.group + '</td></tr>';
        lastGroup = r.group;
      }
      out += '<tr>' +
        '<td class="mono">' + r.id + '</td>' +
        '<td><strong>' + r.item + '</strong>' + (r.note ? '<span class="cm-note">' + r.note + '</span>' : '') + '<span class="cm-basis">' + r.basis + '</span></td>' +
        '<td class="num">' + (Number.isInteger(r.qty) ? r.qty : r.qty.toFixed(1)) + ' ' + r.unit + '</td>' +
        '<td class="num cm-hide-sm">' + usd(r.rate) + '</td>' +
        '<td class="num">' + usd(r.amount) + '</td>' +
        '</tr>';
    });

    body.innerHTML = out;
    $('#capexFoot').innerHTML = '' +
      '<tr><td colspan="4">Direct capital (permanent facilities)</td><td class="num">' + usd(R.capexSub) + '</td></tr>' +
      '<tr><td colspan="4">Contingency on capital at ' + pct0(R.v.contingency) + '</td><td class="num">' + usd(R.contingencyCapital) + '</td></tr>' +
      '<tr class="cm-row-strong"><td colspan="4">Capital bucket — recovered through the monthly rate</td><td class="num">' + usd(R.capexCapital) + '</td></tr>' +
      '<tr><td colspan="4">Mobilisation, installation and commissioning</td><td class="num">' + usd(R.mobSub) + '</td></tr>' +
      '<tr><td colspan="4">Contingency on mobilisation at ' + pct0(R.v.contingency) + '</td><td class="num">' + usd(R.contingencyMob) + '</td></tr>' +
      '<tr><td colspan="4">Demobilisation and site restoration</td><td class="num">' + usd(R.v.demob) + '</td></tr>' +
      '<tr class="cm-row-strong"><td colspan="4">Mobilisation bucket — charged as one-off lines</td><td class="num">' + usd(R.capexMob) + '</td></tr>' +
      '<tr class="cm-row-total"><td colspan="4">Total installed cost (TIC)</td><td class="num">' + usd(R.tic) + '</td></tr>';

    $('#capexNote').innerHTML = 'Class 4 estimate, accuracy −15% / +25%. Excludes Company scope: wellhead facilities, flowlines, inlet manifolds, civil works and foundations, export pipelines, CPF tie-in and permanent power.';
  }

  function renderOpex() {
    let out = '';
    let lastGroup = null;
    R.opexRows.forEach((r) => {
      if (r.group !== lastGroup) {
        out += '<tr class="grp"><td colspan="5">' + r.group + '</td></tr>';
        lastGroup = r.group;
      }
      out += '<tr>' +
        '<td class="mono">' + r.id + '</td>' +
        '<td><strong>' + r.item + '</strong><span class="cm-basis">' + r.basis + '</span></td>' +
        '<td class="num">' + usd(r.amount) + '</td>' +
        '<td class="num cm-hide-sm">' + usd(r.amount * 12) + '</td>' +
        '<td class="num">' + usd2(r.amount / R.bblMonth) + '</td>' +
      '</tr>';
    });
    $('#opexBody').innerHTML = out;

    $('#opexFoot').innerHTML = '' +
      '<tr class="cm-row-total"><td colspan="2">Total operating cost</td><td class="num">' + usd(R.opex) + '</td><td class="num cm-hide-sm">' + usd(R.opex * 12) + '</td><td class="num">' + usd2(R.opexPerBbl) + '</td></tr>';
  }

  function renderPrice() {
    const total = R.bid;
    const parts = [
      { label: 'Capital recovery', value: R.capitalCharge, cls: 'p1' },
      { label: 'Operating cost', value: R.opex, cls: 'p2' },
      { label: 'Risk allowance', value: R.risk, cls: 'p3' },
      { label: 'Margin', value: total - R.capitalCharge - R.opex - R.risk, cls: 'p4' },
    ];
    $('#priceBar').innerHTML = parts.map((p) =>
      '<div class="cm-seg ' + p.cls + '" style="width:' + (100 * p.value / total).toFixed(2) + '%" title="' + p.label + ' ' + usd(p.value) + '">' +
        '<span>' + pct0(100 * p.value / total) + '</span></div>').join('');

    $('#priceLegend').innerHTML = parts.map((p) =>
      '<div class="cm-leg"><span class="cm-dot ' + p.cls + '"></span><span class="cm-leg-l">' + p.label + '</span><span class="cm-leg-v">' + usdM(p.value) + '/mo</span><span class="cm-leg-b">' + usd2(p.value / R.bblMonth) + '/bbl</span></div>').join('');

    $('#priceNotes').innerHTML = '' +
      '<div class="cm-fact"><span>Capital charge</span><strong>' + usdM(R.capitalCharge) + '</strong><em>' + usdM(R.capexCapital) + ' recovered over ' + R.v.term + ' months at ' + pct1(R.v.wacc) + ' WACC</em></div>' +
      '<div class="cm-fact"><span>Break-even rate</span><strong>' + usdM(R.breakEvenMonthly) + '</strong><em>' + usd2(R.breakEvenPerBbl) + '/bbl — covers capital and OPEX, no margin</em></div>' +
      '<div class="cm-fact"><span>Availability adjustment</span><strong>' + (R.penaltyFactor === 1 ? 'none' : '−' + pct1((1 - R.penaltyFactor) * 100)) + '</strong><em>' + (R.v.expectedAvail >= R.v.availability ? 'Expected availability meets the guarantee' : 'SOW §4.2 rate cut at 3% per point below ' + pct0(R.v.availability) + ' (expected ' + pct0(R.v.expectedAvail) + ')') + '</em></div>' +
      '<div class="cm-fact"><span>Effective tariff</span><strong>' + usd2(R.bidPerBbl) + '/bbl</strong><em>' + num(R.bblMonth) + ' bbl/month net of availability and throughput</em></div>';
  }

  function renderRateCard() {
    $('#rateCardBody').innerHTML = R.modules.map((m) =>
      '<tr>' +
        '<td><strong>' + m.code + '</strong><span class="cm-basis">' + m.name + ' — ' + m.cap + ' stabilised</span></td>' +
        '<td class="num">' + usd(m.monthly) + '</td>' +
        '<td class="num">' + usd(m.mob) + '</td>' +
        '<td class="num">' + usd2(m.tarif) + '</td>' +
      '</tr>').join('');

    const totalMob = R.modules.reduce((s, m) => s + m.mob, 0);
    $('#rateCardFoot').innerHTML = '' +
      '<tr class="cm-row-total"><td>Three modules — total monthly rate</td><td class="num">' + usd(R.bid) + '</td><td class="num">' + usd(totalMob) + '</td><td class="num">' + usd2(R.bidPerBbl) + '</td></tr>' +
      '<tr class="cm-row-strong"><td colspan="3">Contract value — mobilisation + ' + R.v.term + ' months of operation</td><td class="num">' + usd(R.contractBase) + '</td></tr>' +
      '<tr><td colspan="3">Extension option — ' + R.v.optionTerm + ' months at the same monthly rate</td><td class="num">' + usd(R.optionValue) + '</td></tr>' +
      '<tr><td colspan="3">Optional cost #1 — oil export Option A or B</td><td class="num">on scope</td></tr>' +
      '<tr><td colspan="3">Optional cost #2 — gas processing, sweetening, sulphur handling</td><td class="num">on scope</td></tr>';
  }

  function renderCash() {
    const el = $('#cashChart');
    const w = 760, h = 320, padL = 78, padR = 18, padT = 30, padB = 56;
    const data = R.years;
    const maxV = Math.max.apply(null, data.map((d) => Math.abs(d.value)).concat([1]));
    const n = data.length;
    const bw = (w - padL - padR) / n * 0.56;
    const step = (w - padL - padR) / n;
    const zero = padT + (h - padT - padB) * (maxV / (maxV * 2));
    const scale = (h - padT - padB) / (maxV * 2);
    let bars = '';
    let labels = '';
    data.forEach((d, i) => {
      const x = padL + i * step + (step - bw) / 2;
      const y = d.value >= 0 ? zero - d.value * scale : zero;
      const bh = Math.abs(d.value) * scale;
      bars += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, bh).toFixed(1) + '" rx="3" class="' + (d.value >= 0 ? 'pos' : 'neg') + '"><title>' + d.label + ': ' + usd(d.value) + '</title></rect>';
      labels += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (h - padB + 20) + '" class="ax">' + d.label + '</text>';
      const inside = bh >= 26;
      const valveY = inside ? y + bh / 2 + 5 : (d.value >= 0 ? y - 7 : y + bh + 16);
      labels += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + valveY.toFixed(1) + '" class="val' + (inside ? ' val-in' : '') + '">' + (d.value / 1e6).toFixed(1) + 'M</text>';
    });
    el.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    el.innerHTML = '' +
      '<line x1="' + padL + '" y1="' + zero + '" x2="' + (w - padR) + '" y2="' + zero + '" class="axis"/>' +
      bars + labels +
      '<text x="' + padL + '" y="' + (padT - 6) + '" class="ax-l">USD millions, after tax</text>';

    $('#cashStats').innerHTML = '' +
      '<div class="cm-stat"><span>NPV at ' + pct1(R.v.wacc) + '</span><strong>' + usdM(R.npv) + '</strong></div>' +
      '<div class="cm-stat"><span>Project IRR</span><strong>' + (R.irr === null ? 'n/a' : pct1(R.irr * 100)) + '</strong></div>' +
      '<div class="cm-stat"><span>Payback</span><strong>' + (R.payback === null ? 'beyond term' : R.payback + ' months') + '</strong></div>' +
      '<div class="cm-stat"><span>Years of operation priced</span><strong>' + (R.v.term / 12).toFixed(1) + '</strong></div>';
  }

  function sensitivity() {
    const base = Object.assign({}, V);
    const scenarios = [
      { name: 'Base case', v: {} },
      { name: 'CAPEX +20% on all lines', v: { capexFactor: 1.2 } },
      { name: 'CAPEX −15% (good procurement)', v: { capexFactor: 0.85 } },
      { name: '24-month firm term', v: { term: 24 } },
      { name: '48-month firm term', v: { term: 48 } },
      { name: '60-month firm term', v: { term: 60 } },
      { name: 'Redeploy 40% of the fleet', v: { fleetReuse: 40 } },
      { name: 'Availability 90% (penalty applied)', v: { expectedAvail: 90 } },
      { name: 'Throughput 80% (turndown)', v: { throughput: 80 } },
      { name: 'Margin 10% instead of ' + pct0(base.margin), v: { margin: 10 } },
    ];

    return scenarios.map((s) => {
      const v = Object.assign({}, base, s.v);
      const r = compute(v);
      /* Nominal rate you must quote to net the cost-plus rate after the availability penalty. */
      return {
        name: s.name,
        required: r.required / r.penaltyFactor,
        perBbl: r.required / r.bblMonth,
        tic: r.tic,
        irr: r.irr,
      };
    });
  }

  function renderSensitivity() {
    const rows = sensitivity();
    const base = rows[0];
    $('#sensBody').innerHTML = rows.map((r) => {
      const delta = (r.perBbl / base.perBbl - 1) * 100;
      const cls = Math.abs(delta) < 0.4 ? 'flat' : delta > 0 ? 'up' : 'down';
      return '<tr>' +
        '<td>' + r.name + '</td>' +
        '<td class="num">' + usdM(r.tic) + '</td>' +
        '<td class="num">' + usdM(r.required) + '</td>' +
        '<td class="num">' + usd2(r.perBbl) + '</td>' +
        '<td class="num ' + cls + '">' + (delta > 0 ? '+' : '') + delta.toFixed(1) + '%</td>' +
      '</tr>';
    }).join('');
  }

  function renderAssumptions() {
    const flat = INPUT_GROUPS.flatMap((g) => g.items.map((i) => ({ group: g.title, label: i.label, value: V[i.k], unit: i.unit })));
    $('#assumpBody').innerHTML = flat.map((a) =>
      '<tr><td class="mono">' + a.group + '</td><td>' + a.label + '</td><td class="num">' + (Math.round(a.value * 100) / 100).toLocaleString('en-US') + ' ' + a.unit + '</td></tr>').join('');
  }

  function renderAll() {
    renderKpis();
    renderCapex();
    renderOpex();
    renderPrice();
    renderRateCard();
    renderCash();
    renderSensitivity();
    renderAssumptions();
  }

  /* -------------------------------------------------------------- csv export */

  function csvEscape(s) {
    const t = String(s);
    return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }

  function toCsv() {
    const lines = [];
    const push = function () { lines.push(Array.prototype.slice.call(arguments).map(csvEscape).join(',')); };
    const blank = function () { lines.push(''); };

    push('Ad Daimah Rental EPF — cost model and rental pricing');
    push('Class 4 estimate, USD, 2026 real terms. Generated ' + new Date().toISOString().slice(0, 10));
    blank();
    push('SECTION', 'ID', 'ITEM', 'QTY', 'UNIT', 'RATE USD', 'AMOUNT USD', 'BASIS');
    R.rows.forEach((r) => push('CAPEX ' + r.group, r.id, r.item, r.qty, r.unit, Math.round(r.rate), Math.round(r.amount), r.basis));
    push('CAPEX', '', 'Direct capital', '', '', '', Math.round(R.capexSub), '');
    push('CAPEX', '', 'Contingency on capital', '', '', '', Math.round(R.contingencyCapital), pct0(R.v.contingency));
    push('CAPEX', '', 'Capital bucket', '', '', '', Math.round(R.capexCapital), 'Recovered through monthly rate');
    push('CAPEX', '', 'Mobilisation / installation / commissioning', '', '', '', Math.round(R.mobSub), '');
    push('CAPEX', '', 'Contingency on mobilisation', '', '', '', Math.round(R.contingencyMob), pct0(R.v.contingency));
    push('CAPEX', '', 'Demobilisation and restoration', '', '', '', Math.round(R.v.demob), '');
    push('CAPEX', '', 'Mobilisation bucket', '', '', '', Math.round(R.capexMob), 'Charged as one-off lines');
    push('CAPEX', '', 'Total installed cost', '', '', '', Math.round(R.tic), '');
    blank();
    push('SECTION', 'ID', 'ITEM', 'MONTHLY USD', 'ANNUAL USD', 'USD/BBL', 'BASIS');
    R.opexRows.forEach((r) => push('OPEX ' + r.group, r.id, r.item, Math.round(r.amount), Math.round(r.amount * 12), (r.amount / R.bblMonth).toFixed(2), r.basis));
    push('OPEX', '', 'Total operating cost', Math.round(R.opex), Math.round(R.opex * 12), (R.opex / R.bblMonth).toFixed(2), '');
    blank();
    push('PRICE BUILD-UP', '', 'VALUE USD', 'USD/BBL', 'NOTE');
    push('Capital charge', '', Math.round(R.capitalCharge), (R.capitalCharge / R.bblMonth).toFixed(2), usdM(R.capexCapital) + ' over ' + R.v.term + ' months at ' + pct1(R.v.wacc));
    push('Operating cost', '', Math.round(R.opex), (R.opex / R.bblMonth).toFixed(2), '');
    push('Risk allowance', '', Math.round(R.risk), (R.risk / R.bblMonth).toFixed(2), pct0(R.v.risk) + ' of cost');
    push('Margin', '', Math.round(R.bid - R.capitalCharge - R.opex - R.risk), '', pct0(R.v.margin) + ' of price');
    push('Required monthly rate', '', Math.round(R.required), (R.requiredPerBbl).toFixed(2), '');
    push('Recommended bid', '', Math.round(R.bid), (R.bidPerBbl).toFixed(2), 'Rounded up to next 10k');
    push('Break-even rate', '', Math.round(R.breakEvenMonthly), (R.breakEvenPerBbl).toFixed(2), 'No margin');
    push('Contract value', '', Math.round(R.contractBase), '', 'Mobilisation + ' + R.v.term + ' months');
    push('NPV at ' + pct1(R.v.wacc), '', Math.round(R.npv), '', '');
    push('Project IRR', '', R.irr === null ? 'n/a' : (R.irr * 100).toFixed(2) + '%', '', '');
    push('Payback months', '', R.payback === null ? 'beyond term' : R.payback, '', '');
    blank();
    push('RATE CARD', 'CODE', 'MODULE', 'MONTHLY USD', 'MOB USD', 'USD/BBL');
    R.modules.forEach((m) => push('Module', m.code, m.name + ' ' + m.cap, Math.round(m.monthly), Math.round(m.mob), m.tarif.toFixed(2)));
    blank();
    push('SENSITIVITY', 'SCENARIO', 'TIC USD', 'REQUIRED MONTHLY USD', 'USD/BBL');
    sensitivity().forEach((s) => push('Scenario', s.name, Math.round(s.tic), Math.round(s.required), s.perBbl.toFixed(2)));
    blank();
    push('ASSUMPTIONS', 'GROUP', 'PARAMETER', 'VALUE');
    INPUT_GROUPS.forEach((g) => g.items.forEach((i) => push('Input', g.title, i.label, V[i.k] + ' ' + i.unit)));

    return lines.join('\n');
  }

  /* ------------------------------------------------------------------ boot */

  function init() {
    $('#cmInputs').innerHTML = inputMarkup();
    bindInputs();
    renderAll();

    const dl = $('#cmDownload');
    if (dl) {
      dl.addEventListener('click', () => {
        const blob = new Blob([toCsv()], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Ad-Daimah-EPF-cost-model-' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      });
    }

    const print = $('#cmPrint');
    if (print) print.addEventListener('click', () => window.print());

    const nav = $('#nav');
    const navToggle = $('#navToggle');
    if (nav && navToggle) {
      navToggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.addEventListener('click', (e) => {
        if (e.target.matches('a')) {
          nav.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    const reset = $('#cmReset');
    if (reset) reset.addEventListener('click', () => {
      V = defaults();
      $('#cmInputs').innerHTML = inputMarkup();
      bindInputs();
      recompute();
    });

    $$('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
