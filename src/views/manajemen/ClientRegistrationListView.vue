<template>
  <div class="content">
    <loading_overlay :is-loading="loading" message="Memuat..." />
    <!-- MENU AKSI (dipakai bareng oleh tombol "Aksi" di tiap baris) — pola sama dengan
         ObatListView.vue: 1 trigger per baris, semua aksi (termasuk yang tadinya ikon
         terpisah) ada di dalam popup, bukan split-button berjejer di kolom AKSI. -->
    <Menu ref="aksiMenuRef" :model="aksiMenuModel" popup class="aksi-menu" />

    <AppPageHeader
      title="Client Registration"
      subtitle="Kelola pendaftaran & konfigurasi apotek (client) baru"
      icon="fas fa-store"
    >
      <template #actions>
        <Button icon="pi pi-plus" label="Tambah Client Baru" size="small" @click="navigateToNew()" />
      </template>
    </AppPageHeader>

    <div class="kn-stats">
      <AppStatCard compact label="Total Client" :value="clients.length" icon="pi pi-building" color="sky" />
      <AppStatCard compact label="Ditampilkan" :value="filteredClients.length" icon="pi pi-filter" color="slate" />
    </div>

    <!-- FILTER BAR -->
    <div class="cr-filter-bar">
      <div class="cr-filter-group">
        <span class="cr-filter-label"><i class="pi pi-search"></i>Cari</span>
        <InputText
          v-model="search"
          placeholder="Cari ID client, nama apotek, atau alamat..."
          style="min-width: 280px"
          :disabled="loading"
        />
      </div>
      <div class="cr-filter-actions">
        <Button size="small"
          icon="pi pi-refresh"
          label="Refresh"
          severity="secondary"
          outlined
          :loading="loading"
          @click="fetchClients()"
        />
      </div>
    </div>

    <!-- TABLE -->
    <div class="cr-table-wrap">
      <DataTable
        :value="filteredClients"
        :loading="loading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        sortField="_idNum"
        :sortOrder="1"
        showGridlines
        rowHover
        size="small"
        class="cr-datatable"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Data {first} sampai {last} dari {totalRecords} client"
      >
        <template #empty>
          <div class="cr-empty">
            <div class="cr-empty-icon"><i class="fas fa-inbox"></i></div>
            <p class="cr-empty-title">Belum ada data client</p>
            <small>Klik tombol "Tambah Client Baru" untuk mendaftarkan apotek baru</small>
          </div>
        </template>

        <template #loading>
          <div class="p-4 text-center">
            <i class="pi pi-spin pi-spinner me-2"></i> Memuat data...
          </div>
        </template>

        <Column header="#" style="width: 40px; text-align: center">
          <template #body="{ index }">
            <span style="font-size: 11px; color: #94a3b8">{{ index + 1 }}</span>
          </template>
        </Column>

        <Column header="ID CLIENT" style="width: 100px" sortable sortField="_idNum">
          <template #body="{ data }">
            <span class="mono fw-semibold" style="color: var(--sky-600)">{{ rowId(data) }}</span>
          </template>
        </Column>

        <Column header="NAMA APOTEK" sortable sortField="NAMA_APOTEK">
          <template #body="{ data }">
            <span style="font-size: 12px; font-weight: 600; color: #1e293b">{{ displayNama(data) }}</span>
          </template>
        </Column>

        <Column header="TIPE" style="width: 90px" sortable sortField="TIPE_KLIEN">
          <template #body="{ data }">
            <span class="status-badge" :class="data.TIPE_KLIEN === 'GROSIR' ? 'status-badge-warn' : 'status-badge-neutral'">
              <span class="status-dot"></span>{{ data.TIPE_KLIEN === 'GROSIR' ? 'Grosir' : 'Apotek' }}
            </span>
          </template>
        </Column>

        <Column header="ALAMAT">
          <template #body="{ data }">
            <span :title="displayAlamat(data)" style="font-size: 12px; color: #475569">
              {{ displayAlamat(data) }}
            </span>
          </template>
        </Column>

        <Column header="LANGGANAN" style="width: 165px" sortable sortField="SUBSCRIPTION_STATUS">
          <template #body="{ data }">
            <div class="badge-cell">
              <span class="status-badge" :class="subscriptionBadgeClass(data)">
                <span class="status-dot"></span>{{ subscriptionLabel(data) }}
              </span>
              <small v-if="subscriptionSubtext(data)" class="badge-sub">{{ subscriptionSubtext(data) }}</small>
            </div>
          </template>
        </Column>

        <Column header="BERAKHIR" style="width: 110px">
          <template #body="{ data }">
            <span class="mono" style="font-size: 12px; color: #475569">{{ formatTanggal(data.SUBSCRIPTION_BERAKHIR) }}</span>
          </template>
        </Column>

        <!-- STATUS_AKSES independen dari SUBSCRIPTION_STATUS — owner boleh saja biarin akses
             aktif walau subscription EXPIRED (grace period), makanya dua kolom terpisah. -->
        <Column header="AKSES" style="width: 100px" sortable sortField="STATUS_AKSES">
          <template #body="{ data }">
            <span class="status-badge" :class="isAksesAktif(data) ? 'status-badge-success' : 'status-badge-danger'">
              <span class="status-dot"></span>{{ isAksesAktif(data) ? 'Aktif' : 'Nonaktif' }}
            </span>
          </template>
        </Column>

        <Column header="AKSI" style="width: 90px">
          <template #body="{ data }">
            <Button
              label="Aksi"
              icon="pi pi-chevron-down"
              iconPos="right"
              size="small"
              outlined
              severity="secondary" class="aksi-menu-btn"
              :loading="togglingAccessId === rowId(data)"
              @click="toggleAksiMenu($event, clientAksiItems(data))"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <ConfirmDialog />

    <!-- ══ DIALOG PERPANJANG LANGGANAN ══ -->
    <Dialog
      v-model:visible="showSubscriptionDialog"
      :header="`Langganan — ${subscriptionClientName}`"
      :modal="true"
      :style="{ width: '44rem' }"
    >
      <div v-if="subscriptionLoading" class="p-3 text-center" style="color: #94a3b8">
        <i class="pi pi-spin pi-spinner me-1"></i> Memuat riwayat langganan...
      </div>
      <DataTable v-else :value="subscriptionHistory" size="small" responsiveLayout="scroll" class="mb-3">
        <Column field="TANGGAL_MULAI" header="Mulai" />
        <Column field="TANGGAL_BERAKHIR" header="Berakhir" />
        <Column field="PAKET" header="Paket" />
        <Column header="Harga">
          <template #body="{ data }">{{ formatRupiah(data.HARGA) }}</template>
        </Column>
        <Column header="" style="width: 90px">
          <template #body="{ data }">
            <Button size="small" text icon="pi pi-print" label="Invoice" @click="printInvoice(data, subscriptionClient)" />
          </template>
        </Column>
        <template #empty>
          <div class="p-3 text-center" style="color: #94a3b8">Belum ada riwayat langganan.</div>
        </template>
      </DataTable>
      <hr />
      <p class="info-note">
        Baris baru dipakai untuk pendaftaran pertama maupun perpanjangan — riwayat lama tidak pernah ditimpa.
        Kosongkan Tanggal Mulai supaya server otomatis menyambung dari langganan aktif terakhir (atau hari ini
        kalau ini yang pertama).
      </p>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Tanggal Mulai <small class="text-muted">(opsional)</small></label>
          <DatePicker
            v-model="subscriptionForm.TANGGAL_MULAI"
            dateFormat="yy-mm-dd"
            showIcon
            class="w-100"
            :disabled="subscriptionSaving"
          />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Tanggal Berakhir <span class="required">*</span></label>
          <DatePicker
            v-model="subscriptionForm.TANGGAL_BERAKHIR"
            dateFormat="yy-mm-dd"
            showIcon
            class="w-100"
            :disabled="subscriptionSaving"
          />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Paket</label>
          <InputText
            v-model="subscriptionForm.PAKET"
            class="form-control w-100"
            placeholder="mis. Tahunan"
            :disabled="subscriptionSaving"
          />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Harga</label>
          <InputNumber
            v-model="subscriptionForm.HARGA"
            class="w-100"
            mode="currency"
            currency="IDR"
            locale="id-ID"
            :disabled="subscriptionSaving"
          />
        </div>
        <div class="col-md-12 mb-2">
          <label class="form-label">Catatan</label>
          <InputText v-model="subscriptionForm.CATATAN" class="form-control w-100" :disabled="subscriptionSaving" />
        </div>
      </div>
      <template #footer>
        <Button size="small" label="Tutup" severity="secondary" outlined @click="showSubscriptionDialog = false" :disabled="subscriptionSaving" />
        <Button size="small"
          label="Simpan Langganan"
          icon="pi pi-save"
          @click="submitSubscriptionFromList()"
          :loading="subscriptionSaving"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import axios from 'axios'
import { useConfigStore } from '@/stores/config'
import { useClientSubscription } from '@/composables/useClientSubscription'
import DatePicker from 'primevue/datepicker'
import ConfirmDialog from 'primevue/confirmdialog'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const configStore = useConfigStore()

// Kontrak: lihat api_apotek.md — GET/POST /api/apotek/ClientRegistration/*
const apiUrl = computed(() => `${configStore.apiApotikUrl}/index.php/api/apotek/ClientRegistration`)

const clients = ref([])
const loading = ref(false)
const search = ref('')

const showSuccess = (msg) =>
  toast.add({ severity: 'success', summary: 'Berhasil', detail: msg, life: 3000 })
const showError = (msg) =>
  toast.add({ severity: 'error', summary: 'Gagal', detail: msg, life: 5000 })

// Kontrak persis GET list: [{ ID_CLIENT: "40" (string!), NAMA_APOTEK, ALAMAT (nullable) }].
// rowId() balikin number (dipakai buat route param & perbandingan) — kalau field ini kosong,
// tombol Edit akan lempar ke /form/undefined dan malah kebuka sebagai wizard "Tambah Client
// Baru" alih-alih mode edit, jadi navigateToEdit() dikasih guard terpisah buat kasus ini.
const rowId = (c) => (c?.ID_CLIENT != null ? Number(c.ID_CLIENT) : null)
const displayNama = (c) => c?.NAMA_APOTEK ?? '-'
const displayAlamat = (c) => c?.ALAMAT ?? '-'
// STATUS_AKSES baru ada di response mulai sekarang — kalau field-nya belum ke-deploy di backend
// (undefined), anggap aktif (fail-open di FE, sama kayak SUBSCRIPTION_STATUS yang cuma info)
// biar client lama yang belum punya baris ini di response tetap kebaca normal, bukan ke-flag
// nonaktif secara keliru. Cuma STATUS_AKSES === 0 eksplisit yang dianggap nonaktif.
const isAksesAktif = (c) => Number(c?.STATUS_AKSES ?? 1) !== 0

// SUBSCRIPTION_STATUS cuma informasi (badge), tidak memblokir apa pun — lihat api_apotek.md.
// "Segera Berakhir" bukan dari backend — dihitung sendiri di FE dari SUBSCRIPTION_BERAKHIR
// (tanggal exact-nya udah ada di response list), gak perlu endpoint/field baru dari BE.
const EXPIRING_SOON_THRESHOLD_DAYS = 7
const daysUntilExpiry = (c) => {
  if (!c?.SUBSCRIPTION_BERAKHIR) return null
  // Bandingkan cuma tanggal (bukan jam) — parse manual "YYYY-MM-DD..." biar gak kena geser
  // timezone dari `new Date(dateString)` (yang nganggep string tsb UTC tengah malam).
  const [y, m, d] = c.SUBSCRIPTION_BERAKHIR.slice(0, 10).split('-').map(Number)
  const expiry = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((expiry - today) / 86400000)
}
const isExpiringSoon = (c) => {
  if (c?.SUBSCRIPTION_STATUS !== 'AKTIF') return false
  const days = daysUntilExpiry(c)
  return days !== null && days <= EXPIRING_SOON_THRESHOLD_DAYS
}
// Kelas badge custom (bukan severity PrimeVue Tag lagi) — lihat .status-badge di <style>.
const subscriptionBadgeClass = (c) => {
  if (c?.SUBSCRIPTION_STATUS === 'EXPIRED') return 'status-badge-danger'
  if (c?.SUBSCRIPTION_STATUS === 'AKTIF') return isExpiringSoon(c) ? 'status-badge-warn' : 'status-badge-success'
  return 'status-badge-neutral' // BELUM_ADA
}
// Label badge sengaja SINGKAT (jumlah hari dipindah ke subscriptionSubtext()) — badge yang
// kepanjangan ("Segera Berakhir (hari ini)") yang bikin dia wrap 2 baris & kelihatan berat.
const subscriptionLabel = (c) => {
  if (c?.SUBSCRIPTION_STATUS === 'EXPIRED') return 'Expired'
  if (c?.SUBSCRIPTION_STATUS === 'AKTIF') return isExpiringSoon(c) ? 'Segera Berakhir' : 'Aktif'
  return 'Belum Ada'
}
// Teks kecil di bawah badge, cuma muncul kalau lagi segera berakhir — null = tidak ditampilkan.
const subscriptionSubtext = (c) => {
  if (!isExpiringSoon(c)) return null
  const days = daysUntilExpiry(c)
  return days <= 0 ? 'Berakhir hari ini' : `${days} hari lagi`
}

// "2027-09-03..." -> "3 Sep 2027". Fallback ke string mentah kalau formatnya di luar dugaan,
// biar tidak pernah nampilin "Invalid Date" ke user.
const formatTanggal = (isoDate) => {
  if (!isoDate) return '-'
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const filteredClients = computed(() => {
  if (!search.value.trim()) return clients.value
  const q = search.value.trim().toLowerCase()
  return clients.value.filter((c) =>
    [String(rowId(c) ?? ''), displayNama(c), displayAlamat(c)].some((v) =>
      (v || '').toLowerCase().includes(q),
    ),
  )
})

const fetchClients = async () => {
  loading.value = true
  try {
    const { data } = await axios.get(`${apiUrl.value}/list`)
    // ID_CLIENT balik sebagai STRING dari GET list (bawaan mysqli, kolom INT nggak di-cast) —
    // kalau dipakai langsung buat sortField, DataTable ngurutin lexicographic ("10" < "2").
    // Simpan versi number-nya sekali di sini biar sort kolom ID Client benar secara numerik.
    clients.value = (data?.response || []).map((c) => ({ ...c, _idNum: Number(c.ID_CLIENT) }))
  } catch (error) {
    console.error('Error fetching clients:', error)
    showError(error?.response?.data?.metadata?.message || 'Gagal mengambil data client')
  } finally {
    loading.value = false
  }
}

const navigateToNew = () => {
  router.push({ name: 'ClientRegistrationFormView' })
}

const navigateToEdit = (idClient) => {
  if (idClient == null) {
    showError('ID client tidak ditemukan pada baris ini — cek response GET /list')
    return
  }
  router.push({ name: 'ClientRegistrationFormEditView', params: { clientId: idClient } })
}

// ══ TOGGLE STATUS_AKSES — POST /api/apotek/clientregistration/access ══
// Efeknya real-time & cukup drastis (semua sesi aktif client itu ke-401 di request berikutnya),
// jadi selalu konfirmasi dulu — terutama buat "Matikan" yang bisa nendang user di tengah kerja.
const togglingAccessId = ref(null)

const toggleAccess = async (client) => {
  const id = rowId(client)
  const nextStatus = isAksesAktif(client) ? 0 : 1
  togglingAccessId.value = id
  try {
    const { data } = await axios.post(`${apiUrl.value}/access`, { IDCLIENT: id, STATUS_AKSES: nextStatus })
    if (data?.metadata?.code && data.metadata.code !== 200) {
      showError(data.metadata.message || 'Gagal mengubah status akses')
      return
    }
    showSuccess(nextStatus === 1 ? 'Akses client berhasil diaktifkan' : 'Akses client berhasil dimatikan')
    // Patch langsung di memori (hindari fetchClients() ulang cuma buat 1 field) — cukup akurat
    // karena request di atas sudah nunggu sukses duluan.
    const row = clients.value.find((c) => rowId(c) === id)
    if (row) row.STATUS_AKSES = nextStatus
  } catch (error) {
    console.error('Error toggling client access:', error)
    showError(error?.response?.data?.metadata?.message || 'Gagal mengubah status akses')
  } finally {
    togglingAccessId.value = null
  }
}

const confirmToggleAccess = (client) => {
  const aktif = isAksesAktif(client)
  confirm.require({
    message: aktif
      ? `Matikan akses "${displayNama(client)}"? Semua sesi yang lagi login di client ini langsung ke-logout paksa di request berikutnya, walau belum logout manual.`
      : `Aktifkan kembali akses "${displayNama(client)}"? User di client ini bisa login lagi setelah ini.`,
    header: aktif ? 'Konfirmasi Matikan Akses' : 'Konfirmasi Aktifkan Akses',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: aktif ? 'p-button-danger' : 'p-button-success',
    acceptLabel: aktif ? 'Ya, Matikan' : 'Ya, Aktifkan',
    rejectLabel: 'Batal',
    accept: () => toggleAccess(client),
  })
}

// ══ MENU AKSI (1 trigger per baris, popup) — pola sama dgn ObatListView.vue ══
const aksiMenuRef = ref(null)
const aksiMenuModel = ref([])
function toggleAksiMenu(event, items) {
  aksiMenuModel.value = items
  aksiMenuRef.value.toggle(event)
}

function clientAksiItems(data) {
  const aktif = isAksesAktif(data)
  return [
    {
      label: aktif ? 'Matikan Akses' : 'Aktifkan Akses',
      icon: aktif ? 'pi pi-lock' : 'pi pi-lock-open',
      class: aktif ? 'aksi-item-danger' : 'aksi-item-success',
      command: () => confirmToggleAccess(data),
    },
    {
      label: 'Perpanjang Langganan',
      icon: 'pi pi-calendar-plus',
      class: 'aksi-item-help',
      command: () => openSubscriptionDialog(data),
    },
    { separator: true },
    {
      label: 'Edit / Detail',
      icon: 'pi pi-pencil',
      class: 'aksi-item-warn',
      command: () => navigateToEdit(rowId(data)),
    },
  ]
}

// ══ DIALOG PERPANJANG LANGGANAN — akses cepat tanpa masuk ke wizard edit client ══
const {
  history: subscriptionHistory,
  loading: subscriptionLoading,
  saving: subscriptionSaving,
  form: subscriptionForm,
  fetchHistory: fetchSubscriptionHistory,
  submit: submitSubscriptionForm,
  formatRupiah,
  printInvoice,
} = useClientSubscription()

const showSubscriptionDialog = ref(false)
const subscriptionClientId = ref(null)
const subscriptionClientName = ref('')
const subscriptionClient = ref(null)

const openSubscriptionDialog = (row) => {
  const id = rowId(row)
  if (id == null) {
    showError('ID client tidak ditemukan pada baris ini — cek response GET /list')
    return
  }
  subscriptionClientId.value = id
  subscriptionClientName.value = displayNama(row)
  subscriptionClient.value = row
  showSubscriptionDialog.value = true
  fetchSubscriptionHistory(id)
}

const submitSubscriptionFromList = async () => {
  const ok = await submitSubscriptionForm(subscriptionClientId.value)
  // Refresh badge LANGGANAN/BERAKHIR di tabel — dialog sengaja tidak ditutup otomatis, biar
  // owner bisa langsung lihat riwayat barunya atau lanjut input lagi kalau perlu.
  if (ok) await fetchClients()
}

onMounted(() => {
  fetchClients()
})
</script>

<style scoped>
.kn-stats { display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,220px));gap:var(--space-3);margin-bottom:var(--space-3); }
/* ── HERO ── */
/* ── STAT STRIP ── */
/* ── FILTER BAR ── */
.cr-filter-bar { display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:var(--color-card);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4); }
.cr-filter-group { display:flex;align-items:center;gap:6px; }
.cr-filter-label { font-size:11px;font-weight:600;color:#64748b;display:flex;align-items:center;gap:3px;white-space:nowrap; }
.cr-filter-actions { display:flex;align-items:center;gap:6px; }

/* ── TABLE ── */
.cr-table-wrap { background:var(--color-card);border:1px solid var(--color-border);border-top:3px solid var(--sky-500);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);overflow:hidden; }
:deep(.cr-datatable .p-datatable-tbody > tr:hover > td) { background:var(--sky-50) !important; }

/* ── EMPTY ── */
.cr-empty { text-align:center;padding:40px 20px;color:#94a3b8; }
.cr-empty-icon { font-size:36px;margin-bottom:10px;color:#cbd5e1; }
.cr-empty-title { font-size:13px;font-weight:600;color:#64748b;margin:0 0 4px; }

/* ── STATUS BADGES (LANGGANAN & AKSES) — pill lembut + dot, ganti <Tag> default PrimeVue
   yang bloknya berat & wrap 2 baris kalau teksnya panjang. ── */
.badge-cell { display:flex;flex-direction:column;gap:2px;align-items:flex-start; }
.status-badge {
  display:inline-flex;align-items:center;gap:5px;
  padding:3px 9px;border-radius:999px;
  font-size:10.5px;font-weight:700;letter-spacing:.2px;
  line-height:1.5;white-space:nowrap;
}
.status-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }
.badge-sub { font-size:10px;color:#94a3b8;padding-left:2px; }

.status-badge-success { background:#ecfdf5;color:#059669; }
.status-badge-success .status-dot { background:#10b981; }

.status-badge-warn { background:#fffbeb;color:#b45309; }
.status-badge-warn .status-dot { background:#f59e0b; }

.status-badge-danger { background:#fef2f2;color:#dc2626; }
.status-badge-danger .status-dot { background:#ef4444; }

.status-badge-neutral { background:#f1f5f9;color:#64748b; }
.status-badge-neutral .status-dot { background:#94a3b8; }

/* ── MENU AKSI — satu tombol "Aksi" yang buka popup, bukan split-action berjejer. Pola & warna
   sama persis dengan ObatListView.vue biar konsisten di seluruh app. Menu popup-nya di-teleport
   ke <body> oleh PrimeVue, makanya style warna tiap item pakai :global() — :deep() saja tidak
   nyampe karena sudah keluar dari subtree yang discope. ── */
.aksi-menu-btn { padding:0.15rem 0.55rem !important;font-size:11px !important;height:1.6rem !important;min-height:unset !important;border-radius:6px !important; }
:global(.aksi-item-info .p-menu-item-icon),
:global(.aksi-item-info .p-menu-item-label) { color:#0288d1 !important; }
:global(.aksi-item-help .p-menu-item-icon),
:global(.aksi-item-help .p-menu-item-label) { color:#7c3aed !important; }
:global(.aksi-item-warn .p-menu-item-icon),
:global(.aksi-item-warn .p-menu-item-label) { color:#d97706 !important; }
:global(.aksi-item-success .p-menu-item-icon),
:global(.aksi-item-success .p-menu-item-label) { color:#16a34a !important; }
:global(.aksi-item-danger .p-menu-item-icon),
:global(.aksi-item-danger .p-menu-item-label) { color:#dc2626 !important; }
:global(.aksi-menu .p-menu-item:not(.p-disabled) .p-menu-item-content:hover),
:global(.aksi-menu .p-menu-item.p-focus .p-menu-item-content) { background:#f1f5f9 !important; }

/* ── DIALOG PERPANJANG LANGGANAN ── */
.form-label { font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;display:block; }
.required { color:#dc2626; }
.form-control { font-size:14px;border:1px solid #e5e7eb;border-radius:4px;padding:0.5rem 0.75rem;height:auto; }
.info-note { font-size:11.5px;color:#6b7280;margin:0 0 10px;line-height:1.5; }

/* ── MISC ── */
.mono { font-family:monospace;font-size:12px; }
</style>
