<template>
  <div class="form-grid-2">
    <div class="form-group">
      <label>OVERALL CONDITION</label>
      <select id="v-cond" v-model="cond">
        <option>Excellent — like new</option>
        <option>Good — minor wear</option>
        <option>Fair — visible wear</option>
        <option>Poor — needs work</option>
      </select>
    </div>
    <div class="form-group">
      <label>PAINT &amp; INTERIOR</label>
      <select id="v-cosm" v-model="cosm">
        <option>Fresh paint &amp; new interior</option>
        <option>Good condition</option>
        <option>Fair / dated</option>
        <option>Needs refurbishment</option>
      </select>
    </div>
  </div>

  <div class="form-grid-2">
    <div class="form-group">
      <label for="v-logbooks">LOGBOOKS</label>
      <select id="v-logbooks" v-model="logbooks">
        <option value="">Unknown</option>
        <option value="Complete since new">Complete since new (+value)</option>
        <option value="Complete, no gaps">Complete, no unexplained gaps</option>
        <option value="Minor gaps">Minor gaps</option>
        <option value="Missing / incomplete">Missing / incomplete (−value)</option>
      </select>
    </div>
    <div class="form-group">
      <label for="v-damage">DAMAGE HISTORY</label>
      <select id="v-damage" v-model="damage">
        <option value="">Unknown</option>
        <option value="None (clean, verified)">None — clean, verified</option>
        <option value="Repaired, minor (documented)">Repaired — minor, documented</option>
        <option value="Repaired, major (documented)">Repaired — major (spar/firewall/prop strike)</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
const val = useValuationForm()
const cond = val.cond
const cosm = val.cosm
const logbooks = val.logbooks
const damage = val.damage
</script>
