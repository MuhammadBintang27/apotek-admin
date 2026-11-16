import { ref } from 'vue'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'

/**
 * Tema = preset PrimeVue (Aura/Lara/Material/Nora): bentuk komponen, radius, bayangan, dst + font.
 * Warna primer tetap Sky.
 *
 * Token kita (--sky-*, --surface-*, --color-*) di theme.css adalah alias ke variabel PrimeVue
 * (--p-primary-*, --p-surface-*), jadi tema otomatis mengubah komponen PrimeVue DAN komponen
 * buatan kita (AppPageHeader, kartu, tabel, dst). PrimeVue tidak menyediakan font, jadi font
 * dibawa oleh tema dan ditulis ke --font-family di <html>.
 */

const INTER = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const ROBOTO = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const THEMES = [
  { id: 'aura', label: 'Aura', base: Aura, font: INTER },
  { id: 'lara', label: 'Lara', base: Lara, font: INTER },
  { id: 'material', label: 'Material', base: Material, font: ROBOTO },
  { id: 'nora', label: 'Nora', base: Nora, font: INTER },
]

// Warna primer tetap Sky (identitas aplikasi). Ganti nilai ini kalau suatu saat mau warna lain.
const PRIMARY = 'sky'

export const DEFAULT_THEME_ID = 'aura'
const STORAGE_KEY = 'apotekTheme' // {theme}

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const primaryPalette = (name) => Object.fromEntries(STEPS.map((n) => [n, `{${name}.${n}}`]))

// Permukaan (abu-abu netral) disamakan di semua tema — aplikasi ini hanya mode terang.
const SURFACE = {
  0: '#ffffff',
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
}

const build = (theme) =>
  definePreset(theme.base, {
    semantic: {
      primary: primaryPalette(PRIMARY),
      colorScheme: {
        light: {
          primary: {
            color: '{primary.500}',
            contrastColor: '#ffffff',
            hoverColor: '{primary.600}',
            activeColor: '{primary.700}',
          },
          surface: SURFACE,
        },
      },
    },
  })

const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0]

const readSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

// State bersama (module-level) supaya dropdown di navbar & main.js membaca sumber yang sama.
export const currentThemeId = ref(DEFAULT_THEME_ID)

const applyFont = (theme) => document.documentElement.style.setProperty('--font-family', theme.font)

/** Dipanggil sekali di main.js SEBELUM app.use(PrimeVue): kembalikan preset awal & set font. */
export function initTheme() {
  const theme = themeById(readSaved().theme)
  currentThemeId.value = theme.id
  applyFont(theme)
  return build(theme)
}

/**
 * Ganti tema saat runtime (dari dropdown navbar) lalu simpan pilihannya.
 * `config` = usePrimeVue().config. Preset dipasang lewat config.theme (PrimeVue memantaunya dan
 * memuat ulang CSS-nya) — BUKAN lewat usePreset() dari @primeuix/themes, karena di proyek ini
 * @primeuix/themes dan PrimeVue memakai dua salinan @primeuix/styled yang berbeda sehingga
 * usePreset() akan mengubah instance yang salah.
 */
export function applyTheme(config, themeId) {
  const theme = themeById(themeId)
  config.theme = { ...config.theme, preset: build(theme) }
  applyFont(theme)
  currentThemeId.value = theme.id
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: theme.id }))
  } catch {
    /* localStorage bisa diblok (mode privat) — pilihan tetap berlaku untuk sesi ini */
  }
}

/**
 * Warna primer aktif sebagai nilai nyata (hex/rgb) — untuk kode yang tidak bisa memakai var() CSS,
 * misalnya grafik ECharts (digambar di canvas). Membaca currentThemeId supaya computed yang
 * memakainya otomatis dihitung ulang saat tema diganti.
 */
export function themeColor(step = 500) {
  void currentThemeId.value
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--p-primary-${step}`).trim()
  return v || '#0ea5e9'
}
