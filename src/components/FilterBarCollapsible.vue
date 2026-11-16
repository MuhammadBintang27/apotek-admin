<template>
  <!-- Tombol ini cuma nongol di layar kecil (≤576px, lihat filter-bar-responsive.css).
       Di layar besar dia display:none dan gak makan tempat sama sekali. -->
  <button type="button" class="filter-toggle-btn" :class="{ active: open }" @click="open = !open">
    <i class="pi" :class="open ? 'pi-chevron-up' : 'pi-filter'"></i>
    {{ label }}
  </button>

  <!-- Di layar >576px, div ini "transparan" (display:contents — diatur di
       filter-bar-responsive.css) jadi slot-nya tetap jadi child langsung dari
       filter-bar (persis kayak sebelum dibungkus komponen ini). Baru di HP,
       kalau belum di-tap "Filter" (belum open), isinya disembunyikan. -->
  <div class="filter-collapsible" :class="{ 'is-open': open }">
    <slot />
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  label: { type: String, default: 'Filter' },
})

// Default ketutup — di layar kecil yang keliatan cuma "Cari" + tombol ini.
// Gak ngaruh apa-apa di layar besar (lihat komentar di filter-bar-responsive.css).
const open = ref(false)
</script>
