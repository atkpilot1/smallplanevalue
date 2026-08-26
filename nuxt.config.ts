// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  // Nitro auto-selects the Vercel preset on Vercel. Local and GitHub CI
  // produce a Node listener so Playwright can serve the compiled output.

  runtimeConfig: {
    // Server-only secrets (never exposed to the client)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    // Model selection (overridable via env)
    modelMain: process.env.SPV_MODEL_MAIN || 'claude-sonnet-4-6',
    modelFast: process.env.SPV_MODEL_FAST || 'claude-haiku-4-5-20251001',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
