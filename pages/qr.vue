<template>
  <main class="qr-page">
    <a class="qr-back" href="/">
      <i class="ti ti-arrow-left" aria-hidden="true"></i>
      SmallPlane<span>Value</span>.com
    </a>

    <article class="qr-card">
      <div class="qr-kicker">
        <i class="ti ti-sparkles" aria-hidden="true"></i>
        The Honest GA Valuation Tool
      </div>
      <div class="qr-brand">
        <div class="qr-mark" aria-hidden="true"><i class="ti ti-plane"></i></div>
        <h1>SmallPlane<span>Value</span></h1>
      </div>
      <div class="qr-frame">
        <img
          src="/qr.svg"
          width="280"
          height="280"
          alt="QR code linking to https://smallplanevalue.com"
        >
      </div>
      <p class="qr-url">smallplanevalue.com</p>
      <p class="qr-tag">Know what your plane is worth.</p>
      <p class="qr-note">Scan for a free asking-price range — no fabricated sale prices.</p>
    </article>

    <div class="qr-actions">
      <button type="button" class="btn-primary" @click="printPage">
        <i class="ti ti-printer" aria-hidden="true"></i>
        Print
      </button>
      <a class="btn-ghost" href="/qr.png" download="smallplanevalue-qr.png">
        <i class="ti ti-download" aria-hidden="true"></i>
        PNG
      </a>
      <a class="btn-ghost" href="/qr.svg" download="smallplanevalue-qr.svg">
        SVG
      </a>
      <a class="btn-ghost" href="/qr-print.png" download="smallplanevalue-qr-print.png">
        High-res PNG
      </a>
      <a class="btn-ghost" href="/qr-card.svg" download="smallplanevalue-qr-card.svg">
        Poster
      </a>
    </div>
  </main>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'QR code — SmallPlaneValue.com',
  description: 'Print or download the SmallPlaneValue.com QR code for hangar boards, flyers, and business cards.',
})

function printPage() {
  window.print()
}
</script>

<style scoped>
.qr-page {
  min-height: 100vh;
  background: var(--sky);
  color: var(--white);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px 36px;
  position: relative;
}
.qr-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 60% 40%, rgba(19,64,116,0.6) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 20% 80%, rgba(232,160,32,0.08) 0%, transparent 60%);
  pointer-events: none;
}
.qr-back {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  color: rgba(247,245,240,0.72);
  text-decoration: none;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.qr-back span { color: var(--accent); }
.qr-back:hover { color: var(--white); }
.qr-card {
  position: relative;
  z-index: 1;
  width: min(420px, 100%);
  background: rgba(7,15,28,0.55);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--radius-lg);
  padding: 22px 22px 24px;
  text-align: center;
  box-shadow: 0 24px 60px rgba(0,0,0,0.28);
}
.qr-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  border: 1px solid rgba(232,160,32,0.3);
  padding: 5px 12px;
  border-radius: 99px;
  margin-bottom: 18px;
}
.qr-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}
.qr-mark {
  width: 36px;
  height: 36px;
  background: var(--accent);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sky);
  font-size: 20px;
  flex-shrink: 0;
}
.qr-card h1 {
  font-family: var(--display);
  font-size: 34px;
  letter-spacing: 0.04em;
  font-weight: 400;
  line-height: 1;
}
.qr-card h1 span { color: var(--accent); }
.qr-frame {
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  margin: 0 auto 14px;
  width: fit-content;
}
.qr-frame img {
  display: block;
  width: min(240px, 64vw);
  height: auto;
}
.qr-url {
  font-family: var(--display);
  font-size: 28px;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
.qr-tag {
  color: rgba(247,245,240,0.72);
  font-weight: 300;
  margin-bottom: 10px;
}
.qr-note {
  color: rgba(247,245,240,0.45);
  font-size: 13px;
  font-weight: 300;
  line-height: 1.45;
}
.qr-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
}
.qr-actions .btn-ghost,
.qr-actions .btn-primary {
  padding: 10px 16px;
  font-size: 14px;
}

@media print {
  .qr-back,
  .qr-actions { display: none !important; }
  .qr-page {
    background: #fff;
    padding: 0;
    min-height: auto;
  }
  .qr-page::before { display: none; }
  .qr-card {
    width: 420px;
    background: var(--sky);
    box-shadow: none;
    border: none;
    break-inside: avoid;
  }
}
</style>
