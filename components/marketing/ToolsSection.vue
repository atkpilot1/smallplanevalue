<template>
  <section id="tools" class="tools-section">
    <div class="tools-inner">
      <div class="reveal">
        <div class="section-kicker section-kicker-dark">The toolkit</div>
        <h2 class="section-h2 section-h2-dark">Everything in one place.</h2>
        <p class="section-body section-body-dark">Five integrated tools that cover the entire aircraft buying and selling process.</p>
      </div>
      <div class="tools-grid reveal" style="transition-delay:.1s">
        <a href="#app" class="tool-card" @click="switchTab('val')">
          <div class="tool-card-header">
            <div class="tool-icon"><i class="ti ti-calculator"></i></div>
            <div>
              <div class="tool-tag">Step 2</div>
              <div class="tool-name">AI valuation</div>
            </div>
          </div>
          <div class="tool-desc">Enter make, model, year, time, condition, and avionics. Get asking price range, likely sale range, and factor-by-factor analysis.</div>
          <div class="tool-arrow"><i class="ti ti-arrow-right"></i></div>
        </a>
        <a href="#app" class="tool-card" @click="switchTab('lookup')">
          <div class="tool-card-header">
            <div class="tool-icon"><i class="ti ti-id"></i></div>
            <div>
              <div class="tool-tag">Step 1</div>
              <div class="tool-name">N-number lookup</div>
            </div>
          </div>
          <div class="tool-desc">One N-number pulls the full FAA record — make, model, ownership history, ADs, registration expiry, and buyer flags.</div>
          <div class="tool-arrow"><i class="ti ti-arrow-right"></i></div>
        </a>
        <a href="#app" class="tool-card" @click="switchTab('checklist')">
          <div class="tool-card-header">
            <div class="tool-icon"><i class="ti ti-clipboard-check"></i></div>
            <div>
              <div class="tool-tag">Step 3</div>
              <div class="tool-name">Pre-buy checklist</div>
            </div>
          </div>
          <div class="tool-desc">AI-generated inspection checklist specific to your aircraft type. Track pass, flag, and fail items. Get price adjustment guidance.</div>
          <div class="tool-arrow"><i class="ti ti-arrow-right"></i></div>
        </a>
        <a href="#app" class="tool-card" @click="switchTab('comps')">
          <div class="tool-card-header">
            <div class="tool-icon"><i class="ti ti-search"></i></div>
            <div>
              <div class="tool-tag">Reference</div>
              <div class="tool-name">Market listings</div>
            </div>
          </div>
          <div class="tool-desc">See current asking price ranges for any model — low, median, and high — plus days on market and negotiation context.</div>
          <div class="tool-arrow"><i class="ti ti-arrow-right"></i></div>
        </a>
        <a href="#app" class="tool-card" @click="switchTab('sold')">
          <div class="tool-card-header">
            <div class="tool-icon" style="background:rgba(232,160,32,0.12)"><i class="ti ti-currency-dollar" style="color:var(--accent)"></i></div>
            <div>
              <div class="tool-tag" style="color:var(--accent)">Community</div>
              <div class="tool-name">Report a sale</div>
            </div>
          </div>
          <div class="tool-desc">Submit what you actually paid (or sold for). Anonymous crowd-sourced data that builds the transaction database nobody else has.</div>
          <div class="tool-arrow"><i class="ti ti-arrow-right"></i></div>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { switchTab } = useToolsTab()
</script>
