<template>
  <div class="engine-section" id="eng-times-section">
    <div class="engine-section-hdr">
      <i class="ti ti-engine" style="font-size:16px"></i>
      ENGINE TIMES
      <span class="engine-hint">SMOH &amp; TBO drive value as much as avionics — enter times from the logs</span>
    </div>
    <div class="engine-section-body">
      <div class="form-grid-2" style="margin-bottom:10px">
        <div class="form-group">
          <label style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <span>RECOMMENDED TBO (HRS)</span>
            <button type="button" id="v-tbo-reset" class="tbo-reset-btn" :style="{ display: tboUserOverride ? '' : 'none' }" @click="val.resetTboAuto()">Use auto</button>
          </label>
          <select id="v-tbo" v-model="tbo" @change="val.onTboOverride()">
            <option v-for="opt in val.tboOptions.value" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="form-group"><label for="v-eng-conv">ENGINE CONVERSION / STC</label><input type="text" id="v-eng-conv" placeholder="e.g. IO-550 conversion, RAM, tip tanks..." v-model="engConv" @input="val.refreshEngineLife()" /></div>
      </div>

      <div id="single-eng-fields" :style="{ display: isTwin ? 'none' : '' }">
        <div class="form-grid-2">
          <div class="form-group"><label for="v-smoh">ENGINE SMOH (HRS)</label><input type="number" id="v-smoh" placeholder="e.g. 800" :value="smoh" @input="onSmoh" /></div>
          <div class="form-group"><label>PROP TSOH (HRS)</label><input type="number" id="v-prop1" placeholder="e.g. 400" :value="prop1" @input="prop1 = strInput($event)" /></div>
        </div>
        <div id="engine-life-single" class="engine-life-wrap" data-testid="engine-life">
          <template v-if="!isTwin">
            <EngineLifeBar
              v-for="(e, i) in lifeBlocks"
              :key="i"
              :label="e.label"
              :smoh="e.smoh"
              :tbo="e.tbo"
              :life="e.life"
            />
          </template>
        </div>
      </div>

      <div id="twin-eng-fields" :style="{ display: isTwin ? 'block' : 'none' }">
        <div class="form-grid-2" style="margin-bottom:10px">
          <div class="form-group"><label for="v-smoh-l">LEFT ENGINE SMOH (HRS)</label><input type="number" id="v-smoh-l" placeholder="e.g. 800" :value="smohL" @input="onSmohL" /></div>
          <div class="form-group"><label for="v-smoh-r">RIGHT ENGINE SMOH (HRS)</label><input type="number" id="v-smoh-r" placeholder="e.g. 900" :value="smohR" @input="onSmohR" /></div>
        </div>
        <div class="form-grid-2">
          <div class="form-group"><label>LEFT PROP TSOH (HRS)</label><input type="number" id="v-prop-l" placeholder="e.g. 400" :value="propL" @input="propL = strInput($event)" /></div>
          <div class="form-group"><label>RIGHT PROP TSOH (HRS)</label><input type="number" id="v-prop-r" placeholder="e.g. 450" :value="propR" @input="propR = strInput($event)" /></div>
        </div>
        <div id="engine-life-twin" class="engine-life-wrap">
          <template v-if="isTwin">
            <template v-for="(e, i) in lifeBlocks" :key="i">
              <div v-if="i > 0" style="height:10px"></div>
              <EngineLifeBar :label="e.label === 'Left' ? 'Left engine' : e.label === 'Right' ? 'Right engine' : e.label" :smoh="e.smoh" :tbo="e.tbo" :life="e.life" />
            </template>
          </template>
        </div>
      </div>
      <div class="engine-tbo-note" id="engine-tbo-note" data-testid="engine-tbo-note">{{ tboNote }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const val = useValuationForm()
const tbo = val.tbo
const engConv = val.engConv
const smoh = val.smoh
const prop1 = val.prop1
const smohL = val.smohL
const smohR = val.smohR
const propL = val.propL
const propR = val.propR
const tboNote = val.tboNote
const tboUserOverride = val.tboUserOverride
const isTwin = val.isTwin
const lifeBlocks = computed(() => val.lastEngineLife.value?.engines || [])

function strInput(e: Event) {
  return (e.target as HTMLInputElement).value
}

function onSmoh(e: Event) {
  smoh.value = strInput(e)
  val.refreshEngineLife()
}

function onSmohL(e: Event) {
  smohL.value = strInput(e)
  val.refreshEngineLife()
}

function onSmohR(e: Event) {
  smohR.value = strInput(e)
  val.refreshEngineLife()
}
</script>
