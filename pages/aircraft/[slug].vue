<template>
  <AppNav />
  <main v-if="guide" class="guide">
    <p class="section-kicker">{{ guide.kicker }}</p>
    <h1 class="section-h2">{{ guide.headline }}</h1>
    <p class="section-body">{{ guide.lede }}</p>
    <p class="guide-actions">
      <a class="btn-primary" :href="href">
        <i class="ti ti-calculator"></i> Value this {{ guide.shortName }}
      </a>
      <NuxtLink class="guide-back" to="/aircraft">All aircraft guides</NuxtLink>
    </p>

    <h2 class="guide-h2">What moves the number</h2>
    <div class="guide-drivers">
      <section v-for="driver in guide.drivers" :key="driver.title">
        <h3>{{ driver.title }}</h3>
        <p>{{ driver.text }}</p>
      </section>
    </div>

    <h2 class="guide-h2">Which {{ guide.shortName }}</h2>
    <ul class="guide-variants">
      <li v-for="variant in guide.variants" :key="variant.name">
        <strong>{{ variant.name }}.</strong> {{ variant.note }}
      </li>
    </ul>

    <h2 class="guide-h2">Questions owners ask</h2>
    <div class="guide-faqs">
      <section v-for="faq in guide.faqs" :key="faq.question">
        <h3>{{ faq.question }}</h3>
        <p>{{ faq.answer }}</p>
      </section>
    </div>

    <h2 class="guide-h2">Value a different airplane later</h2>
    <p class="guide-return">Someone who prices a {{ guide.shortName }} often comes back months later for a different model. These are separate valuations.</p>
    <ul class="guide-related">
      <li v-for="item in related" :key="item.slug">
        <NuxtLink :to="`/aircraft/${item.slug}`">{{ item.name }}</NuxtLink>
      </li>
    </ul>

    <p class="note-box">AI-generated estimates for research only. Not a certified appraisal. GA sale prices are not publicly recorded, so the valuation is an asking range and a fair-market band — not a fabricated sold price.</p>
  </main>
  <AppFooter />
</template>

<script setup lang="ts">
import { guideBySlug, relatedGuides, valuationHref } from '~/data/aircraftGuides'

const route = useRoute()
const guide = guideBySlug(String(route.params.slug || ''))
if (!guide) {
  throw createError({ statusCode: 404, statusMessage: 'Aircraft guide not found' })
}
const href = valuationHref(guide)
const related = relatedGuides(guide)

usePageSeo({
  title: guide.title,
  description: guide.description,
  path: `/aircraft/${guide.slug}`,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  },
})
</script>
