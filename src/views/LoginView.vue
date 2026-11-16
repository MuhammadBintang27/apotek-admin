<template>
  <div class="login-page">
    <!-- ══ LATAR: satu warna rata + pola titik ══ -->
    <div class="bg-dots" aria-hidden="true"></div>

    <!-- ══ ANIMATED TICKER BACKGROUND ══ -->
    <div class="ticker-bg" :class="{ 'is-ready': tickerReady }" aria-hidden="true">
      <div
        v-for="(row, ri) in tickerRows"
        :key="ri"
        :ref="(el) => (rowEls[ri] = el)"
        class="ticker-row"
      >
        <div v-for="(item, ii) in row.items" :key="`r${ri}-i${ii}`" class="ticker-box">
          <div class="ticker-chip">
            <span class="tb-icon-wrap"><i :class="item.icon" class="tb-icon"></i></span>
            <div class="tb-text">
              <span class="tb-title">{{ item.title }}</span>
              <span class="tb-sub">{{ item.sub }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ LOGIN CARD ══ -->
    <div class="login-card">
      <div class="logo-section">
        <img :src="logoUrl" alt="Logo" class="logo" />
      </div>

      <div class="welcome">
        <h1 class="welcome-title">Selamat Datang</h1>
        <p class="welcome-sub">Masuk untuk mengelola apotek Anda</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="login-username">Username</label>
          <div class="input-wrap">
            <i class="pi pi-user field-icon"></i>
            <input
              id="login-username"
              v-model="formData.name"
              type="text"
              placeholder="Masukkan username"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="login-password">Password</label>
          <div class="input-wrap">
            <i class="pi pi-lock field-icon"></i>
            <input
              id="login-password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Masukkan password"
              autocomplete="current-password"
              required
            />
            <i
              :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              class="toggle-icon"
              role="button"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              @click="togglePassword"
            ></i>
          </div>
        </div>

        <div class="remember-row">
          <label class="remember-label">
            <input type="checkbox" v-model="rememberMe" class="remember-check" />
            <span>Ingat saya</span>
          </label>
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Memproses...' : 'Masuk' }}</span>
          <i v-if="!loading" class="pi pi-arrow-right btn-arrow"></i>
        </button>
      </form>

      <p class="footer-text">© 2026 Corepotek by PT.PARIPURNA SENTOSA DIGITAL. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfigStore } from '@/stores/config'
import { useAuthStore } from '@/stores/config'
import axios from 'axios'

// PrimeVue Components
import Toast from 'primevue/toast'
const logoUrl = 'https://ws-simrs.net/logo/corepotek.webp'
// Composables
const router = useRouter()
const toast = useToast()
const configStore = useConfigStore()
const authStore = useAuthStore()

// State
const showPassword = ref(false)
const loading = ref(false)
const rememberMe = ref(false)

const formData = reactive({
  name: '',
  password: '',
})

// ── Ticker background data ─────────────────────────────────
// Ticker daur-ulang: tiap baris HANYA berisi satu set kotak. Kotak yang keluar di satu sisi
// langsung muncul lagi dari sisi seberang (lihat startTicker). `speed` = piksel per detik,
// `dir`: 'ltr' bergerak ke kanan, 'rtl' bergerak ke kiri.
const tickerRows = [
  {
    dir: 'ltr',
    speed: 42,
    items: [
      { icon: 'fas fa-cash-register', title: 'Kasir Penjualan', sub: 'POS Apotek & Struk Thermal' },
      { icon: 'fas fa-clock', title: 'Shift Kasir', sub: 'Buka & Tutup Shift' },
      { icon: 'fas fa-mortar-pestle', title: 'Obat Racikan', sub: 'Dosis per Bungkus & Jasa Racik' },
      { icon: 'fas fa-percentage', title: 'Diskon Penjualan', sub: 'Per Item & Potongan Struk' },
      { icon: 'fas fa-user-tag', title: 'Pelanggan & Reseller', sub: 'Kelompok Diskon Pelanggan' },
      { icon: 'fas fa-rotate-left', title: 'Void Transaksi', sub: 'Pembatalan Struk & Item' },
    ],
  },
  {
    dir: 'rtl',
    speed: 57,
    items: [
      { icon: 'fas fa-pills', title: 'Master Barang', sub: 'Obat, BMHP & Barang Umum' },
      { icon: 'fas fa-layer-group', title: 'Batch & Kadaluarsa', sub: 'Pantau Obat Akan Expired' },
      { icon: 'fas fa-table-cells', title: 'Rak Penyimpanan', sub: 'Lokasi Fisik Batch Barang' },
      { icon: 'fas fa-clipboard-list', title: 'Kartu Stok', sub: 'Mutasi Barang Masuk & Keluar' },
      { icon: 'fas fa-boxes', title: 'Stock Opname', sub: 'Per Kategori & Per Rak' },
      { icon: 'fas fa-file-excel', title: 'Migrasi Data Awal', sub: 'Impor Barang, Kas, Hutang & Piutang' },
    ],
  },
  {
    dir: 'ltr',
    speed: 36,
    items: [
      { icon: 'fas fa-file-signature', title: 'Surat Pesanan', sub: 'Umum, Psikotropika & Narkotika' },
      { icon: 'fas fa-pen-to-square', title: 'Otorisasi SP', sub: 'Persetujuan APJ / PJ' },
      { icon: 'fas fa-truck-ramp-box', title: 'Penerimaan Barang', sub: 'Dari SP atau Langsung' },
      { icon: 'fas fa-industry', title: 'Data Supplier / PBF', sub: 'Distributor & Pemasok Obat' },
      { icon: 'fas fa-money-check-dollar', title: 'Hutang Supplier', sub: 'Rekap & Pembayaran Faktur' },
      { icon: 'fas fa-chart-column', title: 'Rekap Pembelian', sub: 'Per Supplier & Per Barang' },
    ],
  },
  {
    dir: 'rtl',
    speed: 67,
    items: [
      { icon: 'fas fa-chart-line', title: 'Dashboard', sub: 'Omset, Margin & Stok Kritis' },
      { icon: 'fas fa-file-invoice-dollar', title: 'Laporan Penjualan', sub: 'Rekap Omzet & Buku Kas' },
      { icon: 'fas fa-scale-balanced', title: 'Laba Rugi', sub: 'Tahunan Skala Bulanan' },
      { icon: 'fas fa-hand-holding-dollar', title: 'Piutang Pelanggan', sub: 'Rekap & Cicilan' },
      { icon: 'fas fa-handshake', title: 'Konsinyasi', sub: 'Titipan, Settlement & Retur' },
      { icon: 'fas fa-users-gear', title: 'Manajemen User', sub: 'Hak Akses Menu per Pengguna' },
    ],
  },
]

// ── Ticker: geser + daur ulang ─────────────────────────────
// Kotak diposisikan absolut, geraknya lewat transform. Panjang "lingkaran" L dibuat >= lebar
// layar + kotak terlebar, dengan sisa ruang dibagi rata ke tiap kotak. Dengan L sebesar itu,
// saat kotak "melompat" dari ujung ke ujung seberang posisinya SELALU di luar layar, jadi
// yang terlihat hanya kotak yang meluncur keluar di satu sisi dan masuk lagi dari sisi lain.
const rowEls = []
const tickerReady = ref(false)
let tickerRows_ = [] // state per baris hasil layout
const shifts = [] // pergeseran kumulatif per baris (dipertahankan saat layout ulang)
let rafId = null
let lastTs = 0
let resizeTimer = null

const modulo = (a, n) => ((a % n) + n) % n

const layoutTicker = () => {
  tickerRows_ = rowEls.map((el, ri) => {
    if (!el) return null
    const boxes = Array.from(el.querySelectorAll('.ticker-box'))
    boxes.forEach((b) => (b.style.width = ''))
    const W = el.clientWidth
    const ws = boxes.map((b) => b.offsetWidth)
    const n = boxes.length
    if (!W || !n) return null
    const total = ws.reduce((x, y) => x + y, 0)
    const maxW = Math.max(...ws)
    // Syarat: L - (kotak terlebar + jatahnya dari sisa ruang) >= W. Diselesaikan untuk L:
    const L = n > 1 ? Math.max(total, ((W + maxW - total / n) * n) / (n - 1)) : W + maxW
    const extra = (L - total) / n
    const ss = ws.map((w) => w + extra)
    boxes.forEach((b, i) => (b.style.width = `${ss[i]}px`))
    const xs = []
    ss.reduce((acc, w, i) => ((xs[i] = acc), acc + w), 0)
    if (shifts[ri] === undefined) shifts[ri] = 0
    return { boxes, xs, ss, L, dir: tickerRows[ri].dir === 'ltr' ? 1 : -1, speed: tickerRows[ri].speed }
  })
  paintTicker()
  tickerReady.value = tickerRows_.some(Boolean)
}

const paintTicker = () => {
  tickerRows_.forEach((r, ri) => {
    if (!r) return
    r.boxes.forEach((b, i) => {
      const pos = modulo(r.xs[i] + shifts[ri] + r.ss[i], r.L) - r.ss[i]
      b.style.transform = `translate3d(${pos.toFixed(2)}px,0,0)`
    })
  })
}

const tick = (ts) => {
  const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0
  lastTs = ts
  tickerRows_.forEach((r, ri) => {
    if (r) shifts[ri] += r.dir * r.speed * dt
  })
  paintTicker()
  rafId = requestAnimationFrame(tick)
}

const onTickerResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(layoutTicker, 120)
}

const startTicker = () => {
  layoutTicker()
  // Lebar kotak berubah setelah font Inter selesai dimuat -> hitung ulang.
  document.fonts?.ready?.then(layoutTicker)
  window.addEventListener('resize', onTickerResize)
  // Hormati preferensi "kurangi gerakan": tampilkan statis, tanpa animasi.
  if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    rafId = requestAnimationFrame(tick)
  }
}

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  clearTimeout(resizeTimer)
  window.removeEventListener('resize', onTickerResize)
})

// ── Toggle password ────────────────────────────────────────
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// ── Existing functions (tidak diubah) ──────────────────────
// Cuma nulis ke localStorage kalau value-nya beneran ada — client apotek
// gak selalu punya baris di tabel registrasi RS (get_profile_rs itu tabel
// RS), jadi field yang gak ketemu balik undefined. localStorage.setItem
// nge-stringify undefined jadi literal "undefined" kalau gak dijaga, nimpa
// fallback yang tadinya udah benar dari setIdClient (lihat handleSubmit).
const setLSIfDefined = (key, value) => {
  if (value !== undefined && value !== null) localStorage.setItem(key, value)
}

// Dulu ini manggil endpoint SIMRS (Data_referensi/get_profile_rs, configStore.simrs) yang
// bacanya dari tabel `profile_rs` (RS/rumah sakit) — client Apotek murni (mis. client 40, tanpa
// baris RS sama sekali) selalu 404/kosong di situ, jadi rsProfile selalu null dan navbar
// nyangkut di fallback literal 'RS' (lihat handleSubmit). Diganti ke endpoint clientregistration
// apotek yang benar (backend ws_posindo_v2.1, tabel profile_apotek) — lihat api_apotek.md.
const profile_apotek = async (id_client) => {
  try {
    const url = configStore.apiApotikUrl
    const endpoint = `/index.php/api/apotek/ClientRegistration/form`

    const { data } = await axios.get(`${url}${endpoint}`, { params: { clientId: id_client } })
    const p = data?.response?.PROFILE_APOTEK || {}

    setLSIfDefined('ALAMAT', p.ALAMAT)
    setLSIfDefined('LINK_LOGO', p.LINK_LOGO)
    setLSIfDefined('NAMA_APOTEK', p.NAMA_APOTEK)

    setLSIfDefined('satu_sehat_client_secret', p.SATU_SEHAT_CLIENT_SECRET)
    setLSIfDefined('satu_sehat_idclient', p.SATU_SEHAT_IDCLIENT)
    setLSIfDefined('satu_sehat_organization_id', p.SATU_SEHAT_ORGANIZATION_ID)
    setLSIfDefined('satu_sehat_struktur_org', p.SATU_SEHAT_STRUKTUR_ORG)

    localStorage.setItem(
      'TAMPILKAN_NO_URUTAN_DISPLAY',
      p.TAMPILKAN_NO_URUTAN_DISPLAY !== undefined && p.TAMPILKAN_NO_URUTAN_DISPLAY !== null
        ? p.TAMPILKAN_NO_URUTAN_DISPLAY
        : 0,
    )

    setLSIfDefined('disable_jika_sediaan_nol', p.DISABLE_JIKA_SEDIAAN_NOL)
    setLSIfDefined('kop_surat', p.KOP_SURAT)

    // Dipakai lagi di handleSubmit lewat rsProfile?.NAMA_APOTEK dst — field-nya sengaja tetap
    // UPPERCASE (sama kayak PROFILE_APOTEK dari kontrak) biar pemanggil di bawah gak berubah.
    return p
  } catch (error) {
    // console.error('Auth error:', error)
    return null
  }
}

const check_jam_server_dan_local = async () => {
  try {
    // Padanan apotek dari check_jamserver SIMRS — GET /api/apotek/auth/jamserver, response
    // shape identik ({waktuserver: 'YYYY-MM-DD'}), tanpa auth (dipanggil sebelum login).
    const url = configStore.apiApotikUrl

    const endpoint = `/index.php/api/apotek/auth/jamserver`

    const response = await axios.get(`${url}${endpoint}`)

    const tanggalLocal = getTanggalLocal()
    const tanggalServer = response.data.waktuserver

    if (tanggalLocal !== tanggalServer) {
      toast.add({
        severity: 'warn',
        summary: 'Gagal Login',
        detail: `Tanggal server (${tanggalServer}) tidak sama dengan tanggal lokal (${tanggalLocal}).
        Pastikan tanggal dan waktu perangkat Anda benar untuk menghindari masalah sinkronisasi data. silahakan hubungi admin.`,
        life: 8000,
      })
      return false
    } else {
      return true
    }
  } catch (error) {
    // console.error('Auth error:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Gagal terkoneksi ke server. Pastikan komputer terhubung ke internet',
      life: 4000,
    })
  }
}

const getTanggalLocal = () => {
  const now = new Date()

  const tahun = now.getFullYear()
  const bulan = String(now.getMonth() + 1).padStart(2, '0')
  const tanggal = String(now.getDate()).padStart(2, '0')

  return `${tahun}-${bulan}-${tanggal}` // format: "2026-03-26"
}

// Sama seperti profile_apotek() — endpoint SIMRS lama diganti ke clientregistration apotek
// (PROFILE_APOL_APOTEK). Dipindah ke setLSIfDefined juga, biar konsisten dan gak nulis
// literal string "undefined"/"null" ke localStorage kalau field-nya belum diisi.
const profile_apol = async (id_client) => {
  try {
    const url = configStore.apiApotikUrl
    const endpoint = `/index.php/api/apotek/ClientRegistration/form`

    const { data } = await axios.get(`${url}${endpoint}`, { params: { clientId: id_client } })
    const a = data?.response?.PROFILE_APOL_APOTEK || {}

    setLSIfDefined('apol_kode_faskes', a.KODE_FASKES)
    setLSIfDefined('apol_consid', a.CONSID)
    setLSIfDefined('apol_scret_key', a.SCRET_KEY)
    setLSIfDefined('apol_user_key', a.USER_KEY)
    setLSIfDefined('apol_url_apol', a.URL_APOL)
    return a
  } catch (error) {
    // console.error('Auth error:', error)
    return null
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const jamServerCheck = await check_jam_server_dan_local()
    if (jamServerCheck == false) {
      // Lanjutkan proses login
      return
    }
    const url = configStore.apiApotikUrl
    const payload = { USERNAME: formData.name, PWD: formData.password }

    const endpoint = '/index.php/api/apotek/auth/login'

    const response = await axios.post(`${url}${endpoint}`, payload)

    if (response.data.metadata?.code === 200) {
      toast.add({
        severity: 'success',
        summary: 'Login Berhasil',
        detail: `Selamat datang, ${response.data.response.NAMA_USER}`,
        life: 3000,
      })

      const userData = response.data.response

      // Remember Me
      if (rememberMe.value) {
        localStorage.setItem('rm_username', formData.name)
        localStorage.setItem('rm_password', formData.password)
        localStorage.setItem('rm_flag', '1')
      } else {
        localStorage.removeItem('rm_username')
        localStorage.removeItem('rm_password')
        localStorage.removeItem('rm_flag')
      }

      // Simpan token dari login apotek — dipakai interceptor axios global (lihat main.js)
      // buat nyisipin Authorization Bearer ke semua request ke apiApotikUrl.
      if (response.data.metadata?.token) {
        localStorage.setItem('apotekToken', response.data.metadata.token)
      }

      // 1. Save basic data to localStorage dan authStore FIRST
      localStorage.setItem('loggedIn', 'true')
      localStorage.setItem('id_client', userData.ID_CLIENT)
      localStorage.setItem('user_name', userData.NAMA_USER)
      localStorage.setItem('user_id', formData.name)

      // IS_OWNER dari m_login_apotek (login balikin seluruh baris minus PWD) — gerbang akses
      // layar Client Registration, lihat router beforeEach. Owner sungguhan biasanya IS_OWNER=1
      // TAPI ID_CLIENT-nya sendiri null/tidak terikat client manapun (lihat authStore.setIsOwner).
      authStore.setIsOwner(userData.IS_OWNER == 1 || userData.IS_OWNER === true)

      // 2. Set minimal user data to authStore first (so id_client is available)
      authStore.setIdClient(
        userData.ID_CLIENT,
        userData.NAMA_USER,
        formData.name,
        userData.NAMA_APOTEK || 'Apotek',
        userData.ALAMAT || '',
        userData.LINK_LOGO || '',
        userData.ID_LOKASI,
        userData.DISABLE_JIKA_SEDIAAN_NOL || userData.disable_jika_sediaan_nol,
      )

      // 3. Build complete user object — response login baru cuma punya ID, ID_CLIENT,
      // USERNAME, NAMA_USER, PROFESI, NO_SIPA, STATUS (bukan lagi field-field RS kayak
      // KDJABATAN/ID_LOKASI_INV/GROUP_USER/NIP/KD_DOKTER), jadi penugasan layanan
      // (fetchJabatanById/fetchLokasiById) dihapus juga.
      const userObject = {
        user_id: userData.USERNAME,
        user_name: userData.NAMA_USER,
        profesi: userData.PROFESI,
        no_sipa: userData.NO_SIPA,
        id_client: userData.ID_CLIENT,
      }

      // 4. Update authStore with complete user data
      authStore.setUserData(userObject)

      // 5. Wait for all profile data to be fetched
      const [rsProfile] = await Promise.all([
        profile_apotek(userData.ID_CLIENT),
        profile_apol(userData.ID_CLIENT),
      ])

      // 6. Update NAMA_APOTEK in authStore if fetch succeeded
      if (rsProfile?.NAMA_APOTEK) {
        authStore.company = rsProfile.NAMA_APOTEK
        localStorage.setItem('NAMA_APOTEK', rsProfile.NAMA_APOTEK)

        authStore.LINK_LOGO = rsProfile.LINK_LOGO
        authStore.tampilkan_no_urutan_display =
          rsProfile.TAMPILKAN_NO_URUTAN_DISPLAY !== undefined
            ? rsProfile.TAMPILKAN_NO_URUTAN_DISPLAY
            : 0
      }

      // Hapus idle timer lama agar checkOnMount di MainLayouts tidak menganggap sesi expired
      localStorage.removeItem('idle_last_activity')

      // 8. Finally redirect after everything is ready
      await router.push('/manajemen/client-registration/list')
    } else {
      throw new Error(response.data.metadata?.message || 'Authentication failed')
    }
  } catch (error) {
    // console.error('Auth error:', error)

      let errorMessage = 'Terjadi kesalahan saat login'

      // 401 sekarang bisa dua pesan beda dari server — salah username/password ATAU akses
      // client-nya dinonaktifkan owner (STATUS_AKSES=0, lihat api_apotek.md) — jadi pesan
      // ASLI dari metadata.message dipakai kalau ada, bukan di-hardcode satu pesan generik lagi.
      const serverMessage = error.response?.data?.metadata?.message
      if (error.response?.status === 401) {
        errorMessage = serverMessage || 'Username atau password salah'
      } else if (error.response?.status === 409) {
        errorMessage = 'Email sudah terdaftar'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server sedang bermasalah, coba lagi nanti'
      } else if (serverMessage) {
        errorMessage = serverMessage
      }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  startTicker()
  if (localStorage.getItem('rm_flag') === '1') {
    formData.name = localStorage.getItem('rm_username') || ''
    formData.password = localStorage.getItem('rm_password') || ''
    rememberMe.value = true
  }
})
</script>

<style scoped>
/* ── Root page ── */
.login-page {
  min-height: 100vh;
  background: var(--sky-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family);
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

/* ══════════════════════════════════════════════════════════
   LATAR: pola titik (warna dasar halaman satu warna rata, tanpa gradasi)
══════════════════════════════════════════════════════════ */
.bg-dots {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1.4px);
  background-size: 26px 26px;
}

/* ══════════════════════════════════════════════════════════
   TICKER BACKGROUND
══════════════════════════════════════════════════════════ */
.ticker-bg {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  z-index: 0;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.9) 12%, rgba(0, 0, 0, 0.9) 88%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.9) 12%, rgba(0, 0, 0, 0.9) 88%, transparent 100%);
}

.ticker-row {
  flex: 1;
  position: relative;
  overflow: hidden;
  width: 100%;
  /* tepi kiri/kanan memudar — kotak "muncul" dan "hilang" halus, bukan terpotong */
  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%);
  mask-image: linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%);
}

/* Disembunyikan sampai posisi awal dihitung (mencegah kotak menumpuk di kiri sesaat). */
.ticker-bg:not(.is-ready) .ticker-box { visibility: hidden; }

/* Kotak = sel penempatan (lebarnya diatur skrip); tampilannya ada di .ticker-chip. */
.ticker-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  will-change: transform;
}

.ticker-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px 12px 14px;
  white-space: nowrap;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(3, 20, 45, 0.18);
}

.tb-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.14);
  flex-shrink: 0;
}
.tb-icon {
  font-size: 1rem;
  color: rgba(224, 242, 254, 0.98);
}
.tb-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tb-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.2;
}
.tb-sub {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.2;
}

/* ══════════════════════════════════════════════════════════
   LOGIN CARD
══════════════════════════════════════════════════════════ */
.login-card {
  background: rgba(255, 255, 255, 0.94);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  box-shadow:
    0 30px 80px rgba(3, 25, 55, 0.45),
    0 8px 24px rgba(3, 25, 55, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  width: 100%;
  max-width: 430px;
  padding: 2rem 2.25rem 1.5rem;
  text-align: center;
  color: var(--color-heading);
  position: relative;
  z-index: 1;
  overflow: hidden;
  animation: card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.logo-section {
  margin-bottom: 0.8rem;
}
.logo {
  display: block;
  width: 100%;
  height: auto;
  max-width: 240px;
  max-height: 140px;
  object-fit: contain;
  margin: 0 auto;
}

.welcome {
  margin-bottom: 1.2rem;
}
.welcome-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--color-heading);
}
.welcome-sub {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.form-group {
  text-align: left;
}
label {
  font-size: var(--font-size-sm);
  margin-bottom: 0.4rem;
  display: block;
  color: var(--color-text);
  font-weight: 600;
}

.input-wrap {
  position: relative;
}
.field-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.95rem;
  color: var(--color-placeholder);
  pointer-events: none;
  transition: color var(--transition-fast);
}
.input-wrap:focus-within .field-icon {
  color: var(--sky-600);
}

input {
  width: 100%;
  height: 44px;
  padding: 0 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: var(--font-size-base);
  outline: none;
  color: var(--color-heading);
  background: var(--surface-50);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
  font-family: var(--font-family);
}
.input-wrap input {
  padding-left: 2.75rem;
  padding-right: 2.75rem;
}
input:hover {
  border-color: var(--surface-300);
}
input:focus {
  background: var(--surface-0);
  border-color: var(--sky-500);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sky-500) 18%, transparent);
}

.toggle-icon {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-placeholder);
  font-size: 1rem;
  transition: color var(--transition-fast), background var(--transition-fast);
}
.toggle-icon:hover {
  color: var(--sky-600);
  background: var(--sky-50);
}

.remember-row {
  display: flex;
  align-items: center;
  margin-top: -0.2rem;
}
.remember-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
  margin: 0;
  user-select: none;
}
input.remember-check:focus,
input.remember-check:hover {
  box-shadow: none;
  background: transparent;
  border: none;
}
.remember-check {
  width: 16px;
  height: 16px;
  accent-color: var(--sky-500);
  cursor: pointer;
  margin: 0;
  padding: 0;
  border: none;
  box-shadow: none;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 46px;
  margin-top: 0.3rem;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 700;
  font-size: var(--font-size-md);
  letter-spacing: 0.01em;
  cursor: pointer;
  background: linear-gradient(135deg, var(--sky-500) 0%, var(--sky-600) 100%);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--sky-600) 45%, transparent);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), filter var(--transition-fast);
  font-family: var(--font-family);
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--sky-600) 55%, transparent);
  filter: brightness(1.05);
}
.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}
.btn-arrow {
  font-size: 0.85rem;
  transition: transform var(--transition-fast);
}
.btn-submit:hover:not(:disabled) .btn-arrow {
  transform: translateX(3px);
}
.btn-submit:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--sky-500) 40%, transparent);
  outline-offset: 2px;
}
.btn-submit:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  display: inline-block;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.footer-text {
  margin: 1.2rem 0 0;
  padding-top: 0.9rem;
  border-top: 1px solid var(--color-border-light);
  font-size: var(--font-size-xs);
  color: var(--color-placeholder);
  line-height: 1.5;
}

@media (max-width: 480px) {
  .ticker-bg { display: none; }
  .login-card { padding: 2rem 1.4rem 1.5rem; border-radius: 20px; }
}

/* Hormati preferensi "kurangi gerakan": matikan animasi dekoratif. */
@media (prefers-reduced-motion: reduce) {
  .login-card { animation: none; }
}
</style>
