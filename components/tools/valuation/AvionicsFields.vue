<template>
  <div class="form-group">
    <label for="v-avionics-package">AVIONICS PANEL</label>
    <select id="v-avionics-package" v-model="avionicsPackage">
      <option value="">Select a panel type…</option>
      <option value="Steam / round-gauge (basic)">Steam / round-gauge (basic)</option>
      <option value="Basic IFR (GPS + ADS-B)">Basic IFR — WAAS GPS + ADS-B</option>
      <option value="Single glass upgrade (Aspen / G5 / GI 275)">Single glass upgrade — Aspen / G5 / GI 275</option>
      <option value="Modern Garmin suite (GTN + glass + GFC autopilot)">Modern Garmin suite — GTN + glass + GFC autopilot</option>
      <option value="Full glass + autopilot (latest Garmin suite)">Full glass + autopilot — latest Garmin suite</option>
    </select>
  </div>

  <div class="equip-prominent">
    <p class="equip-prominent-note">Comfort and safety options — always counted in your valuation when checked.</p>
    <div class="equip-prominent-hdr">COMFORT &amp; ENVIRONMENT</div>
    <label class="chk-label"><input type="checkbox" id="av-ac" v-model="avChecked['av-ac']" /> Air conditioning (factory or STC)</label>
    <div class="equip-prominent-hdr">SAFETY &amp; AWARENESS</div>
    <label class="chk-label"><input type="checkbox" id="av-aoa" v-model="avChecked['av-aoa']" /> Angle of attack (AOA) indicator</label>
    <label class="chk-label"><input type="checkbox" id="av-fiki" v-model="avChecked['av-fiki']" /> FIKI certified (flight into known ice)</label>
    <label class="chk-label"><input type="checkbox" id="av-known-ice" v-model="avChecked['av-known-ice']" /> Known ice / inadvertent TKS (not FIKI — exit icing only)</label>
    <label class="chk-label"><input type="checkbox" id="av-taws" v-model="avChecked['av-taws']" /> TAWS (terrain awareness / avoidance)</label>
    <label class="chk-label"><input type="checkbox" id="av-svt" v-model="avChecked['av-svt']" /> Synthetic vision (add-on or retrofit — skip if G1000 NXi / Perspective+)</label>
    <div class="equip-prominent-hdr">PEDIGREE &amp; AWARDS</div>
    <label class="chk-label"><input type="checkbox" id="av-oshkosh" v-model="avChecked['av-oshkosh']" /> Oshkosh / EAA AirVenture award winner (strongest on experimental/homebuilt)</label>
  </div>
</template>

<script setup lang="ts">
const val = useValuationForm()
const avionicsPackage = val.avionicsPackage
const avChecked = val.avChecked
</script>
