<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <Sidebar class="app-sidebar" />

    <!-- Right side: navbar + content -->
    <div class="app-body" :class="{ 'app-body--collapsed': sidebarCollapsed }">
      <NavBar class="app-navbar" />

      <main class="app-main">
        <router-view />
      </main>

      <footer class="app-footer">
        <span class="app-footer__copy">
          &copy; {{ currentYear }} Corepotek by
          <a href="https://paripurnasentosadigital.id" target="_blank">PT.PARIPURNA SENTOSA DIGITAL</a>.
          All rights reserved.
        </span>
        <span v-if="config.getMode === 'development'" class="app-footer__dev">
          <span class="app-footer__mode">DEV</span>
          {{ config.apiApotikUrl }}
        </span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { useIdleSession } from '@/composables/useIdleSession'

const config = useConfigStore()
const { sidebarCollapsed } = storeToRefs(config)
const currentYear = computed(() => new Date().getFullYear())

useIdleSession()
</script>

<style scoped>
/* ── Shell: fixed sidebar + scrollable body ── */
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

/* ── Sidebar slot ── */
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: var(--z-sidebar);
  flex-shrink: 0;
}

/* ── Body: everything right of sidebar ── */
.app-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-normal);
  min-width: 0;
}
.app-body--collapsed {
  margin-left: var(--sidebar-width-collapsed);
}

/* ── Navbar ── */
.app-navbar {
  position: sticky;
  top: 0;
  z-index: var(--z-navbar);
  flex-shrink: 0;
}

/* ── Main content area ── */
.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-6);
}

/* ── Footer ── */
.app-footer {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-navbar-bg);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  flex-shrink: 0;
}

.app-footer__copy a {
  color: var(--color-primary);
  font-weight: 500;
}

.app-footer__dev {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.app-footer__mode {
  display: inline-block;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: #fef2f2;
  color: #ef4444;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.05em;
}


/* ── Mobile: hide sidebar margin, show full-width ── */
@media (max-width: 768px) {
  .app-body {
    margin-left: 0;
  }
  .app-body--collapsed {
    margin-left: 0;
  }
  .app-main {
    padding: var(--space-4);
  }
}
</style>
