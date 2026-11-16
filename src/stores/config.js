// stores/index.js (or wherever your stores are)
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', {
  state: () => {
    const isProd = true
    return {
      mode: isProd ? 'production' : 'development',
      apiApotikUrl:
        isProd
          ? 'https://ws-simrs.net/ws_posindo_v2.1'
          : 'http://localhost/ws_posindo_v2.1',

      sidebarCollapsed: localStorage.getItem('sb_collapsed') === '1',
      mobileSidebarOpen: false,
    }
  },
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem('sb_collapsed', this.sidebarCollapsed ? '1' : '0')
    },
    toggleMobileSidebar() {
      this.mobileSidebarOpen = !this.mobileSidebarOpen
    },
    closeMobileSidebar() {
      this.mobileSidebarOpen = false
    },
  },

  getters: {
    getApotikApi: (state) => state.apiApotikUrl,
    getMode: (state) => state.mode,
  },
})

export const useAuthStore = defineStore('auth', {
  state: () => ({
    id_client: localStorage.getItem('id_client') || null,
    user_name: localStorage.getItem('user_name') || null,
    user_id: localStorage.getItem('user_id') || null,
    company: localStorage.getItem('NAMA_APOTEK') || null,
    ALAMAT: localStorage.getItem('ALAMAT') || null,
    LINK_LOGO: localStorage.getItem('LINK_LOGO') || null,
    kop_surat: localStorage.getItem('kop_surat') || null,
    id_lokasi: localStorage.getItem('id_lokasi') || null,
    disable_jika_sediaan_nol: localStorage.getItem('disable_jika_sediaan_nol') || null,
    tampilkan_no_urutan_display: localStorage.getItem('TAMPILKAN_NO_URUTAN_DISPLAY') ?? 0,
    // IS_OWNER dari m_login_apotek — token owner tidak terikat ID_CLIENT manapun dan cuma boleh
    // dipakai buat layar Client Registration (lihat router beforeEach + api_apotek.md kontrak
    // User.php/ClientRegistration.php). Disimpan di login (lihat LoginView.vue handleSubmit).
    is_owner: localStorage.getItem('is_owner') === '1',
    // TIPE_KLIEN: proyek ini apotek-dedicated (bukan multi-tenant kayak SIMRS), jadi selalu 'APOTEK'.
    // State/getter ini cuma buat kompatibilitas view yang di-sync dari SIMRS (mis. views/konsinyasi,
    // views/apotek) yang gating tampilannya lewat authStore.isApotek.
    tipe_klien: localStorage.getItem('tipe_klien') || 'APOTEK',
    user: null,
  }),

  actions: {
    setIdClient(id, name, user_id, company, ALAMAT, LINK_LOGO, id_lokasi, disable_jika_sediaan_nol) {
      this.id_client = id
      this.user_name = name
      this.user_id = user_id
      this.company = company
      this.ALAMAT = ALAMAT
      this.LINK_LOGO = LINK_LOGO
      this.id_lokasi = id_lokasi
      this.disable_jika_sediaan_nol = disable_jika_sediaan_nol

      localStorage.setItem('id_client', id)
      localStorage.setItem('user_name', name)
      localStorage.setItem('user_id', user_id)
      localStorage.setItem('NAMA_APOTEK', company)
      localStorage.setItem('ALAMAT', ALAMAT)
      localStorage.setItem('LINK_LOGO', LINK_LOGO)
      localStorage.setItem('id_lokasi', id_lokasi)
      localStorage.setItem('disable_jika_sediaan_nol', disable_jika_sediaan_nol)
    },

    setUserData(userData) {
      this.user = userData
    },

    setIsOwner(isOwner) {
      this.is_owner = !!isOwner
      localStorage.setItem('is_owner', this.is_owner ? '1' : '0')
    },

    clearAuthData() {
      this.id_client = null
      this.user_name = null
      this.user_id = null
      this.company = null
      this.ALAMAT = null
      this.LINK_LOGO = null
      this.kop_surat = null
      this.id_lokasi = null
      this.tampilkan_no_urutan_display = 0
      this.is_owner = false
      this.user = null

      localStorage.removeItem('id_client')
      localStorage.removeItem('user_name')
      localStorage.removeItem('user_id')
      localStorage.removeItem('NAMA_APOTEK')
      localStorage.removeItem('ALAMAT')
      localStorage.removeItem('LINK_LOGO')
      localStorage.removeItem('kop_surat')
      localStorage.removeItem('loggedIn')
      localStorage.removeItem('id_lokasi')
      localStorage.removeItem('TAMPILKAN_NO_URUTAN_DISPLAY')
      localStorage.removeItem('is_owner')
      // apotekToken sebelumnya nggak pernah dihapus di sini — jadi login sendiri masih
      // ketolong karena login baru langsung nimpa localStorage dgn setItem, tapi request
      // interceptor global (main.js) tetap nyisipin token basi ini di antara logout dan login
      // ulang, dan sekarang token bisa jadi tidak valid sewaktu-waktu (STATUS_AKSES/STATUS
      // user, lihat api_apotek.md) — response interceptor 401 di main.js gantung ke fungsi ini.
      localStorage.removeItem('apotekToken')
      // tipe_klien sengaja TIDAK direset — proyek ini apotek-dedicated, selalu 'APOTEK'.
    },
  },

  getters: {
    isApotek: (state) => state.tipe_klien === 'APOTEK',
    isRS: (state) => state.tipe_klien !== 'APOTEK',
    isOwner: (state) => state.is_owner === true,
  },
})

export const useGlobalStore = defineStore('global', () => {
  const step = ref('1')

  const setStep = (newValue) => {
    step.value = newValue
  }

  return {
    step,
    setStep,
  }
})