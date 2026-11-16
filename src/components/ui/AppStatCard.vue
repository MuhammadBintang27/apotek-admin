<template>
  <div class="stat-card" :class="[`stat-card--${color}`, { 'stat-card--compact': compact }]">
    <div class="stat-card__body">
      <div class="stat-card__text">
        <div class="stat-card__label">{{ label }}</div>
        <div class="stat-card__value">{{ formattedValue }}</div>
        <div v-if="trend !== null" class="stat-card__trend" :class="trendClass">
          <i :class="trendIcon"></i>
          <span>{{ Math.abs(trend) }}%</span>
          <span class="stat-card__trend-label">vs kemarin</span>
        </div>
      </div>
      <div v-if="icon" class="stat-card__icon-wrap">
        <i :class="icon"></i>
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Label deskripsi kartu */
  label: {
    type: String,
    required: true,
  },
  /** Nilai utama yang ditampilkan */
  value: {
    type: [Number, String],
    default: 0,
  },
  /** Icon class FA/PI opsional */
  icon: {
    type: String,
    default: null,
  },
  /**
   * Warna aksen: 'sky' | 'green' | 'amber' | 'red' | 'purple' | 'slate'
   */
  color: {
    type: String,
    default: 'sky',
  },
  /**
   * Tren persentase (positif/negatif). null = tidak ditampilkan.
   * Contoh: 12.5 atau -3.2
   */
  trend: {
    type: Number,
    default: null,
  },
  /** Prefix nilai, misal 'Rp ' */
  prefix: {
    type: String,
    default: '',
  },
  /** Suffix nilai, misal ' item' */
  suffix: {
    type: String,
    default: '',
  },
  /** Versi ringkas (lebih pendek, angka kecil) untuk baris stat di halaman list */
  compact: {
    type: Boolean,
    default: false,
  },
  /** Format angka dengan separator ribuan */
  formatNumber: {
    type: Boolean,
    default: false,
  },
})

const formattedValue = computed(() => {
  let val = props.value
  if (props.formatNumber && typeof val === 'number') {
    val = val.toLocaleString('id-ID')
  }
  return `${props.prefix}${val}${props.suffix}`
})

const trendClass = computed(() => {
  if (props.trend === null) return ''
  return props.trend >= 0 ? 'stat-card__trend--up' : 'stat-card__trend--down'
})

const trendIcon = computed(() => {
  if (props.trend === null) return ''
  return props.trend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
})
</script>

<style scoped>
.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Top accent bar per color */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.stat-card--sky::before    { background: var(--sky-500); }
.stat-card--green::before  { background: #10b981; }
.stat-card--amber::before  { background: #f59e0b; }
.stat-card--red::before    { background: #ef4444; }
.stat-card--purple::before { background: #8b5cf6; }
.stat-card--slate::before  { background: var(--surface-400); }

.stat-card__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.stat-card__text {
  min-width: 0;
  flex: 1;
}

.stat-card__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-muted);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-card__value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-heading);
  line-height: 1.1;
  margin-bottom: var(--space-2);
}

/* Trend */
.stat-card__trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.stat-card__trend i {
  font-size: 9px;
}
.stat-card__trend--up {
  color: #10b981;
}
.stat-card__trend--down {
  color: #ef4444;
}
.stat-card__trend-label {
  font-weight: 400;
  color: var(--color-muted);
  margin-left: 2px;
}

/* Icon */
.stat-card__icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 18px;
  flex-shrink: 0;
}
.stat-card--sky .stat-card__icon-wrap    { background: var(--sky-50);    color: var(--sky-500); }
.stat-card--green .stat-card__icon-wrap  { background: #ecfdf5;           color: #10b981; }
.stat-card--amber .stat-card__icon-wrap  { background: #fffbeb;           color: #f59e0b; }
.stat-card--red .stat-card__icon-wrap    { background: #fef2f2;           color: #ef4444; }
.stat-card--purple .stat-card__icon-wrap { background: #f5f3ff;           color: #8b5cf6; }
.stat-card--slate .stat-card__icon-wrap  { background: var(--surface-100); color: var(--surface-500); }

/* Compact */
.stat-card--compact { padding: var(--space-2) var(--space-3); }
.stat-card--compact::before { height: 2px; }
.stat-card--compact .stat-card__body { align-items: center; gap: var(--space-2); }
.stat-card--compact .stat-card__label { font-size: var(--font-size-xs); margin-bottom: 0; }
.stat-card--compact .stat-card__value { font-size: var(--font-size-lg); margin-bottom: 0; }
.stat-card--compact .stat-card__icon-wrap { width: 30px; height: 30px; font-size: 13px; }
</style>
