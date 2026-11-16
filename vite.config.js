import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('ion-'),
          },
        },
      }),
      // DevTools TIDAK masuk production build
      ...(isProd ? [] : [vueDevTools()]),
    ],

    base: '/corepotek-admin/',

    server: {
      proxy: {
        // Proxy gambar dari ws-simrs.net — dev only, path prioritas utama
        '/ws-simrs-assets': {
          target: 'https://ws-simrs.net',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/ws-simrs-assets/, ''),
        },
        // Proxy Laravel API (termasuk /img-proxy endpoint)
        '/api-laravel': {
          target: 'https://simrs-link.site',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api-laravel/, ''),
        },
      },
    },

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    build: {
      target: 'es2020',
      minify: 'esbuild',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
              manualChunks(id) {
            if (!id.includes('node_modules')) return

            // ── PrimeVue splitting ──────────────────────────────────────────
            // 1. Theming — CSS-in-JS terbesar, hampir tidak berubah
            if (id.includes('/@primeuix/themes')) return 'vendor-primevue-themes'

            // 2. @primeuix core (utils, core primitives) — pisah dari komponen UI
            if (id.includes('/@primeuix/') || id.includes('/@primevue/')) {
              return 'vendor-primeuix-core'
            }

            // 3. Semua komponen primevue/* satu chunk. Sebelumnya dipecah per-kategori
            // (datatable/paginator/overlay/dll), tapi komponen2 itu saling import lintas
            // kategori (mis. Paginator import Select, Select pakai overlay utils) — tiap
            // split baru nemu korban baru yang blank/unstyled di production build (kerja
            // normal di dev karena Vite dev gak nge-chunk seagresif build). Satu chunk =
            // gak ada lagi cross-chunk ordering bug kayak gitu.
            if (id.includes('/primevue/')) return 'vendor-primevue'

            // ── Vendor lain ─────────────────────────────────────────────────
            if (
              id.includes('/vue/') ||
              id.includes('/vue-router/') ||
              id.includes('/pinia/') ||
              id.includes('/@vue/')
            ) return 'vendor-vue'

            if (id.includes('/jspdf/') || id.includes('/jspdf.es')) return 'vendor-jspdf'
            if (id.includes('/html2canvas')) return 'vendor-html2canvas'
            // echarts + zrender (PartografView) — pisah agar tidak ikut chunk view
            if (
              id.includes('/echarts/') ||
              id.includes('/vue-echarts/') ||
              id.includes('/zrender/')
            ) return 'vendor-echarts'
            if (id.includes('/chart.js/')) return 'vendor-chart'
            if (id.includes('/xlsx/')) return 'vendor-xlsx'
            if (id.includes('/pusher-js/')) return 'vendor-pusher'

            if (
              id.includes('/axios/') ||
              id.includes('/date-fns/') ||
              id.includes('/jwt-decode/')
            ) return 'vendor-utils'
          },
        },
      },
    },
  }
})
