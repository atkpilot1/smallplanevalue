import type { ChecklistSection } from '~/types/app'

export function buildChecklistBase(): ChecklistSection[] {
  return [
    {
      name: 'Documents and Records',
      items: [
        { name: 'Airworthiness certificate', note: 'Must be original, displayed in aircraft. Verify it matches registration and aircraft serial number.', critical: true },
        { name: 'Registration', note: 'Must be in aircraft, match N-number markings and serial number. Confirm name and current address of registered owner.', critical: true },
        { name: 'POH / Flight Manual', note: 'Must be appropriate to this specific aircraft model and serial number. Check for all supplements for installed equipment.', critical: true },
        { name: 'Weight and balance', note: 'Must be current with all modifications reflected. Calculate several typical loading scenarios to verify within limits.', critical: true },
        { name: 'Airframe logbooks since manufacture', note: 'Verify continuous entries with no unexplained gaps. Compare total airframe time to advertised and to tachometer/Hobbs meter.', critical: true },
        { name: 'Latest annual inspection', note: 'Confirm date and proper sign-off. Check who performed it and if any discrepancies were noted.', critical: true },
        { name: '24-month pitot-static and transponder checks', note: 'Confirm currency and expiration dates for both inspections. Required for IFR flight.', critical: true },
        { name: 'ELT battery', note: 'Check current ELT battery and confirm replacement date is within limits.', critical: false },
        { name: 'STCs, 337s, and yellow tags', note: 'Confirm all Forms 337, STCs, and yellow tags match logbook entries for all installed equipment and modifications.', critical: true },
        { name: 'Damage history', note: 'Verify any damage history with documentation of repair. Cross-check NTSB records for accident history.', critical: true },
        { name: 'Aircraft title search', note: 'Conduct title search to verify clear title, no liens, and ownership history matches logbooks.', critical: true },
      ],
    },
    {
      name: 'Engine Logbook and History',
      items: [
        { name: 'Engine time and calendar since overhaul', note: 'Compare total engine time, calendar years since overhaul, and time since top overhaul to advertised and to tach/Hobbs.', critical: true },
        { name: 'Compression test history', note: 'Review trends in cylinder differential compression checks over the last several annuals. Look for declining trends in any cylinder.', critical: true },
        { name: 'Oil analysis history', note: 'If oil analysis was performed, check frequency, results and trends. Look for elevated metals indicating wear: iron, copper, aluminum.', critical: true },
        { name: 'Engine STCs and 337s', note: 'Check all Forms 337, yellow tags and logbook entries for engine equipment and modifications.', critical: false },
        { name: 'Overhaul shop and specs', note: 'Verify who performed the overhaul, whether it was to new limits, and if a factory reman or field overhaul.', critical: true },
        { name: 'Alternator bearing age', note: 'For engines with gear-driven alternators, check whether alternator has been rebuilt with bearing change within last 500 operating hours.', critical: false },
        { name: 'Vacuum/pneumatic pump age', note: 'Check whether dry pneumatic pump has been overhauled or replaced within last 500 operating hours.', critical: false },
      ],
    },
    {
      name: 'Engine Compartment Inspection',
      items: [
        { name: 'Cylinder condition', note: 'Check cylinders for leaks or cracks, especially around injector nozzles (fuel injected) and spark plug holes. Look for evidence of overheating.', critical: true },
        { name: 'Crankcase inspection', note: 'Check for cracks on top of the crankcase and at cylinder base bolts. Check rear case for leaks that may indicate a crankcase crack.', critical: true },
        { name: 'Engine mounts', note: 'Check rubber engine mounts for sagging, cracking, or deterioration. Check heat deflectors for wear and cutting into mount legs.', critical: true },
        { name: 'Baffles', note: 'Check condition of all baffles, especially hard, cracked, or missing pieces. Proper baffling is critical for cooling.', critical: false },
        { name: 'Hoses, clamps and brackets', note: 'Check all hoses for cracks, kinks, age, or bulging. Check clamps and brackets for broken, loose or missing items. Check fuel injector line grommets.', critical: true },
        { name: 'Exhaust system', note: 'Check for cracks, leaks, or dents. Check for missing mounting nuts or studs. Look for loose, bent, or collapsed clamps. Check for corrosion throughout.', critical: true },
        { name: 'Muffler condition', note: 'Check exterior for dents, heat warp, holes or cracks. Check for missing or distorted flame cones. Inspect tailpipe hangers at firewall.', critical: true },
        { name: 'Oil leaks and stains', note: 'Check for any unexplained fuel or oil leaks or stains. Look for evidence of oil from alternator vent tube.', critical: false },
        { name: 'Magnetos and ignition', note: 'Visually inspect magnetos, ignition harness, and spark plug leads for condition and security.', critical: false },
      ],
    },
    {
      name: 'Propeller',
      items: [
        { name: 'Propeller time since overhaul', note: 'Compare propeller time and years since overhaul to advertised and tach/Hobbs. Check for overhaul or re-lube within last six years.', critical: true },
        { name: 'Blade condition', note: 'Check propeller blades for nicks, cracks, erosion, corrosion, or other damage. Check blade security.', critical: true },
        { name: 'Spinner and bulkhead', note: 'Check spinner for cracks, dents or damage. Check spinner bulkhead/backplate for cracks, dents or damage.', critical: false },
        { name: 'Governor', note: 'Verify governor operation and check for leaks. Confirm governor has been overhauled at or before propeller overhaul.', critical: false },
        { name: 'Prop strike cross-check', note: 'Cross-check any prop strike history against engine logs for teardown evidence, and airframe logs for gear collapse or gear-up landing.', critical: true },
      ],
    },
    {
      name: 'Landing Gear',
      items: [
        { name: 'Tires', note: 'Check for cupping, sidewall cracks, excessively worn tread, flat spots, or cord showing. Check tire pressures.', critical: true },
        { name: 'Brakes', note: 'Check for grooves in brake discs and condition of brake pads. Look for hard, stiff, kinked or leaking brake hoses.', critical: true },
        { name: 'Struts and hardware', note: 'Check for leaks, visible corrosion or rust on struts. Check for pitting or corrosion on chromed surfaces. Check for looseness in mountings.', critical: true },
        { name: 'Nose gear', note: 'Check shimmy damper for security, bends or leaks. Check tow pin area for damage. Check steering mechanism.', critical: false },
      ],
    },
    {
      name: 'Wings and Tail',
      items: [
        { name: 'Wing surface inspection', note: 'Sight across top and bottom of wing checking for dents, wrinkles, or paint blistering (may indicate corrosion of internal structure).', critical: true },
        { name: 'Wing attach fittings', note: 'Check wing attach bolt fittings for corrosion, standing water, or evidence of past water. Check bathtub fitting covers and drain holes.', critical: true },
        { name: 'Control surfaces', note: 'Inspect ailerons, elevator, and rudder for dents, wrinkles, corrosion. Check that control surfaces were properly balanced after any paint.', critical: true },
        { name: 'Fuel system', note: 'Check for evidence of fuel leaks on top and bottom of wing. Check fuel caps, vents, and fuel selector valve operation through all positions including off.', critical: true },
        { name: 'Tail surfaces', note: 'Check fuselage tail area for wrinkles, dents, loose rivets, corrosion. Check trim tabs flush with surfaces when indicators at neutral.', critical: false },
        { name: 'Rivet condition', note: 'Check for ground-down rivet heads which may indicate damage from sanding if airplane was not stripped before repainting.', critical: false },
      ],
    },
    {
      name: 'Cabin and Interior',
      items: [
        { name: 'Windows and doors', note: 'Check for crazed or cracked windows. Check forward door fit and hinge condition. Look for signs of interior leaks around door and window seals.', critical: false },
        { name: 'Corrosion check', note: 'Check cabin sidewalls for corrosion under windows, doors, and pilot storm window. This is a common hidden problem area.', critical: true },
        { name: 'Seats and restraints', note: 'Check proper installation and operation of seat belts, shoulder harnesses, seats and adjustment mechanisms.', critical: true },
        { name: 'Emergency exits', note: 'Check proper operation of all emergency exits.', critical: true },
        { name: 'Fuel selector', note: 'Verify fuel selector valve moves easily between all positions. Check proper operation of off-position safety stops.', critical: true },
      ],
    },
    {
      name: 'Warm Engine Checks',
      items: [
        { name: 'Borescope all cylinders', note: 'Conduct borescope inspection of all cylinders. Look for scoring, corrosion, deposits, cracked valves, and cam lobe wear indicators.', critical: true },
        { name: 'Differential compression', note: 'Conduct differential compression check on all cylinders. Record specific numbers. Minimum 60/80 with no more than 5 PSI variance between cylinders.', critical: true },
        { name: 'Oil filter and screen', note: 'Cut open oil filter and inspect oil screen for metal contamination. Any metal requires further investigation.', critical: true },
      ],
    },
    {
      name: 'Flight Check',
      items: [
        { name: 'Manifold pressure before start', note: 'Check manifold pressure gauge reads ambient pressure before engine start.', critical: false },
        { name: 'Instrument check', note: 'Check all instruments against tolerance for IFR flight after start and during taxi.', critical: true },
        { name: 'Takeoff performance', note: 'Confirm expected manifold pressure and RPM at full throttle takeoff. Check fuel flow is at or above redline.', critical: true },
        { name: 'Cruise performance', note: 'Compute true airspeed at cruise and compare to POH expectations for altitude and power setting.', critical: true },
        { name: 'Avionics operational check', note: 'Systematically check all instruments, avionics and indicators. Check magnetic compass for proper fluid and operation.', critical: true },
        { name: 'Autopilot check', note: 'Functionally check the autopilot system and all methods of disconnect per POH supplement procedures.', critical: false },
        { name: 'VOR accuracy', note: 'Conduct VOR check and compare to 30-day VOR check log entry.', critical: false },
      ],
    },
  ]
}

export const RETRACT_ITEMS = [
  { name: 'Gear retraction test', note: 'Conduct full gear retraction test. Check transit speed (14V: 11-13 sec, 28V: 4-8 sec). Check all position indicators.', critical: true },
  { name: 'Gear rigging', note: 'Check rigging tolerances including down tensions, free play in gear box, uplock clearance. Check for bent extension arms.', critical: true },
  { name: 'Gear doors and uplocks', note: 'Check outer gear doors for security, cracks or loose rivets. Check uplock cable condition and roller freedom. Check inner doors retract fully.', critical: true },
  { name: 'Emergency gear extension', note: 'Verify manual gear extension crank is accessible, snaps into cranking position, and restows properly.', critical: true },
]

export const TWIN_ITEMS = [
  { name: 'Single engine performance', note: 'Verify Vmc and single-engine climb performance. Check feathering operation if applicable.', critical: true },
  { name: 'Engine synchronization', note: 'Check prop sync system operation. Verify both engines produce matching performance at same power settings.', critical: false },
]

export function isRetractAircraft(acType: string, model: string) {
  return /retract/i.test(acType || '') || /arrow|210|baron|bonanza|saratoga|seneca|310|340|414|421|mooney|lance|comanche|centurion|r182|182rg/i.test(model)
}

export function isMultiAircraft(numEng: string | number, acType: string, model: string) {
  return Number(numEng) > 1 || /multi/i.test(acType || '') || /baron|seneca|310|340|414|421|twin|duchess|seminole|apache|aztec|navajo|chieftain/i.test(model)
}

export const CL_ICONS: Record<string, string> = {
  Documents: 'ti-file-text',
  Airframe: 'ti-box',
  Engine: 'ti-engine',
  Prop: 'ti-propeller',
  Landing: 'ti-circle',
  Flight: 'ti-arrows-move',
  Avionics: 'ti-device-desktop-analytics',
  Electrical: 'ti-bolt',
  Fuel: 'ti-droplet',
  Interior: 'ti-armchair',
  Test: 'ti-plane-departure',
}

export function clIcon(name: string) {
  for (const [k, v] of Object.entries(CL_ICONS)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return v
  }
  return 'ti-checklist'
}
