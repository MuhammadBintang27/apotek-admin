<template>
  <header class="nb">
    <!-- Left: hamburger + company badge -->
    <div class="nb__left">
      <button class="nb__hamburger" @click="toggleSidebar" aria-label="Toggle sidebar">
        <i class="fas fa-bars"></i>
      </button>

      <Tag v-if="company" class="nb__company" severity="secondary">
        <i class="pi pi-building nb__company-icon"></i>
        {{ company }}
      </Tag>
    </div>

    <!-- Right: actions -->
    <div class="nb__right">
      <!-- Pilihan tema (bentuk komponen + font) -->
      <div class="nb__theme">
        <i class="pi pi-palette nb__theme-icon" v-tooltip.bottom="'Tema'"></i>
        <Select
          :modelValue="currentThemeId"
          :options="THEMES"
          optionLabel="label"
          optionValue="id"
          class="nb__theme-select"
          aria-label="Tema"
          @update:modelValue="(v) => applyTheme(primevue.config, v)"
        />
      </div>

      <!-- User menu trigger -->
      <button class="nb__user-btn" @click="toggleUserMenu" aria-label="User menu" ref="userBtnRef">
        <Avatar
          :label="userInitials"
          shape="circle"
          class="nb__avatar"
        />
        <div class="nb__user-info">
          <span class="nb__user-name">{{ user_name }}</span>
          <span class="nb__user-role">Pengguna Apotek</span>
        </div>
        <i class="pi pi-chevron-down nb__chevron" :class="{ 'nb__chevron--open': userMenuOpen }"></i>
      </button>

      <!-- User dropdown -->
      <Transition name="dropdown">
        <div v-if="userMenuOpen" class="nb__dropdown" ref="dropdownRef">
          <div class="nb__dropdown-header">
            <Avatar :label="userInitials" shape="circle" class="nb__dropdown-avatar" />
            <div>
              <div class="nb__dropdown-name">{{ user_name }}</div>
              <div class="nb__dropdown-company">{{ company }}</div>
            </div>
          </div>
          <div class="nb__dropdown-divider"></div>
          <router-link to="/setting/ganti-password" class="nb__dropdown-item" @click="closeUserMenu">
            <i class="pi pi-key"></i>
            <span>Ganti Password</span>
          </router-link>
          <div class="nb__dropdown-divider"></div>
          <button class="nb__dropdown-item nb__dropdown-item--danger" @click="logout">
            <i class="pi pi-sign-out"></i>
            <span>Keluar</span>
          </button>
        </div>
      </Transition>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useConfigStore } from '@/stores/config'
import { storeToRefs } from 'pinia'
import { usePrimeVue } from 'primevue/config'
import { THEMES, currentThemeId, applyTheme } from '@/composables/useAppTheme'

const authStore   = useAuthStore()
const configStore = useConfigStore()
const router      = useRouter()
const primevue    = usePrimeVue()

const { user_name, company } = storeToRefs(authStore)

const userMenuOpen = ref(false)
const userBtnRef   = ref(null)
const dropdownRef  = ref(null)

const userInitials = computed(() => {
  if (!user_name.value) return '?'
  return user_name.value
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
})

const toggleSidebar = () => {
  if (window.innerWidth <= 768) {
    configStore.toggleMobileSidebar()
  } else {
    configStore.toggleSidebar()
  }
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

// Close on outside click
const onClickOutside = (e) => {
  if (
    userMenuOpen.value &&
    !userBtnRef.value?.contains(e.target) &&
    !dropdownRef.value?.contains(e.target)
  ) {
    closeUserMenu()
  }
}

const logout = () => {
  authStore.clearAuthData()
  closeUserMenu()
  router.push('/login')
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
/* ── Navbar shell ── */
.nb {
  height: var(--navbar-height);
  background: var(--color-sidebar-bg);
  border-bottom: 1px solid var(--color-sidebar-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5);
  gap: var(--space-4);
  box-shadow: var(--shadow-xs);
  /* sticky positioning handled by parent layout */
}

/* ── Left ── */
.nb__left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.nb__hamburger {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sky-200);
  background: var(--surface-0);
  border-radius: var(--radius-md);
  color: var(--sky-600);
  font-size: 15px;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  flex-shrink: 0;
}
.nb__hamburger:hover {
  background: var(--sky-50);
  border-color: var(--sky-300);
  color: var(--sky-700);
}

.nb__company {
  font-size: var(--font-size-xs) !important;
  font-weight: 600 !important;
  background: var(--surface-0) !important;
  color: var(--sky-700) !important;
  border: 1px solid var(--sky-200) !important;
}
.nb__company-icon {
  font-size: 10px;
  margin-right: 4px;
}

/* ── Tema ── */
.nb__theme {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: var(--space-2);
}
.nb__theme-icon {
  color: var(--sky-600);
  font-size: 15px;
}
.nb__theme-select {
  height: 34px;
  min-width: 96px;
  font-size: var(--font-size-sm);
  background: var(--surface-0);
  border-color: var(--sky-200);
}
.nb__theme-select :deep(.p-select-label) {
  display: flex;
  align-items: center;
  padding-top: 0;
  padding-bottom: 0;
  font-size: var(--font-size-sm);
}
@media (max-width: 720px) {
  .nb__theme-icon {
    display: none;
  }
}

/* ── Right ── */
.nb__right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  position: relative;
  flex-shrink: 0;
}

/* ── User button ── */
.nb__user-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 10px 6px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--surface-0);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}
.nb__user-btn:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary-border);
}

.nb__avatar {
  width: 28px !important;
  height: 28px !important;
  font-size: var(--font-size-xs) !important;
  background: var(--sky-100) !important;
  color: var(--sky-700) !important;
  font-weight: 700 !important;
}

.nb__user-info {
  display: flex;
  flex-direction: column;
  text-align: left;
  min-width: 0;
}
.nb__user-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-heading);
  white-space: nowrap;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nb__user-role {
  font-size: 10px;
  color: var(--color-muted);
}

.nb__chevron {
  font-size: 10px;
  color: var(--color-muted);
  transition: transform var(--transition-fast);
}
.nb__chevron--open {
  transform: rotate(180deg);
}

/* ── Dropdown ── */
.nb__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-modal);
  overflow: hidden;
}

.nb__dropdown-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
}

.nb__dropdown-avatar {
  width: 36px !important;
  height: 36px !important;
  font-size: var(--font-size-sm) !important;
  background: var(--sky-100) !important;
  color: var(--sky-700) !important;
  font-weight: 700 !important;
  flex-shrink: 0;
}

.nb__dropdown-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-heading);
}
.nb__dropdown-company {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-top: 1px;
}

.nb__dropdown-divider {
  height: 1px;
  background: var(--color-border);
}

.nb__dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
}
.nb__dropdown-item i {
  font-size: 13px;
  color: var(--color-muted);
  width: 16px;
  text-align: center;
}
.nb__dropdown-item:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.nb__dropdown-item:hover i {
  color: var(--color-primary);
}

.nb__dropdown-item--danger {
  color: #ef4444;
}
.nb__dropdown-item--danger i {
  color: #ef4444;
}
.nb__dropdown-item--danger:hover {
  background: #fef2f2;
  color: #dc2626;
}
.nb__dropdown-item--danger:hover i {
  color: #dc2626;
}

/* ── Dropdown transition ── */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .nb__user-info {
    display: none;
  }
  .nb__chevron {
    display: none;
  }
}
</style>
