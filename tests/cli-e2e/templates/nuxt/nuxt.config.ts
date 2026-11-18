import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-12',
  devtools: { enabled: false },
  // The test writes app/app.vue after `heart-ui add`, rendering every demo.
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
})
