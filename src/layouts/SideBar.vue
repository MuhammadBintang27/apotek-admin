<template>
  <!-- Mobile backdrop -->
  <div
    v-if="mobileSidebarOpen"
    class="sb__mobile-backdrop"
    @click="configStore.closeMobileSidebar()"
  ></div>

  <aside
    class="sb"
    :class="{ 'sb--collapsed': isCollapsedView, 'sb--mobile-open': mobileSidebarOpen }"
    @mouseenter="sidebarHovered = true"
    @mouseleave="sidebarHovered = false"
  >
    <!-- Brand -->
    <div class="sb__brand">
      <img
        :src="LINK_LOGO"
        alt="Logo"
        class="sb__logo"
        :class="{ 'sb__logo--sm': isCollapsedView }"
      />
    </div>

    <!-- Nav: menu statis — app ini cuma console owner (3 halaman), gak butuh menu dinamis
    dari DB seperti apotek utama. -->
    <nav class="sb__nav">
      <div v-show="!isCollapsedView" class="sb__section-label">MENU</div>

      <div v-for="item in menuItems" :key="item.id" class="sb__hw">
        <router-link
          :to="item.path"
          class="sb__item"
          :class="{ 'sb__item--active': isActive(item.path) }"
        >
          <i :class="item.icon" class="sb__item-icon"></i>
          <span v-show="!isCollapsedView" class="sb__item-label">{{ item.title }}</span>
        </router-link>

        <div v-if="isCollapsedView" class="sb__popup">
          <div class="sb__popup-title">
            <i :class="item.icon" class="sb__popup-icon"></i>
            {{ item.title }}
          </div>
        </div>
      </div>

      <div v-show="!isCollapsedView" class="sb__section-label" style="margin-top: 8px">
        AKSES CEPAT
      </div>

      <div class="sb__hw">
        <button class="sb__item sb__item--logout" @click="logout">
          <i class="fas fa-sign-out-alt sb__item-icon"></i>
          <span v-show="!isCollapsedView" class="sb__item-label">Keluar</span>
        </button>
        <div v-if="isCollapsedView" class="sb__popup">
          <div class="sb__popup-title"><i class="fas fa-sign-out-alt sb__popup-icon"></i> Keluar</div>
        </div>
      </div>
    </nav>

    <!-- Footer -->
    <div class="sb__footer">
      <span class="sb__online-dot"><i class="fas fa-circle"></i></span>
      <span v-show="!isCollapsedView">Online</span>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/config'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()
const authStore = useAuthStore()
const { LINK_LOGO } = storeToRefs(authStore)

const { sidebarCollapsed: collapsed, mobileSidebarOpen } = storeToRefs(configStore)

const router = useRouter()
const route = useRoute()

const menuItems = [
  {
    id: 'client-registration',
    title: 'Client Registration',
    icon: 'fas fa-store',
    path: '/manajemen/client-registration/list',
  },
  {
    id: 'menu-items',
    title: 'Master Menu',
    icon: 'fas fa-list',
    path: '/manajemen/menu-items',
  },
  {
    id: 'assign-menu',
    title: 'Assign Menu',
    icon: 'fas fa-sitemap',
    path: '/manajemen/assign-menu',
  },
  {
    id: 'user-management',
    title: 'Manajemen User',
    icon: 'fas fa-users-cog',
    path: '/manajemen/user-management',
  },
  {
    id: 'log-aktivitas',
    title: 'Log Aktivitas',
    icon: 'fas fa-history',
    path: '/manajemen/log-aktivitas',
  },
]

const isActive = (path) => {
  if (!path || path === '#') return false
  return route.path.startsWith(path)
}

const sidebarHovered = ref(false)
// Sidebar terlihat collapsed hanya jika collapsed = true DAN mouse tidak sedang hover.
// Preferensi "collapsed" itu konsep desktop (hover buat expand) — kalau lagi dibuka
// sebagai drawer mobile (mobileSidebarOpen), paksa selalu full/gak collapsed.
const isCollapsedView = computed(
  () => collapsed.value && !sidebarHovered.value && !mobileSidebarOpen.value,
)

// Tutup mobile sidebar ketika navigasi
watch(
  () => router.currentRoute.value.path,
  () => configStore.closeMobileSidebar(),
)

// Sinkronisasi body class (sb-collapsed) untuk CSS layout
watch(
  collapsed,
  (val) => {
    document.body.classList.toggle('sb-collapsed', val)
  },
  { immediate: true },
)

const logout = () => {
  authStore.clearAuthData()
  router.push('/login')
}
</script>

<style scoped>
/* ── Sidebar shell ── */
.sb {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-sidebar);
  overflow: hidden;
  transition: width var(--transition-normal);
}
.sb--collapsed {
  width: var(--sidebar-width-collapsed);
}

/* ── Brand ── */
.sb__brand {
  height: var(--navbar-height);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-sidebar-border);
  background: var(--color-sidebar-bg);
  flex-shrink: 0;
}
.sb--collapsed .sb__brand {
  padding: 0 var(--space-2);
}
.sb__logo {
  height: 40px;
  width: auto;
  object-fit: contain;
}
.sb__logo--sm {
  height: 32px;
  width: 40px;
  object-fit: cover;
  object-position: center;
  border-radius: var(--radius-full);
}

/* ── Search ── */
.sb__search-wrap {
  padding: var(--space-3) var(--space-4) var(--space-2);
  position: relative;
  flex-shrink: 0;
}
.sb__search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--color-sidebar-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-3);
  height: 34px;
  gap: var(--space-2);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
}
.sb__search-box:focus-within {
  background: #ffffff;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
}
.sb__search-icon {
  font-size: var(--font-size-xs);
  color: var(--color-placeholder);
  flex-shrink: 0;
}
.sb__search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  outline: none;
  min-width: 0;
  font-family: var(--font-family);
}
.sb__search-input::placeholder {
  color: var(--color-placeholder);
}
.sb__search-clear {
  background: none;
  border: none;
  color: var(--color-placeholder);
  cursor: pointer;
  font-size: var(--font-size-xs);
  padding: 0;
  line-height: 1;
  transition: color var(--transition-fast);
}
.sb__search-clear:hover {
  color: var(--color-text);
}
.sb__search-results {
  position: absolute;
  top: calc(100% - 2px);
  left: var(--space-4);
  right: var(--space-4);
  background: var(--surface-0);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
  max-height: 260px;
  overflow-y: auto;
}
.sb__search-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.sb__search-item:hover {
  background: var(--color-primary-soft);
}
.sb__search-item-icon {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}
.sb__search-item-title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-heading);
}
.sb__search-item-cat {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-top: 1px;
}
.sb__search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-5);
  color: var(--color-muted);
  font-size: var(--font-size-sm);
}
.sb__search-empty i {
  font-size: 1.2rem;
  color: var(--color-placeholder);
}


/* ── Nav ── */
.sb__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-2) var(--space-3) var(--space-4);
  scrollbar-width: thin;
  scrollbar-color: var(--surface-200) transparent;
}
.sb--collapsed .sb__nav {
  padding: var(--space-2) var(--space-2) var(--space-4);
}

.sb__section-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--sky-700);
  text-transform: uppercase;
  padding: var(--space-4) var(--space-2) var(--space-1);
  white-space: nowrap;
}


/* ── Nav items ── */
.sb__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #1e3a5f;
  font-family: var(--font-family);
  text-decoration: none;
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}
.sb__item:focus,
.sb__item:focus-visible {
  outline: none;
}
.sb--collapsed .sb__item {
  justify-content: center;
  padding: 9px 0;
  gap: 0;
  border-radius: var(--radius-md);
}
.sb__item:not(.sb__item--active):hover {
  background: var(--sky-100);
  color: var(--sky-700) !important;
}
.sb__item--active,
.sb__item--active:hover {
  background: var(--sky-500) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  box-shadow: 0 3px 8px color-mix(in srgb, var(--sky-500) 35%, transparent) !important;
}
.sb__item-icon {
  width: 18px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;
  transition: color var(--transition-fast);
}
.sb--collapsed .sb__item-icon {
  width: 20px;
  font-size: 15px;
}
.sb__item:not(.sb__item--active):hover .sb__item-icon {
  color: var(--sky-600) !important;
}
.sb__item--active .sb__item-icon,
.sb__item--active:hover .sb__item-icon {
  color: #ffffff !important;
}
.sb__item-label {
  flex: 1;
  line-height: 1.3;
}
.sb__chevron {
  font-size: var(--font-size-xs);
  color: #94a3b8;
  transition: transform var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}
.sb__item:not(.sb__item--active):hover .sb__chevron {
  color: var(--sky-600) !important;
}
.sb__item--active .sb__chevron,
.sb__item--active:hover .sb__chevron {
  color: #ffffff !important;
}
.sb__item--open .sb__chevron {
  transform: rotate(90deg);
  color: var(--sky-600);
}

/* ── Children ── */
.sb__children {
  margin: 2px 0 4px var(--space-3);
  padding-left: var(--space-3);
  border-left: 2px solid var(--sky-300);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sb__child {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px 10px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #1e3a5f;
  font-family: var(--font-family);
  text-decoration: none;
  outline: none;
  transition: all var(--transition-fast);
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.sb__child:focus,
.sb__child:focus-visible {
  outline: none;
}
.sb__child:not(.sb__child--active):hover {
  background: var(--sky-100);
  color: var(--sky-700) !important;
}
.sb__child--active,
.sb__child--active:hover {
  background: var(--sky-500) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  box-shadow: 0 3px 8px color-mix(in srgb, var(--sky-500) 35%, transparent) !important;
}
.sb__child-dot {
  width: 5px;
  height: 5px;
  border-radius: var(--radius-full);
  background: var(--sky-400);
  flex-shrink: 0;
  transition: background var(--transition-fast);
}
.sb__child:not(.sb__child--active):hover .sb__child-dot {
  background: var(--sky-600) !important;
}
.sb__child--active .sb__child-dot,
.sb__child--active:hover .sb__child-dot {
  background: #ffffff !important;
}

/* ── Badge ── */
.sb__badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  background: #ef4444;
  color: #fff;
  border-radius: var(--radius-full);
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
}

/* ── Logout item ── */
.sb__item--logout {
  color: #ef4444;
}
.sb__item--logout:hover {
  background: #fef2f2;
  color: #dc2626;
}
.sb__item--logout .sb__item-icon {
  color: #ef4444;
}

/* ── Footer ── */
.sb__footer {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-sidebar-border);
  background: var(--color-sidebar-bg);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--sky-800);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
}
.sb--collapsed .sb__footer {
  justify-content: center;
  padding: var(--space-3) 0;
}
.sb__online-dot {
  font-size: 8px;
  color: #10b981;
  flex-shrink: 0;
}

/* ── Slide transition ── */
.slide-enter-active,
.slide-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Hover wrapper (for popup) ── */
.sb__hw {
  position: relative;
}
.sb__hw::after {
  content: '';
  position: absolute;
  top: 0;
  right: -10px;
  width: 10px;
  height: 100%;
}

/* ── Collapsed popup (tooltip-style) ── */
.sb__popup {
  position: absolute;
  left: calc(100% + 6px);
  top: 0;
  min-width: 180px;
  background: var(--surface-0);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1);
  z-index: 2000;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.sb__hw:hover .sb__popup {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.sb__popup-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-heading);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-1);
}
.sb__popup-icon {
  font-size: 12px;
  color: var(--color-primary);
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}
.sb__popup-child {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: #1e3a5f;
  text-decoration: none;
  outline: none;
  transition: all var(--transition-fast);
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.sb__popup-child:focus,
.sb__popup-child:focus-visible {
  outline: none;
}
.sb__popup-child:not(.sb__popup-child--active):hover {
  background: var(--sky-100);
  color: var(--sky-700) !important;
}
.sb__popup-child--active,
.sb__popup-child--active:hover {
  background: var(--sky-500) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  box-shadow: 0 3px 8px color-mix(in srgb, var(--sky-500) 35%, transparent) !important;
}
.sb__popup-child-icon {
  font-size: 11px;
  color: #64748b;
  width: 13px;
  text-align: center;
  flex-shrink: 0;
}
.sb__popup-child:not(.sb__popup-child--active):hover .sb__popup-child-icon {
  color: var(--sky-600) !important;
}
.sb__popup-child--active .sb__popup-child-icon,
.sb__popup-child--active:hover .sb__popup-child-icon {
  color: #ffffff !important;
}
/* Arrow */
.sb__popup::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 14px;
  border: 6px solid transparent;
  border-right-color: var(--color-border);
  border-left: none;
}
.sb__popup::after {
  content: '';
  position: absolute;
  left: -5px;
  top: 15px;
  border: 5px solid transparent;
  border-right-color: var(--surface-0);
  border-left: none;
}
</style>

<style>
/* ── Global: mobile backdrop ── */
.sb__mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: calc(var(--z-sidebar) - 1);
  backdrop-filter: blur(2px);
}

/* ── Mobile: sidebar as drawer ── */
@media (max-width: 768px) {
  .sb {
    transform: translateX(-100%);
    width: var(--sidebar-width) !important;
    transition:
      transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      width var(--transition-normal);
  }
  .sb--mobile-open {
    transform: translateX(0);
  }
}
</style>
