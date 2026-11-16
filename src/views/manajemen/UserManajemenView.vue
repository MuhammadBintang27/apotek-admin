<template>
  <div class="content">
    <AppPageHeader
      title="Manajemen User"
      :subtitle="isOwner ? 'Owner: kelola user di semua client, dikelompokkan per client' : 'Kelola akun pengguna apotek — user baru otomatis masuk ke client Anda sendiri'"
      icon="fas fa-users-cog"
    >
      <template #actions>
        <Button label="Assign Menu" icon="pi pi-sitemap" size="small" severity="secondary" outlined @click="router.push('/manajemen/assign-menu')" />
        <Button label="Tambah User" icon="pi pi-plus" size="small" @click="openAddDialog" />
      </template>
    </AppPageHeader>

    <div class="kn-stats">
      <AppStatCard compact label="Total User" :value="users.length" icon="pi pi-users" color="sky" />
      <AppStatCard v-if="isOwner" compact label="Total Client" :value="clients.length" icon="pi pi-building" color="slate" />
    </div>

    <!-- Table -->
    <div class="um-filter-bar">
      <Select
        v-if="isOwner"
        v-model="clientFilter"
        :options="clients"
        optionLabel="NAMA_APOTEK"
        optionValue="ID_CLIENT"
        placeholder="Semua Client"
        showClear
        filter
        class="client-filter-select"
      />
      <span class="p-input-icon-left search-wrap">
        <i class="pi pi-search" />
        <InputText v-model="globalFilter" placeholder="Cari nama / username..." class="search-input" />
      </span>
    </div>

    <div class="table-card">
      <DataTable
        :value="displayUsers"
        :loading="loading"
        :paginator="!isGrouped"
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50]"
        showGridlines
        class="user-table"
        size="small"
        :rowGroupMode="isGrouped ? 'subheader' : null"
        :groupRowsBy="isGrouped ? 'ID_CLIENT' : null"
      >
        <template v-if="isGrouped" #groupheader="{ data }">
          <span class="group-header">
            <i class="pi pi-building"></i>
            {{ clientLabel(data.ID_CLIENT) }}
            <span class="group-count">{{ countInClient(data.ID_CLIENT) }} user</span>
          </span>
        </template>
        <Column field="NAMA_USER" header="Nama User" sortable style="min-width: 160px" />
        <Column field="USERNAME" header="Username" sortable style="min-width: 130px" />
        <Column field="PROFESI" header="Profesi" style="min-width: 120px" />
        <Column field="NO_SIPA" header="No. SIPA" style="min-width: 120px" />
        <Column header="Lokasi" style="min-width: 140px">
          <template #body="{ data }">
            <span>{{ lokasiLabel(data.ID_LOKASI, data.NAMA_LOKASI) }}</span>
          </template>
        </Column>
        <Column header="Status" style="min-width: 90px; text-align:center">
          <template #body="{ data }">
            <Tag :severity="isTruthy(data.STATUS) ? 'success' : 'danger'" :value="isTruthy(data.STATUS) ? 'Aktif' : 'Nonaktif'" />
          </template>
        </Column>
        <Column field="LAST_LOGIN" header="Login Terakhir" style="min-width: 140px">
          <template #body="{ data }">
            <span>{{ data.LAST_LOGIN || '-' }}</span>
          </template>
        </Column>
        <Column header="Aksi" style="min-width: 90px; text-align:center">
          <template #body="{ data }">
            <div class="action-btns">
              <Button
                icon="pi pi-pencil"
                size="small"
                text
                severity="info"
                @click="openEditDialog(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                text
                severity="danger"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
        <template #empty>
          <div class="table-empty"><i class="pi pi-inbox" /> Tidak ada data user</div>
        </template>
      </DataTable>
    </div>

    <!-- Form Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="isEdit ? 'Edit User' : 'Tambah User Baru'"
      :modal="true"
      :closable="true"
      :style="{ width: '520px', maxWidth: '95vw' }"
      class="user-dialog"
    >
      <div class="form-grid">
        <div class="field" v-if="isOwner">
          <label>Client <span class="required">*</span></label>
          <Select
            v-model="form.ID_CLIENT"
            :options="clients"
            optionLabel="NAMA_APOTEK"
            optionValue="ID_CLIENT"
            placeholder="Pilih client..."
            class="w-full"
            :disabled="isEdit"
            filter
          />
          <small v-if="isEdit" class="form-hint">Client tidak bisa dipindah dari sini.</small>
        </div>
        <div class="field">
          <label>Nama User <span class="required">*</span></label>
          <InputText v-model="form.NAMA_USER" class="w-full" placeholder="Nama lengkap" />
        </div>
        <div class="field">
          <label>Username <span class="required">*</span></label>
          <!-- Backend nempelin prefix "{ID_CLIENT}-" otomatis (lihat M_user_apotek::build_username())
               supaya USERNAME yang unik-global tidak bentrok antar client (mis. client 1 & 2
               dua-duanya mau "bintang") — FE cuma nampilin prefix-nya, user cukup ketik sisanya. -->
          <InputText v-if="isEdit" v-model="form.USERNAME" class="w-full" disabled />
          <InputGroup v-else>
            <InputGroupAddon>{{ usernamePrefix || '?-' }}</InputGroupAddon>
            <InputText v-model="form.USERNAME" placeholder="mis. bintang" />
          </InputGroup>
          <small v-if="isEdit" class="form-hint">Username tidak bisa diubah setelah dibuat.</small>
          <small v-else-if="isOwner && !form.ID_CLIENT" class="form-hint">Pilih client dulu untuk lihat prefix username.</small>
          <small v-else class="form-hint">Username final: <strong>{{ usernamePrefix }}{{ form.USERNAME || '...' }}</strong></small>
        </div>
        <div class="field" v-if="!isEdit">
          <label>Password <span class="required">*</span></label>
          <InputText v-model="form.PWD" type="password" class="w-full" placeholder="Password baru" />
        </div>
        <div class="field" v-else>
          <label>Password Baru <small>(kosongkan jika tidak diubah)</small></label>
          <InputText v-model="form.PWD" type="password" class="w-full" placeholder="Biarkan kosong jika tidak diubah" />
        </div>
        <div class="field">
          <label>Profesi</label>
          <InputText v-model="form.PROFESI" class="w-full" placeholder="mis. Apoteker, Kasir" />
        </div>
        <div class="field">
          <label>No. SIPA</label>
          <InputText v-model="form.NO_SIPA" class="w-full" />
        </div>
        <div class="field">
          <label>Lokasi</label>
          <Select
            v-model="form.ID_LOKASI"
            :options="formLokasiOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="isOwner && !form.ID_CLIENT ? 'Pilih client dulu' : 'Semua Lokasi'"
            class="w-full"
            :loading="lokasiLoading"
            :disabled="isOwner && !form.ID_CLIENT"
            showClear
          />
          <small class="form-hint">Kosongkan supaya user bisa akses semua lokasi.</small>
        </div>
        <div class="field field-check">
          <Checkbox v-model="form.STATUS" :binary="true" inputId="status" />
          <label for="status">User Aktif</label>
        </div>
      </div>

      <template #footer>
        <Button label="Batal" icon="pi pi-times" text severity="secondary" @click="closeDialog" />
        <Button
          :label="saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah User')"
          :icon="saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
          severity="success"
          :loading="saving"
          @click="submitForm"
        />
      </template>
    </Dialog>

    <!-- Delete Confirm Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Konfirmasi Hapus"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="delete-confirm">
        <i class="pi pi-exclamation-triangle" style="font-size:2rem;color:#f59e0b" />
        <p>Yakin ingin menghapus user <strong>{{ deleteTarget?.NAMA_USER }}</strong>?</p>
        <p class="delete-warn">User akan dinonaktifkan (soft delete), bukan dihapus permanen.</p>
      </div>
      <template #footer>
        <Button label="Batal" icon="pi pi-times" text severity="secondary" @click="showDeleteDialog = false" />
        <Button
          :label="deleting ? 'Menghapus...' : 'Hapus'"
          icon="pi pi-trash"
          severity="danger"
          :loading="deleting"
          @click="deleteUser"
        />
      </template>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore, useAuthStore } from '@/stores/config'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'

const router = useRouter()
const configStore = useConfigStore()
const authStore = useAuthStore()
const { isOwner } = storeToRefs(authStore)
const toast = useToast()

// Kontrak: GET/POST/PUT/DELETE /api/apotek/user (User.php, ws_posindo_v2.1) — ID_CLIENT SELALU
// diambil dari token yang login di backend, KECUALI token owner (IS_OWNER=1) yang boleh kirim
// ID_CLIENT eksplisit / query ?clientId= (owner sendiri tidak terikat client manapun, lihat
// User.php::resolve_target_client_id()). Owner tanpa clientId di GET dapat SEMUA user lintas
// client — makanya tabel di bawah dikelompokkan per client kalau isOwner true.
const apiUrl = computed(() => `${configStore.apiApotikUrl}/index.php/api/apotek/user`)
const lokasiApiUrl = computed(() => `${configStore.apiApotikUrl}/index.php/api/apotek/referensi/lokasi_list`)
// PascalCase wajib ("ClientRegistration", bukan "clientregistration") — routing production
// case-sensitive buat controller ini (lihat pola yang sama di ClientRegistrationFormView.vue).
// Salah case-nya balikin 404 polos dari nginx (bukan dari CodeIgniter), jadi respons-nya juga
// nggak pernah dapet header CORS controller-nya sendiri → muncul di browser sebagai CORS error,
// bukan 404 — itu yang bikin awalnya kelihatan kayak masalah CORS padahal cuma salah huruf besar.
const clientLokasiApiUrl = computed(() => `${configStore.apiApotikUrl}/index.php/api/apotek/ClientRegistration/lokasi`)
const clientListApiUrl = computed(() => `${configStore.apiApotikUrl}/index.php/api/apotek/ClientRegistration/list`)

const isTruthy = (v) => String(v ?? '') === '1' || v === true

// Prefix "{ID_CLIENT}-" yang bakal ditempel backend (M_user_apotek::build_username()) di depan
// USERNAME yang diketik user — cuma buat DITAMPILKAN di form, tidak ikut dikirim di payload
// (backend yang gabungin). Owner: ikut client yang lagi dipilih di dropdown Client (bisa null
// sebelum dipilih). User biasa: selalu client dia sendiri, dari authStore.
const usernamePrefix = computed(() => {
  const cid = isOwner.value ? form.value.ID_CLIENT : authStore.id_client
  return cid ? `${cid}-` : null
})

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const users = ref([])
const globalFilter = ref('')
// Filter per client (owner saja) — GET /api/apotek/user backend SUDAH terima ?clientId= (lihat
// komentar apiUrl di atas), tapi di sini dipilih filter CLIENT-SIDE dari list yang udah ke-fetch
// penuh (bukan re-fetch tiap ganti filter), soalnya list lengkapnya tetap dibutuhkan buat stat
// "Total User" & rowGroupMode saat "Semua Client" dipilih. null = tampilkan semua client.
const clientFilter = ref(null)
// Grouping per client cuma masuk akal kalau owner LAGI nampilin lebih dari 1 client sekaligus —
// begitu difilter ke 1 client tertentu, tabelnya balik ke paginator biasa kayak user non-owner.
const isGrouped = computed(() => isOwner.value && !clientFilter.value)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const editingClientId = ref(null) // ID_CLIENT user yang lagi diedit — dikirim balik ke PUT/DELETE
const deleteTarget = ref(null)

const emptyForm = () => ({
  ID_CLIENT: null,
  NAMA_USER: '',
  USERNAME: '',
  PWD: '',
  PROFESI: '',
  NO_SIPA: '',
  ID_LOKASI: null,
  STATUS: true,
})

// Dideklarasikan sebelum formLokasiOptions/watch di bawah (keduanya baca form.value.ID_CLIENT)
// — sempat kebalik urutannya dan bikin "Cannot access 'form' before initialization" di runtime.
const form = ref(emptyForm())

// ══ CLIENT LIST (owner saja — clientregistration/list, owner-only di backend) ══
const clients = ref([])
const clientNameMap = computed(() => {
  const map = new Map()
  clients.value.forEach((c) => map.set(Number(c.ID_CLIENT), c.NAMA_APOTEK))
  return map
})
const clientLabel = (id) => clientNameMap.value.get(Number(id)) || `Client #${id}`
const countInClient = (id) => users.value.filter((u) => Number(u.ID_CLIENT) === Number(id)).length

const fetchClients = async () => {
  try {
    const { data } = await axios.get(clientListApiUrl.value)
    clients.value = data?.response || []
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Gagal memuat daftar client', life: 3000 })
  }
}

// ══ LOKASI DROPDOWN ══
// User biasa: GET referensi/lokasi_list (scoped otomatis ke client token). Owner: lokasi
// berbeda-beda PER CLIENT yang lagi dipilih, jadi dicache per ID_CLIENT lewat
// clientregistration/lokasi?clientId= (endpoint owner-only yang sama dipakai di layar Client
// Registration).
const lokasiLoading = ref(false)
const lokasiCache = ref(new Map()) // key: 'self' (non-owner) atau ID_CLIENT (owner) → array

const loadLokasiForOwnClient = async () => {
  lokasiLoading.value = true
  try {
    const { data } = await axios.get(lokasiApiUrl.value)
    lokasiCache.value = new Map(lokasiCache.value).set('self', data?.response || [])
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Gagal memuat daftar lokasi', life: 3000 })
  } finally {
    lokasiLoading.value = false
  }
}

const loadLokasiForClient = async (clientId) => {
  if (!clientId || lokasiCache.value.has(Number(clientId))) return
  lokasiLoading.value = true
  try {
    const { data } = await axios.get(clientLokasiApiUrl.value, { params: { clientId } })
    lokasiCache.value = new Map(lokasiCache.value).set(Number(clientId), data?.response || [])
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Gagal memuat lokasi client', life: 3000 })
  } finally {
    lokasiLoading.value = false
  }
}

// data.NAMA_LOKASI langsung dari GET /api/apotek/user (backend udah join field ini per baris,
// gak ada lagi fetch/cache lokasi buat nampilin label ini). lokasiCache di bawah masih dipakai,
// tapi cuma buat formLokasiOptions (dropdown Select di dialog Tambah/Edit, butuh daftar LENGKAP
// opsi lokasi client itu — beda kebutuhan dari sekadar nampilin 1 label per baris).
const lokasiLabel = (lokasiId, namaLokasi) => {
  if (lokasiId == null || lokasiId === '') return 'Semua Lokasi'
  return namaLokasi || `Lokasi #${lokasiId}`
}

// Dropdown options buat form Tambah/Edit — mengikuti form.ID_CLIENT kalau owner.
const formLokasiOptions = computed(() => {
  const key = isOwner.value ? Number(form.value.ID_CLIENT) : 'self'
  const list = lokasiCache.value.get(key) || []
  return list.map((l) => ({ label: l.LOKASI, value: l.LOKASI_ID }))
})

// Owner pilih client baru di dialog Tambah → load lokasi client itu on-demand.
watch(
  () => form.value.ID_CLIENT,
  (clientId) => {
    if (isOwner.value && clientId) loadLokasiForClient(clientId)
  },
)

const filteredUsers = computed(() => {
  let list = users.value
  if (isOwner.value && clientFilter.value) {
    list = list.filter((u) => Number(u.ID_CLIENT) === Number(clientFilter.value))
  }
  const q = globalFilter.value.toLowerCase()
  if (q) {
    list = list.filter(
      (u) =>
        (u.NAMA_USER || '').toLowerCase().includes(q) ||
        (u.USERNAME || '').toLowerCase().includes(q) ||
        (u.PROFESI || '').toLowerCase().includes(q),
    )
  }
  return list
})

// PrimeVue rowGroupMode="subheader" butuh data sudah terurut per field group-nya.
const displayUsers = computed(() => {
  if (!isGrouped.value) return filteredUsers.value
  return [...filteredUsers.value].sort((a, b) => Number(a.ID_CLIENT) - Number(b.ID_CLIENT))
})

const fetchUsers = async () => {
  loading.value = true
  try {
    // Owner tanpa param clientId → backend balikin SEMUA user lintas client (lihat komentar di
    // atas apiUrl). User biasa tetap otomatis ke-scope ke client-nya sendiri.
    const { data } = await axios.get(apiUrl.value)
    users.value = data?.response || []
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error?.response?.data?.metadata?.message || 'Gagal memuat data user',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editingId.value = null
  editingClientId.value = null
  form.value = emptyForm()
  // Kalau owner lagi filter ke 1 client tertentu, langsung pre-fill — user cuma perlu pilih
  // client secara manual kalau memang mau bikin user di client lain / lagi lihat "Semua Client".
  if (isOwner.value && clientFilter.value) form.value.ID_CLIENT = clientFilter.value
  showDialog.value = true
}

const openEditDialog = (data) => {
  isEdit.value = true
  editingId.value = data.ID
  editingClientId.value = data.ID_CLIENT
  form.value = {
    ...emptyForm(),
    ID_CLIENT: data.ID_CLIENT,
    NAMA_USER: data.NAMA_USER || '',
    USERNAME: data.USERNAME || '',
    PWD: '',
    PROFESI: data.PROFESI || '',
    NO_SIPA: data.NO_SIPA || '',
    ID_LOKASI: data.ID_LOKASI != null ? Number(data.ID_LOKASI) : null,
    STATUS: isTruthy(data.STATUS),
  }
  if (isOwner.value) loadLokasiForClient(data.ID_CLIENT)
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
}

const submitForm = async () => {
  if (!form.value.NAMA_USER?.trim()) {
    toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Nama User wajib diisi', life: 3000 })
    return
  }
  if (!form.value.USERNAME?.trim()) {
    toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Username wajib diisi', life: 3000 })
    return
  }
  if (!isEdit.value && !form.value.PWD?.trim()) {
    toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Password wajib diisi untuk user baru', life: 3000 })
    return
  }
  if (isOwner.value && !isEdit.value && !form.value.ID_CLIENT) {
    toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Pilih client tujuan dulu', life: 3000 })
    return
  }

  saving.value = true
  try {
    const payload = {
      NAMA_USER: form.value.NAMA_USER,
      USERNAME: form.value.USERNAME,
      PROFESI: form.value.PROFESI || null,
      NO_SIPA: form.value.NO_SIPA || null,
      ID_LOKASI: form.value.ID_LOKASI ?? null,
      STATUS: form.value.STATUS ? 1 : 0,
    }
    if (form.value.PWD?.trim()) payload.PWD = form.value.PWD
    // ID_CLIENT cuma berpengaruh kalau token owner (backend abaikan buat user biasa) — aman
    // selalu disertakan: saat create pakai client yang dipilih, saat edit pakai client asli
    // user itu (field Select-nya disabled, tapi form.ID_CLIENT tetap terisi dari openEditDialog).
    if (isOwner.value) payload.ID_CLIENT = isEdit.value ? editingClientId.value : form.value.ID_CLIENT

    const { data } = isEdit.value
      ? await axios.put(`${apiUrl.value}/${editingId.value}`, payload)
      : await axios.post(apiUrl.value, payload)

    if (data?.metadata?.code === 200) {
      toast.add({ severity: 'success', summary: 'Berhasil', detail: data.metadata.message, life: 3000 })
      showDialog.value = false
      await fetchUsers()
    } else {
      toast.add({ severity: 'error', summary: 'Gagal', detail: data?.metadata?.message || 'Terjadi kesalahan', life: 4000 })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal',
      detail: error?.response?.data?.metadata?.message || 'Gagal menyimpan data user',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (data) => {
  deleteTarget.value = data
  showDeleteDialog.value = true
}

const deleteUser = async () => {
  deleting.value = true
  try {
    const params = isOwner.value ? { clientId: deleteTarget.value.ID_CLIENT } : {}
    const { data } = await axios.delete(`${apiUrl.value}/${deleteTarget.value.ID}`, { params })
    if (data?.metadata?.code === 200) {
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'User berhasil dinonaktifkan', life: 3000 })
      showDeleteDialog.value = false
      await fetchUsers()
    } else {
      toast.add({ severity: 'error', summary: 'Gagal', detail: data?.metadata?.message || 'Terjadi kesalahan', life: 4000 })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error?.response?.data?.metadata?.message || 'Gagal menghapus user',
      life: 3000,
    })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await fetchUsers()
  if (isOwner.value) {
    await fetchClients()
    // Kolom Lokasi di tabel dibaca langsung dari data.NAMA_LOKASI (GET /api/apotek/user sudah
    // join field ini per baris) — nggak ada prefetch per-client lagi di sini. loadLokasiForClient
    // tetap dipakai, tapi cuma on-demand: dipicu watch(form.ID_CLIENT) begitu owner buka dialog
    // Tambah/Edit (butuh daftar LENGKAP opsi lokasi buat Select, beda kebutuhan dari label ini).
  } else {
    await loadLokasiForOwnClient()
  }
})
</script>

<style scoped>
.kn-stats { display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,220px));gap:var(--space-3);margin-bottom:var(--space-3); }

/* Table */
.table-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--sky-500);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.um-filter-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
}
.client-filter-select {
  width: 220px;
}
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-wrap .pi-search {
  position: absolute;
  left: 0.6rem;
  color: #94a3b8;
  z-index: 1;
}
.search-input {
  padding-left: 2rem !important;
  width: 240px;
}
.action-btns {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}
.table-empty {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.user-table :deep(.p-datatable-thead th) {
  background: #f8fafc;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.85rem;
  color: #0f4c75;
}
.group-count {
  font-weight: 400;
  font-size: 0.72rem;
  color: #94a3b8;
}

/* Form Dialog */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.field label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.25rem;
}
.field label small {
  font-weight: 400;
  color: #94a3b8;
}
.form-hint {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}
.field-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.field-check label {
  margin-bottom: 0;
  font-size: 0.82rem;
  cursor: pointer;
}
.required {
  color: #ef4444;
}
.w-full {
  width: 100%;
}

/* Delete confirm */
.delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}
.delete-warn {
  font-size: 0.82rem;
  color: #ef4444;
}

</style>
