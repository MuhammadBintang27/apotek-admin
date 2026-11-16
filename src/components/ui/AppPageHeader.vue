<template>
  <div class="page-header" :class="{ 'page-header--card': card }">
    <div class="page-header__main">
      <div class="page-header__title-wrap">
        <div v-if="icon" class="page-header__icon">
          <i :class="icon"></i>
        </div>
        <div>
          <h1 class="page-header__title">{{ title }}</h1>
          <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <!-- Actions slot (kanan) -->
      <div v-if="$slots.actions" class="page-header__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /** Judul halaman (h1) */
  title: {
    type: String,
    required: true,
  },
  /** Subtitle opsional di bawah title */
  subtitle: {
    type: String,
    default: null,
  },
  /** Icon class (fa / pi), opsional */
  icon: {
    type: String,
    default: null,
  },
  /** Tampilan dalam bentuk card wrapper (default true) */
  card: {
    type: Boolean,
    default: true,
  },
})
</script>

<style scoped>
.page-header {
  margin-bottom: var(--space-4);
}

.page-header--card {
  background: linear-gradient(135deg, var(--sky-600) 0%, var(--sky-500) 100%);
  border: 1px solid var(--sky-600);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--sky-500) 25%, transparent);
}

.page-header__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.page-header__title-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.page-header__icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.page-header__title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  margin: 0;
}

.page-header__subtitle {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.85);
  margin: 3px 0 0;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  flex-wrap: wrap;
}

/* Tombol di atas latar biru: semua putih penuh berteks biru (outline/teks/utama sama), supaya
   jelas terbaca. Tombol severity khusus (warn/danger/success/help/info) dibiarkan agar tetap
   terbaca artinya. */
.page-header--card .page-header__actions :deep(.p-button:not(.p-button-success):not(.p-button-danger):not(.p-button-warn):not(.p-button-help):not(.p-button-info)) {
  background: #fff;
  border-color: #fff;
  color: var(--sky-700);
}
.page-header--card .page-header__actions :deep(.p-button:not(.p-button-success):not(.p-button-danger):not(.p-button-warn):not(.p-button-help):not(.p-button-info):not(:disabled):hover) {
  background: var(--sky-50);
  border-color: var(--sky-50);
  color: var(--sky-800);
}
.page-header--card .page-header__actions :deep(.p-button:disabled) {
  opacity: 0.6;
}
</style>
