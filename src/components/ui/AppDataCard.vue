<template>
  <div class="data-card" :class="{ 'data-card--flush': noPadding }">
    <!-- Header -->
    <div v-if="title || $slots.header" class="data-card__header">
      <div class="data-card__header-left">
        <slot name="header">
          <div v-if="icon" class="data-card__header-icon">
            <i :class="icon"></i>
          </div>
          <div>
            <h2 v-if="title" class="data-card__title">{{ title }}</h2>
            <p v-if="description" class="data-card__desc">{{ description }}</p>
          </div>
        </slot>
      </div>
      <div v-if="$slots.actions" class="data-card__header-actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Divider (only if there's a header and body content) -->
    <div v-if="(title || $slots.header) && $slots.default" class="data-card__divider"></div>

    <!-- Content -->
    <div v-if="$slots.default" class="data-card__body" :class="{ 'data-card__body--no-pad': noPadding }">
      <slot />
    </div>

    <!-- Footer slot -->
    <div v-if="$slots.footer" class="data-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  /** Judul card */
  title: {
    type: String,
    default: null,
  },
  /** Deskripsi opsional di bawah title */
  description: {
    type: String,
    default: null,
  },
  /** Icon class FA/PI opsional di header */
  icon: {
    type: String,
    default: null,
  },
  /** Jika true, body tidak punya padding (berguna untuk DataTable full-width) */
  noPadding: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.data-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Card berisi tabel (noPadding): garis aksen di atas */
.data-card--flush {
  border-top: 3px solid var(--sky-500);
}

/* ── Header ── */
.data-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  flex-wrap: wrap;
  background: linear-gradient(135deg, #f0f8ff 0%, #e8f4fe 100%);
  border-bottom: 1px solid var(--sky-100);
}

.data-card__header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.data-card__header-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: var(--sky-600);
  border: 1px solid var(--sky-200);
  border-radius: var(--radius-md);
  font-size: 14px;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--sky-500) 12%, transparent);
  flex-shrink: 0;
}

.data-card__title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--sky-900);
  margin: 0;
}

.data-card__desc {
  font-size: var(--font-size-xs);
  color: var(--sky-600);
  margin: 2px 0 0;
  font-weight: 500;
}

.data-card__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  flex-wrap: wrap;
}

/* ── Divider ── */
.data-card__divider {
  height: 1px;
  background: var(--sky-100);
}

/* ── Body ── */
.data-card__body {
  padding: var(--space-5);
}
.data-card__body--no-pad {
  padding: 0;
}

/* ── Footer ── */
.data-card__footer {
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--color-border);
  background: var(--surface-50);
}
</style>
