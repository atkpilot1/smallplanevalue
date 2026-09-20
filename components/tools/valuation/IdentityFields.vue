<template>
  <div class="form-grid-2">
    <div class="form-group"><label for="v-make">MAKE</label><input type="text" id="v-make" placeholder="Cessna, Piper, Beech, Cirrus..." v-model="make" @input="val.toggleCirrusGen()" /></div>
    <div class="form-group"><label for="v-model">MODEL</label><input type="text" id="v-model" placeholder="172S, Baron D55, SR22, RV-10..." v-model="model" @input="val.toggleCirrusGen()" /></div>
  </div>
  <div class="form-grid-3">
    <div class="form-group"><label for="v-year">YEAR</label><input type="number" id="v-year" placeholder="e.g. 1969" min="1930" max="2026" :value="year" @input="onYear" /></div>
    <div class="form-group">
      <label>LAST ANNUAL</label>
      <div style="display:flex;gap:6px;width:100%">
        <select id="v-annual-month" style="flex:1" v-model="annualMonth">
          <option value="">Month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
        <select id="v-annual-year" style="flex:1" v-model="annualYear">
          <option value="">Year</option>
          <option v-for="y in val.annualYears" :key="y" :value="String(y)">{{ y }}</option>
        </select>
      </div>
      <label class="chk-label out-of-annual-label"><input type="checkbox" id="v-out-of-annual" v-model="outOfAnnual" /> <i class="ti ti-alert-triangle" style="font-size:15px"></i> Out of annual</label>
    </div>
    <div class="form-group"><label for="v-engine-display">ENGINE</label><input type="text" id="v-engine-display" placeholder="From N-number lookup" readonly style="background:var(--offwhite);color:var(--muted)" v-model="engineDisplay" /></div>
    <div class="form-group"><label for="v-asking">ASKING PRICE ($)</label><input type="number" id="v-asking" placeholder="e.g. 299000" :value="asking" @input="asking = strInput($event)" /></div>
    <div class="form-group"><label for="v-ttaf">TOTAL TIME (TTAF HRS)</label><input type="number" id="v-ttaf" placeholder="e.g. 3200" :value="ttaf" @input="ttaf = strInput($event)" /></div>
    <div class="form-group">
      <label for="v-engines">ENGINES</label>
      <select id="v-engines" v-model="engines" @change="val.refreshEngineLife()">
        <option value="1">Single engine</option>
        <option value="2">Twin engine</option>
      </select>
    </div>
    <div class="form-group" id="v-cirrusgen-group" :style="{ display: val.isCirrus.value ? '' : 'none' }">
      <label for="v-cirrusgen">CIRRUS GENERATION</label>
      <select id="v-cirrusgen" v-model="cirrusGen" @change="cirrusTouched = true">
        <option value="">Auto-detect from year</option>
        <option value="G1">G1 (2001–2003)</option>
        <option value="G2">G2 (2004–2006)</option>
        <option value="G3">G3 (2007–2012)</option>
        <option value="G5">G5 (2013–2016)</option>
        <option value="G6">G6 (2017–2023)</option>
        <option value="G7">G7 (2024+)</option>
        <option value="SF50 G1">SF50 Vision Jet — G1 (2016–2018)</option>
        <option value="SF50 G2">SF50 Vision Jet — G2 (2019–2022)</option>
        <option value="SF50 G2+">SF50 Vision Jet — G2+ (2023+)</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
const val = useValuationForm()
const make = val.make
const model = val.model
const year = val.year
const annualMonth = val.annualMonth
const annualYear = val.annualYear
const outOfAnnual = val.outOfAnnual
const engineDisplay = val.engineDisplay
const asking = val.asking
const ttaf = val.ttaf
const engines = val.engines
const cirrusGen = val.cirrusGen
const cirrusTouched = val.cirrusTouched

function strInput(e: Event) {
  return (e.target as HTMLInputElement).value
}

function onYear(e: Event) {
  year.value = strInput(e)
  val.toggleCirrusGen()
}
</script>
