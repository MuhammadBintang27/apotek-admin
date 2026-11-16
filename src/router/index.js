import { createRouter, createWebHistory } from 'vue-router'

const MainLayouts = () => import('@/layouts/MainLayouts.vue')
const LoginView = () => import('@/views/LoginView.vue')

// Manajemen
const MenuItemsView = () => import('@/views/manajemen/MenuItemsView.vue')
const AssignMenuView = () => import('@/views/manajemen/AssignMenuView.vue')
const UserManajemenView = () => import('@/views/manajemen/UserManajemenView.vue')

// Manajemen - Client Registration (super-admin: daftar client apotek baru + langganan)
const ClientRegistrationListView = () =>
  import('@/views/manajemen/ClientRegistrationListView.vue')
const ClientRegistrationFormView = () =>
  import('@/views/manajemen/ClientRegistrationFormView.vue')

// Manajemen - Log Aktivitas (lintas client, GET-only — lihat api_apotek.md)
const LogAktivitasView = () => import('@/views/manajemen/LogAktivitasView.vue')

// Halaman utama app ini: langsung ke daftar client (bukan dashboard/home apotek biasa) —
// app ini cuma console owner (client registration, langganan, menu), tanpa dashboard apotek.
const HOME_PATH = '/manajemen/client-registration/list'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: LoginView,
    },
    {
      path: '',
      component: LoginView,
    },
    {
      path: '/',
      component: MainLayouts,
      children: [
        {
          path: 'manajemen/menu-items',
          name: 'MenuItemsView',
          // main_menu_items itu master menu GLOBAL (dipakai semua client) — requiresOwner cuma
          // penjagaan UX di FE, gate sesungguhnya tetap di server (lihat api_apotek.md).
          meta: { requiresAuth: true, requiresOwner: true },
          component: MenuItemsView,
        },
        {
          path: 'manajemen/assign-menu',
          name: 'AssignMenuView',
          // Beda scope dari apotek utama: di sana assign-menu dibatasi ke user milik client yang
          // sedang login sendiri (requiresAuth saja). Di sini owner-nya lintas-client, jadi
          // di-gate requiresOwner juga — TAPI AssignMenuView.vue saat ini masih pakai id_client
          // dari authStore (punya user yang login), yang null buat akun owner. Perlu ditambah
          // client-picker di view ini sebelum benar-benar bisa assign menu lintas client.
          meta: { requiresAuth: true, requiresOwner: true },
          component: AssignMenuView,
        },
        {
          // Di apotek utama route ini per-client (requiresAuth saja); di sini owner lintas-client.
          // UserManajemenView sudah punya mode owner (filter/pilih client), jadi langsung jalan.
          path: 'manajemen/user-management',
          name: 'UserManajemenView',
          meta: { requiresAuth: true, requiresOwner: true },
          component: UserManajemenView,
        },
        {
          path: 'manajemen/client-registration/list',
          name: 'ClientRegistrationListView',
          // Backend (ClientRegistration.php::require_owner()) menolak akun non-owner di semua
          // endpoint clientregistration/* — requiresOwner cuma penjagaan UX di FE.
          meta: { requiresAuth: true, requiresOwner: true },
          component: ClientRegistrationListView,
        },
        {
          path: 'manajemen/client-registration/form',
          name: 'ClientRegistrationFormView',
          meta: { requiresAuth: true, requiresOwner: true },
          component: ClientRegistrationFormView,
        },
        {
          path: 'manajemen/client-registration/form/:clientId',
          name: 'ClientRegistrationFormEditView',
          meta: { requiresAuth: true, requiresOwner: true },
          component: ClientRegistrationFormView,
        },
        {
          path: 'manajemen/log-aktivitas',
          name: 'LogAktivitasView',
          // GET /api/apotek/LogAktivitas mensyaratkan is_owner=1 di server (403 kalau bukan) —
          // requiresOwner di sini cuma cerminan FE dari gate itu.
          meta: { requiresAuth: true, requiresOwner: true },
          component: LogAktivitasView,
        },
      ],
    },

    // ── Catch-all: path apa pun yang tidak dikenal ──
    { path: '/:pathMatch(.*)*', redirect: HOME_PATH },
  ],
})

router.beforeEach((to, _from, next) => {
  const loggedIn = localStorage.getItem('loggedIn') === 'true'
  const isAuthRoute = to.meta.requiresAuth
  const isLoginPage = to.path === '/login'

  if (isAuthRoute) {
    if (!loggedIn) {
      sessionStorage.setItem('redirectAfterLogin', to.fullPath)
      return next('/login')
    }
    // Dibaca langsung dari localStorage (bukan useAuthStore()) — konsisten dengan cek `loggedIn`
    // di atas, dan menghindari ketergantungan urutan init Pinia di guard level-modul ini.
    if (to.meta.requiresOwner && localStorage.getItem('is_owner') !== '1') {
      return next(HOME_PATH)
    }
    return next()
  }

  if (isLoginPage && loggedIn) {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin') || HOME_PATH
    sessionStorage.removeItem('redirectAfterLogin')
    return next(redirectPath)
  }

  next()
})

export default router
