/* =========================================================================
   Data: area-wise equipment lists and skid/package count
   Sources: SOW Rev.0 (Tables 4.1, 4.1.1, §3.3, §6, §7), Basis of Design
   18-08-2025, EPF Execution Strategy 18-08-2025, Concept Rev.K (Case 2).
   Counts marked "ind" are indicative bid-planning estimates.
   ========================================================================= */

const EQUIPMENT_AREAS = [
  {
    id: 'A',
    title: 'Wellhead & gathering interface',
    sub: 'Company scope · operated and maintained by the EPF Contractor',
    scope: 'company',
    intro:
      'The permanent wellhead facilities, wellsite manifolds and buried flowlines are supplied by the ' +
      'Company or its EPC contractor. The EPF Contractor supplies the package tie-ins and the operating ' +
      'and emergency-shutdown interfaces, and then operates and maintains this scope for the rental ' +
      'period. Well testing hardware at each wellhead is what makes reservoir-specific data possible.',
    items: [
      { tag: 'WHCP', name: 'Wellhead control panel', spec: '1 per well', note: 'Hydraulic/pneumatic panel with ESD, SDV and choke control; integrated with the EPF ICSS.' },
      { tag: 'MPFM', name: 'Multiphase flow meter', spec: '1 per wellhead', note: 'Continuous well testing at the wellsite — the basis of the EWT data set.' },
      { tag: 'ESDV', name: 'Wellsite emergency shutdown valve', spec: '1 per well', note: 'Fail-safe closure on EPF ESD or loss of signal.' },
      { tag: '—', name: 'Buried flowlines', spec: '8&Prime; NU / Yamama · 10&Prime; Mishrif–Khasib', note: 'Minimum 1 m cover, MAOP 50 barg, internally coated for sour service where required.' },
      { tag: '—', name: 'Wellsite manifold and pig launcher', spec: '1 per wellsite', note: 'Enables individual well isolation, testing and pigging of the flowline.' },
      { tag: '—', name: 'Sand traps at wellsite', spec: 'Option A — not in our base case', note: 'We take sand at the EPF inlet instead; this decision moves three packages.' }
    ]
  },

  {
    id: 'B',
    title: 'Inlet & reception',
    sub: 'Manifold, sand removal, inlet heating, battery-limit isolation',
    scope: 'epf',
    intro:
      'Everything that arrives from the wells is received, isolated, measured and conditioned here. The ' +
      'critical requirement is solids removal upstream of the heater-separator: sand from Nahr Umr is an ' +
      'explicit uncertainty, and abrasive solids will destroy heater tubes and separator internals.',
    items: [
      { tag: 'M/N-U/Y_Inlet_Manifold', name: 'Inlet manifold and pig receiver skid', spec: '1 per train', note: 'Motorised isolation, pressure indication, drain and vent; ties in the flowline to the train.' },
      { tag: '—', name: 'Sand removal package', spec: '1 per train', note: 'Desanding hydrocyclone with sand jetting and batch wash; sand routed to a lined skip for offsite disposal.' },
      { tag: 'M/N-U/Y_Inlet_Heater Q-1', name: 'Inlet heater', spec: '1 per train · 137–447 kW', note: 'Indirect water-bath heater, fuel-gas or diesel fired, with high-temperature and low-flow trips.' },
      { tag: 'SDV/ESDV', name: 'Battery-limit isolation valves', spec: '2 per train (inlet/outlet)', note: 'Fail-safe, fire-rated where required, with remote actuation from the ESD system.' },
      { tag: '—', name: 'Corrosion-inhibitor injection quill', spec: '1 per train', note: 'Continuous dosing upstream of the first vessel, flow-paced from the inlet meter.' },
      { tag: '—', name: 'Inlet sampling and analysis point', spec: '1 per train', note: 'Closed-loop sampling for BS&W, salinity and H&#8322;S — the evidence trail for the quality guarantee.' }
    ]
  },

  {
    id: 'C',
    title: 'Separation & stabilisation',
    sub: 'HP and LP three-phase separation, gas and water take-off, blowdown',
    scope: 'epf',
    intro:
      'Two stages of three-phase separation with interstage heating stabilise the crude and drop the gas ' +
      'and water fractions. Design rules applied to every vessel: minimum five minutes oil/water residence ' +
      '(ten preferred), gas K value 0.16 above HHLL and 0.10 above NLL, inlet ρv² below 10,000 kg/ms², ' +
      'gas outlet below 20 m/s and liquid outlets below 2 m/s.',
    items: [
      { tag: 'M_Sep-1 / N-U_Sep-1 / Y_Sep-1', name: 'HP three-phase separator', spec: '1 per train · ~2.6 m ID × 12 m T/T', note: 'Horizontal, 7–14 barg; gas to the closed header, water to produced-water treatment, oil to the dehydrator.' },
      { tag: 'M_Sep_2 / N-U_Sep-2 / Y_Sep-2', name: 'LP three-phase separator', spec: '1 per train · ~2.8 m ID × 12 m T/T', note: '5 barg; final flash of solution gas before stabilisation and storage.' },
      { tag: 'M/N-U/Y_Sep_Flare', name: 'Blowdown / knockout drum skid', spec: '1 per train', note: 'Liquid knockout upstream of the flare, with level control and recovery pump.' },
      { tag: 'M/N-U/Y_Sep_PCV', name: 'Pressure control valves', spec: '2 per train', note: 'Split-range control between the gas header and the flare, with fail-safe action.' },
      { tag: '—', name: 'Interface and level instrumentation', spec: 'Per vessel', note: 'Guided-wave radar with displacer backup, SIL-rated where the loop carries a safety function.' },
      { tag: '—', name: 'Sand jetting and drain connections', spec: 'Per vessel', note: 'Water jetting nozzles to the slops system; no manual entry for desanding.' },
      { tag: 'TEST-SEP', name: 'Mobile test separator', spec: '1 shared', note: 'Portable unit for individual well tests and for proving the MPFMs.' }
    ]
  },

  {
    id: 'D',
    title: 'Dehydration & desalting',
    sub: 'Electrostatic treating, two-stage desalting, wash water and chemicals',
    scope: 'epf',
    intro:
      'This is where the export specification is actually made: BS&amp;W 0.2 vol% and salt 30 ppmw. ' +
      'The crude is washed with salt-free water, heated to about 75 °C, mixed and then dehydrated and ' +
      'desalted electrostatically in two stages, with brine returned to produced-water treatment.',
    items: [
      { tag: 'M/N-U/Y_Dehyd_Heater', name: 'Interstage heater', spec: '1 per train · 0.668 MW', note: 'Raises the crude to the electrostatic treating temperature; duty set by the wash-water ratio.' },
      { tag: 'M/N-U/Y_Dehydrator', name: 'Electrostatic dehydrator', spec: '1 per train · 6–8 barg, ~75 °C', note: 'Removes the bulk remaining water down to the desalter inlet condition.' },
      { tag: 'M/N-U/Y_Desalter', name: 'Two-stage electrostatic desalter', spec: '2 vessels per train', note: 'Counter-current washing; outlet salt 30 ppmw (Mishrif/Nahr Umr) or 2.7 ppmw (Yamama).' },
      { tag: 'M/N-U/Y_Mix_Valve', name: 'Mixing valve', spec: '1 per train', note: 'Controllable differential pressure to form and then break the wash-water emulsion.' },
      { tag: 'M/N-U/Y_WW_Heater', name: 'Wash-water heater', spec: '1 per train · 73 kW', note: 'Wash water raised to about 60 °C before injection to avoid thermal shock in the desalter.' },
      { tag: 'M/N-U/Y_WW_Pump P-2', name: 'Wash-water pump', spec: '1 per train · ~0.5 kW, 9 bar', note: 'Duty/standby, flow-controlled to the water ratio; recycled water does not count as new demand.' },
      { tag: 'M/N-U/Y_Desalt_Pump P-1', name: 'Desalter charge / transfer pump', spec: '1 per train · ~17.5 kW', note: 'Moves treated crude from the desalter to the flow tanks via the cooler or direct.' },
      { tag: '—', name: 'Chemical injection — demulsifier', spec: '1 skid per train', note: 'Flow-paced dosing upstream of the dehydrator, with calibration pot and bunded storage.' },
      { tag: '—', name: 'Chemical injection — corrosion, scale, biocide, antifoam', spec: '1 skid per train', note: 'Multi-pump skid; dosing rates tied to production and water chemistry.' },
      { tag: 'M/N-U/Y_CO_Tanks', name: 'Chemical and slop tanks', spec: 'Per train', note: 'Bunded, vented to the closed system, with level and overfill protection.' }
    ]
  },

  {
    id: 'E',
    title: 'Sour crude treatment — Yamama',
    sub: 'H&#8322;S stripping, stripping gas, nitrogen inerting, sour off-gas',
    scope: 'epf',
    intro:
      'Yamama crude carries about 3.9% H&#8322;S in the associated gas and would fail the 20 ppmw export ' +
      'limit untreated. The Scope of Work mandates dedicated sour service — NACE/ISO 15156 materials and a ' +
      'SIL 2-capable safety instrumented system — and forbids routing raw Yamama gas into common fuel or ' +
      'compression unless the whole system is rated for it.',
    items: [
      { tag: 'Y_H2S_Col', name: 'H&#8322;S stripping column', spec: '1 · 500 mm dia, ~14 m, 2 m bed', note: 'Structured packing (Sulzer NeXRing #2), 5 barg, ~65 °C, 63% max flooding; outlet 10 ppmw H&#8322;S.' },
      { tag: 'Y_Col_FCV / LCV / PCV', name: 'Column control valves', spec: '3', note: 'Feed, oil level and overhead pressure control with fail-safe positions on loss of instrument air.' },
      { tag: 'Y_Col_Riser', name: 'Overhead riser to flare', spec: '1 · 6&Prime;', note: 'Short, self-draining run to the sour flare header; no pockets, sloped to the KO drum.' },
      { tag: 'Yam_Strip_Gas', name: 'Stripping gas supply', spec: '~0.66 MMSCFD at 5 barg, 59 °C', note: 'Preferred source is Nahr Umr HP separator off-gas; a local backup supply is required for start-up.' },
      { tag: '—', name: 'Stripping gas booster / conditioning skid', spec: '1', note: 'Pressure boosting, filtration and flow control — required because the source pressure varies.' },
      { tag: 'Y_N2_PCV', name: 'Nitrogen inerting package', spec: '1 skid', note: 'For commissioning, maintenance and tank blanketing only. Nitrogen is expressly not a stripping medium.' },
      { tag: '—', name: 'Sour off-gas knockout / scrubber', spec: '1 skid', note: 'Protects the flare header from liquid carryover; recovered condensate returns to reprocessing.' },
      { tag: '—', name: 'H&#8322;S detection and SIS interlock', spec: 'Per plot area', note: 'Open-path and point detectors with executive action on confirmed high-high; SIL 2 loops verified before start-up.' }
    ]
  },

  {
    id: 'F',
    title: 'Produced water treatment',
    sub: 'Degassing, oil removal, polishing, storage and disposal',
    scope: 'epf',
    intro:
      'Produced water from separators, treaters and sour service is degassed, cleaned and polished before ' +
      'disposal. Untreated sour water may never be sent to an open pond; if no compliant route is available, ' +
      'production is reduced. Recovered oil returns to reprocessing and released gas goes to the closed ' +
      'gas system.',
    items: [
      { tag: 'M/N-U/Y_PW_Header', name: 'Produced-water header', spec: '1 per train', note: 'Collects separator and desalter brine; segregated from clean stormwater and sewage.' },
      { tag: '—', name: 'Produced-water degassing vessel', spec: '1 per train', note: 'Flash gas to the gas header, with level control and a pressure-vacuum vent to flare.' },
      { tag: '—', name: 'Oil-removal unit (CPI / coalescer)', spec: '1 per train', note: 'Gravity separation of free oil; recovered oil pumped back to the crude train.' },
      { tag: '—', name: 'Polishing filter-coalescer', spec: '1 per train', note: 'Final stage: about 10 ppm oil in water, suitable for the approved receiving specification.' },
      { tag: 'M/N-U/Y_PW_Tanks', name: 'Produced-water buffer tank', spec: '1 per train', note: 'Field-erected, vented to the closed system, with level and overfill protection and a 50,000 bbl total buffer basis.' },
      { tag: 'M/N-U/Y_PW_Pump P-1', name: 'Produced-water transfer pump', spec: '1 per train · 8 bar', note: 'Duty/standby; feeds polishing or the buffer tank depending on the operating case.' },
      { tag: '—', name: 'Produced-water disposal pump', spec: '1 per train', note: 'Sized for the disposal well or pond route once the Company confirms destination and back-pressure.' },
      { tag: '—', name: 'Wash-water reverse osmosis unit', spec: '1 per train', note: 'Turns a slipstream of produced water into desalter wash water; rejects returned to disposal.' },
      { tag: '—', name: 'Oil-in-water analyser and flow meter', spec: '1 per train', note: 'Continuous compliance record for the disposal specification; alarm at the agreed limit.' },
      { tag: '—', name: 'Evaporation pond or disposal well', spec: 'Company scope', note: 'Location, capacity, permitted quality and readiness date must be confirmed before award.' }
    ]
  },

  {
    id: 'G',
    title: 'Gas handling, stripping gas & flare',
    sub: 'Closed vent systems, knockout, flare stack, optional gas monetisation',
    scope: 'epf',
    intro:
      'All associated gas streams — separator gas, stripper overhead, tank flash and produced-water ' +
      'degassing — are collected in closed systems at their own pressure and routed to flare or to the fuel ' +
      'system. Flaring is in the basis for maintenance, emergency and well testing, and the flare must be ' +
      'demonstrably within the permitted emission limits.',
    items: [
      { tag: '—', name: 'HP and LP closed gas headers', spec: '1 set per train', note: 'No open vents; each header rated for its own pressure and sour-service case.' },
      { tag: 'M/N-U/Y_Flare_KO_Drum', name: 'Flare knockout drum', spec: '1 per train', note: 'Liquid knockout with recovery pump; sloped, pocket-free inlet piping.' },
      { tag: 'M/N-U/Y_Flare_Stack', name: 'Flare stack package', spec: '1 per train · tip 250–380 mm', note: 'Pilots, ignition, flame monitoring, purge gas and molecular seal; design radiation 6.3 kW/m².' },
      { tag: '—', name: 'Burner mixer and combustion air', spec: 'Per flare', note: 'Smokeless, air-assisted operation across the turndown range.' },
      { tag: '—', name: 'Liquid seal / purge system', spec: 'Per flare', note: 'Prevents air ingress and burn-back; verified at commissioning and on every shutdown.' },
      { tag: 'OPT-GAS-1', name: 'Gas compression module (optional)', spec: '~1,957 kW · 9.5 ratio', note: 'Priced as an option; the base scope assumes local use or flaring per the Company arrangement.' },
      { tag: 'OPT-GAS-2', name: 'Fuel-gas conditioning skid', spec: '1 shared · ~1,386 kW', note: 'Heating value, dewpoint and filtration control for the generator sets.' },
      { tag: 'OPT-GAS-3', name: 'Acid gas removal, sulphur recovery and tail gas', spec: 'Optional scope', note: 'Complete acid-gas and sulphur-handling system if the Company elects sweetening rather than flaring.' }
    ]
  },

  {
    id: 'H',
    title: 'Crude storage, metering & export',
    sub: 'Flow tanks, off-spec reprocessing, allocation and custody transfer',
    scope: 'epf',
    intro:
      'Stabilised crude goes to flow tanks with off-spec storage and reprocessing, then through allocation ' +
      'metering to the common export system. Each reservoir keeps its own meter so the rental and the ' +
      'reservoir accounting stay honest; the custody-transfer interface is common.',
    items: [
      { tag: 'M/N-U/Y_Flow_Tanks', name: 'Flow tanks with off-spec storage', spec: '2 per train · 55 °C, 207–255 mbarg', note: 'Nitrogen-blanketed, with mixing, level and high-high protection; off-spec batches segregated for reprocessing.' },
      { tag: 'M_Transfer_Pump SPLT-100', name: 'Crude transfer pump', spec: '1 per train · 9–18 kW, ~65 m head', note: 'Duty/standby, VFD or control valve on the discharge; recycle line protects against dead-heading.' },
      { tag: '—', name: 'Off-spec reprocessing skid', spec: '1 per train', note: 'Returns out-of-specification crude to the separator inlet rather than blending it away.' },
      { tag: '—', name: 'Oil allocation metering skid', spec: '1 per train', note: 'Coriolis or ultrasonic meters with proving connections; per-reservoir volumes reported daily.' },
      { tag: 'E_Tanks_Manifold', name: 'Export flow tank manifold', spec: '1 shared · M_NU10', note: 'Continuously circulating blending tanks, nitrogen blanketed, with vent to the closed system.' },
      { tag: 'E_Export_Pump', name: 'Export pump', spec: '1 skid · 290 kW, 430 m head, 37.7 bar', note: 'Sized so the arrival pressure stays inside the Halfaya envelope; surge and shut-off head checked against the full 10&Prime;/16&Prime; route.' },
      { tag: '—', name: 'Custody-transfer metering interface', spec: '1 shared', note: 'Location and supply split agreed before award; fiscal metering may be MOC-owned at Halfaya.' },
      { tag: '—', name: 'Pig launcher and 10&Prime; trunkline', spec: '1 shared · 8.45 km', note: 'X65 line pipe, 50 barg MAOP, with leak detection supplemented by the metering data.' },
      { tag: '—', name: 'ESD valves and surge protection', spec: 'Along the route', note: 'Motorised ESDVs at each end; surge analysis governs valve closure times.' }
    ]
  },

  {
    id: 'I',
    title: 'Utilities',
    sub: 'Air, nitrogen, fuel, water, chemicals, drains and first-response firefighting',
    scope: 'epf',
    intro:
      'No utility is available from the unfinished CPF, so the EPF carries its own. Utilities may be shared ' +
      'between trains where capacity and reliability are demonstrated — the design must still survive the ' +
      'loss of any single package without endangering a train.',
    items: [
      { tag: '—', name: 'Instrument and plant air package', spec: '1 per train · duty + standby', note: 'Screw compressors, pre-filters, dryers, receivers; dewpoint monitored and alarmed.' },
      { tag: '—', name: 'Nitrogen package', spec: '1 per train', note: 'PSA or membrane with storage; inerting and blanketing only — never used as stripping gas.' },
      { tag: '—', name: 'Diesel storage and day tanks', spec: '1 skid per train', note: 'Bunded bulk storage, transfer pump, filtration and fuel polishing for the emergency genset.' },
      { tag: '—', name: 'Potable and service water package', spec: '1 shared', note: 'RO unit, chlorination and storage; potable, service, sewage and contaminated drainage stay segregated.' },
      { tag: '—', name: 'Chemical storage and dosing area', spec: '1 shared', note: 'Bunded, segregated by compatibility, with eyewash and spill kits.' },
      { tag: '—', name: 'Closed and open drains', spec: '1 package per train', note: 'Hydrocarbon and sour drains to slops; clean stormwater and sewage kept separate.' },
      { tag: '—', name: 'Slops tank and slop pump', spec: '1 shared', note: 'Receives drains, samples and off-spec liquids for controlled reprocessing.' },
      { tag: '—', name: 'Firewater and foam', spec: '1 shared + portable equipment', note: 'Pump set, monitors, hoses and extinguishers; mobile firewater/foam tender is acceptable for a temporary facility.' },
      { tag: '—', name: 'Laboratory container', spec: '1 shared', note: 'BS&amp;W, salt, RVP and H&#8322;S analysis to support the daily quality report.' }
    ]
  },

  {
    id: 'J',
    title: 'Electrical power & distribution',
    sub: 'Generation, switchgear, transformation, UPS and protection',
    scope: 'epf',
    intro:
      'Each location has full backup redundancy. Generators run synchronised, each at about 50% of rating, ' +
      'so the loss of one set does not interrupt production. Everything outdoors is IP65 with a sun canopy; ' +
      'everything indoors is IP42 and rated to keep running when the air conditioning fails.',
    items: [
      { tag: 'GEN', name: 'Generator packages', spec: '2 per train · each ~50% load', note: 'Diesel or treated Mishrif/Nahr Umr gas, synchronised with load sharing and reverse-power protection.' },
      { tag: 'EDG', name: 'Emergency diesel generator', spec: '1 per train · prime rated', note: 'Containerised with back-up fuel; independent engine and generator controllers, IEC 61850 and RS-485.' },
      { tag: 'MV SWBD', name: 'Medium-voltage switchboard', spec: '1 per train · 11 kV or 6.6 kV', note: 'Type-tested, air-insulated, withdrawable vacuum breakers, microprocessor protection relays and meters.' },
      { tag: 'LV SWBD / MCC', name: 'LV switchboard and motor control centre', spec: '1 per train · 400 V', note: 'Metal-clad, single-front, draw-out; every motor feeder with a motor manager and numerical relay.' },
      { tag: 'TR', name: 'Auxiliary transformers', spec: '2 × 100% per train · 11(33)/0.424 kV', note: 'Oil-immersed with conservator, off-circuit tap changer, temperature and Buchholz monitoring.' },
      { tag: 'VFD', name: 'Variable frequency drives', spec: 'As required', note: 'Inverter-duty motors where speed control is used; harmonics checked in the load-flow study.' },
      { tag: 'UPS', name: 'AC and DC UPS with batteries', spec: '2 × 50% each · ≥2 h', note: 'Parallel redundant, in a dedicated air-conditioned battery room with gas detection and eyewash.' },
      { tag: 'APFC', name: 'Automatic power factor correction', spec: 'Optional', note: 'Capacitor banks per MV/LV bus, voltage-overrated, to hold 0.98 lag where required.' },
      { tag: 'PMS', name: 'Power management system', spec: '1 per train', note: 'Load shedding, generator sequencing and synchronisation, integrated to the HMI and historian.' },
      { tag: '—', name: 'Earthing and lightning protection', spec: 'Per plot', note: 'Soil resistivity survey by Company; design submitted for approval before installation.' },
      { tag: '—', name: 'MV and LV cables', spec: 'Per routing study', note: 'Cu/XLPE/PVC/SWA-PVC, 0.6/1 kV for LV; single-core runs with aluminium wire armour.' },
      { tag: '—', name: 'Substation building and HVAC', spec: '1 per train', note: 'Air-conditioned E-house with calculated cooling duty and continuous-duty rating on HVAC failure.' }
    ]
  },

  {
    id: 'K',
    title: 'ICSS, telecommunications & safety systems',
    sub: 'Control, safety instrumented system, F&amp;G, SCADA and fibre',
    scope: 'epf',
    intro:
      'The package is pre-engineered and rented, so the Contractor brings proven architecture rather than a ' +
      'new design — but must prove it, document it and integrate it. Every control and safety function is ' +
      'tested before shipment and again on site, in front of Company or its witness.',
    items: [
      { tag: 'DCS/SCADA', name: 'Control system and operator stations', spec: '1 per train', note: 'PLC/RTU-based with operator and engineering workstations, alarms, events and historian at 30 s.' },
      { tag: 'SIS', name: 'Safety instrumented system', spec: '1 per train · SIL 2 capable', note: 'ESD logic, cause and effect, permissives and interlocks; SIL verification against the actual fluids.' },
      { tag: 'F&G', name: 'Fire and gas system', spec: '1 per train', note: 'H&#8322;S, LEL, flame and smoke detection with executive actions to ESD, deluge or alarm only.' },
      { tag: 'WHCP-I/F', name: 'Wellhead and RTU integration', spec: 'Per well pad', note: 'Wellhead control panel and RTU signals over Modbus/OPC/Ethernet-IP/Profibus into the EPF system.' },
      { tag: 'FO', name: 'Fibre-optic communication network', spec: 'Ring to each well pad', note: 'Redundant paths, monitored availability, cyber-security settings and end-to-end link testing.' },
      { tag: '—', name: 'Marshalling and field termination panels', spec: 'Per train', note: 'Surge protection, segregation of safety and control signals, labelled and tested at FAT.' },
      { tag: '—', name: 'Radio, PAGA and CCTV', spec: 'Per plot', note: 'Coverage between all locations, including well pads and the accommodation area.' },
      { tag: '—', name: 'Cyber-security boundary', spec: 'Per train', note: 'Hardened control-system firewall with one-way data flow to the business side.' },
      { tag: '—', name: 'CMMS and documentation archive', spec: '1 system', note: 'Maintenance and handover records kept in a CMMS such as EIDA Solutions, per the Scope of Work.' }
    ]
  },

  {
    id: 'L',
    title: 'Buildings, logistics & site services',
    sub: 'Control room, workshop, camp, transport, medical and waste',
    scope: 'epf',
    intro:
      'A rented facility still needs a place to work, eat, sleep and get medical help. These items are ' +
      'usually shared across the three trains because they serve people, not process.',
    items: [
      { tag: 'CR/LER', name: 'Central control room and local equipment room', spec: '1 shared', note: 'Sited per QRA and prevailing wind, with blast and fire resistance as the study requires.' },
      { tag: '—', name: 'Workshop and warehouse', spec: '1 shared', note: 'Covered maintenance bay, spare-parts store and laydown area with lifting equipment.' },
      { tag: '—', name: 'Portable accommodation and welfare', spec: '1 camp', note: 'Climate-controlled rooms, canteen, ablutions, drying room, smoking shelter and rest areas.' },
      { tag: '—', name: 'Muster and temporary refuge', spec: '1 shared', note: 'Assembly point with communications, PPE and headcount capability.' },
      { tag: '—', name: 'Ambulance and first aid', spec: '1 on standby, 24/7', note: 'Equipped and staffed with a trained medic; coordination with local hospitals documented.' },
      { tag: '—', name: 'Vehicles, cranes and forklifts', spec: 'Per mobilisation plan', note: 'Road-certified, with current third-party inspection for all lifting accessories.' },
      { tag: '—', name: 'Waste management area', spec: '1 shared', note: 'Segregated hazardous and non-hazardous waste, manifested and disposed of per regulation.' },
      { tag: '—', name: 'Security and site lighting', spec: 'Per plot', note: 'Fencing, gatehouse, lighting and access control for the rental period.' }
    ]
  },

  {
    id: 'M',
    title: 'Civil & site interface',
    sub: 'Company scope · EPF Contractor provides the design inputs',
    scope: 'company',
    intro:
      'All civil works — permanent and temporary — are executed by the Company or a third-party EPC. The ' +
      'EPF Contractor supplies the load data, civil layout and plot plan the civil designer needs, and adds ' +
      'dewatering wherever deep foundations are required.',
    items: [
      { tag: '—', name: 'Land preparation and levelling', spec: 'Company', note: 'Including demining, which Company completes and reports before mobilisation.' },
      { tag: '—', name: 'Foundation pads and bunds', spec: 'Company', note: 'Sized from the Contractor&rsquo;s skid load data and settlement limits.' },
      { tag: '—', name: 'Access roads and internal roads', spec: 'Company', note: 'Rehabilitation of approach roads follows the Contractor&rsquo;s heavy-haul route survey.' },
      { tag: '—', name: 'Import/export pipelines and flowlines', spec: 'Company', note: 'Permanent gathering and off-plot pipelines; EPF provides tie-in data only.' },
      { tag: '—', name: 'Produced-water evaporation pond', spec: 'Company', note: 'Permitted capacity and liner design; EPF confirms the water balance feeding it.' },
      { tag: '—', name: 'Dewatering for deep foundations', spec: 'EPF scope if required', note: 'Triggered by the civil design; priced as a conditional item.' }
    ]
  }
];

/* ------------------------------------------------------------------------
   Skid / package count
   m = Mishrif/Khasib train, n = Nahr Umr train, y = Yamama train,
   s = shared (counted once)
   ------------------------------------------------------------------------ */

const SKID_GROUPS = [
  {
    area: 'A', title: 'Inlet & reception', kind: 'process',
    rows: [
      { name: 'Inlet manifold and pig receiver skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Sand removal (desander) package', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Inlet heater package', m: 1, n: 1, y: 1, s: 0 }
    ]
  },
  {
    area: 'B', title: 'Separation & stabilisation', kind: 'process',
    rows: [
      { name: 'HP three-phase separator skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'LP three-phase separator skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Blowdown / flare knockout drum skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Mobile test separator (shared)', m: 0, n: 0, y: 0, s: 1 }
    ]
  },
  {
    area: 'C', title: 'Dehydration & desalting', kind: 'process',
    rows: [
      { name: 'Electrostatic dehydrator skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Desalter stage 1 skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Desalter stage 2 skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Interstage heater skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Wash-water heater skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Wash-water pump skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Chemical injection — demulsifier skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Chemical injection — corrosion / scale / biocide skid', m: 1, n: 1, y: 1, s: 0 }
    ]
  },
  {
    area: 'D', title: 'Sour crude treatment (Yamama)', kind: 'process',
    rows: [
      { name: 'H&#8322;S stripping column package', m: 0, n: 0, y: 1, s: 0 },
      { name: 'Stripping-gas booster / conditioning skid', m: 0, n: 0, y: 1, s: 0 },
      { name: 'Nitrogen inerting package', m: 0, n: 0, y: 1, s: 0 },
      { name: 'Sour off-gas knockout / scrubber skid', m: 0, n: 0, y: 1, s: 0 }
    ]
  },
  {
    area: 'E', title: 'Produced water treatment', kind: 'process',
    rows: [
      { name: 'Produced-water degassing skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Oil-removal (CPI) skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Polishing filter-coalescer skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Produced-water transfer pump skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Produced-water disposal pump skid', m: 1, n: 1, y: 1, s: 0 }
    ]
  },
  {
    area: 'F', title: 'Gas handling & flare', kind: 'process',
    rows: [
      { name: 'Flare stack, pilots, ignition and flame monitoring', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Fuel-gas conditioning skid (shared)', m: 0, n: 0, y: 0, s: 1 }
    ]
  },
  {
    area: 'G', title: 'Storage, metering & export', kind: 'process',
    rows: [
      { name: 'Flow-tank transfer pump skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Off-spec / slop reprocessing skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Oil allocation metering skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Blending booster pump skid (shared)', m: 0, n: 0, y: 0, s: 1 },
      { name: 'Export pump skid (shared)', m: 0, n: 0, y: 0, s: 1 },
      { name: 'Custody-transfer metering skid (shared)', m: 0, n: 0, y: 0, s: 1 },
      { name: 'Pig launcher skid (shared)', m: 0, n: 0, y: 0, s: 1 }
    ]
  },
  {
    area: 'H', title: 'Utilities', kind: 'process',
    rows: [
      { name: 'Instrument / plant air package', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Nitrogen package', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Diesel day-tank and fuel skid', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Wash-water reverse osmosis unit', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Closed / open drain package', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Potable and service water package (shared)', m: 0, n: 0, y: 0, s: 1 },
      { name: 'Chemical storage and bund (shared)', m: 0, n: 0, y: 0, s: 1 },
      { name: 'Firewater pump and foam package (shared)', m: 0, n: 0, y: 0, s: 1 }
    ]
  },
  {
    area: 'J', title: 'Electrical power & distribution', kind: 'electrical',
    rows: [
      { name: 'Generator package (each at ~50% load)', m: 2, n: 2, y: 2, s: 0 },
      { name: 'Emergency diesel generator container', m: 1, n: 1, y: 1, s: 0 },
      { name: 'MV switchgear / substation container', m: 1, n: 1, y: 1, s: 0 },
      { name: 'LV switchboard / MCC container', m: 1, n: 1, y: 1, s: 0 },
      { name: 'Transformer package (2 × 100%)', m: 2, n: 2, y: 2, s: 0 },
      { name: 'AC/DC UPS and battery container', m: 1, n: 1, y: 1, s: 0 },
      { name: 'ICSS container (DCS, SIS, F&amp;G)', m: 1, n: 1, y: 1, s: 0 }
    ]
  },
  {
    area: 'L', title: 'Buildings & site services', kind: 'site',
    rows: [
      { name: 'Central control room / LER (shared)', m: 0, n: 0, y: 0, s: 1 },
      { name: 'Workshop and warehouse container (shared)', m: 0, n: 0, y: 0, s: 1 },
      { name: 'Laboratory container (shared)', m: 0, n: 0, y: 0, s: 1 },
      { name: 'Accommodation / muster container (shared)', m: 0, n: 0, y: 0, s: 1 }
    ]
  }
];
