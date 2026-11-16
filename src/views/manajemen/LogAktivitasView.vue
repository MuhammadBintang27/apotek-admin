<template>
  <div class="content">
    <loading_overlay :is-loading="loading" message="Memuat..." />

    <AppPageHeader
      title="Log Aktivitas"
      subtitle="Riwayat aktivitas semua user di semua client"
      icon="fas fa-history"
    />

    <!-- FILTER BAR — pakai grid bootstrap (row/col + w-100) sama kayak ClientRegistrationFormView,
         bukan inline pixel width di komponen PrimeVue langsung (itu yang bikin field ketimpa2). -->
    <div class="la-filter-bar">
      <div class="row g-2 align-items-end flex-grow-1">
        <div class="col-6 col-md-2">
          <label class="la-filter-label">Client ID</label>
          <InputNumber v-model="filters.clientId" placeholder="Semua" :useGrouping="false" class="w-100" />
        </div>
        <div class="col-6 col-md-2">
          <label class="la-filter-label">User ID</label>
          <InputNumber v-model="filters.userId" placeholder="Semua" :useGrouping="false" class="w-100" />
        </div>
        <div class="col-6 col-md-2">
          <label class="la-filter-label">Modul</label>
          <Select
            v-model="filters.action"
            :options="actionOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Semua"
            class="w-100"
          />
        </div>
        <div class="col-6 col-md-2">
          <label class="la-filter-label">Dari</label>
          <DatePicker v-model="filters.dateFrom" dateFormat="yy-mm-dd" showIcon class="w-100" />
        </div>
        <div class="col-6 col-md-2">
          <label class="la-filter-label">Sampai</label>
          <DatePicker v-model="filters.dateTo" dateFormat="yy-mm-dd" showIcon class="w-100" />
        </div>
      </div>
      <div class="la-filter-actions">
        <Button size="small"
          icon="pi pi-search"
          label="Terapkan"
          :loading="loading"
          @click="applyFilters()"
        />
        <Button size="small"
          icon="pi pi-refresh"
          label="Reset"
          severity="secondary"
          outlined
          :disabled="loading"
          @click="resetFilters()"
        />
      </div>
    </div>

    <!-- TABLE -->
    <div class="la-table-wrap">
      <DataTable :value="logs" :loading="loading" showGridlines rowHover size="small" class="la-datatable">
        <template #empty>
          <div class="la-empty">
            <div class="la-empty-icon"><i class="fas fa-inbox"></i></div>
            <p class="la-empty-title">Tidak ada aktivitas di rentang/filter ini</p>
          </div>
        </template>

        <template #loading>
          <div class="p-4 text-center"><i class="pi pi-spin pi-spinner me-2"></i> Memuat data...</div>
        </template>

        <Column header="WAKTU" style="width: 140px">
          <template #body="{ data }">
            <span class="mono" style="font-size: 11.5px; color: #475569">{{ formatWaktu(data.CREATED_AT) }}</span>
          </template>
        </Column>

        <Column header="CLIENT" style="width: 80px">
          <template #body="{ data }">
            <span class="mono">{{ data.ID_CLIENT ?? '-' }}</span>
          </template>
        </Column>

        <Column header="USER" style="width: 160px">
          <template #body="{ data }">
            <div style="display: flex; align-items: center; gap: 5px">
              <span style="font-size: 12px; font-weight: 600; color: #1e293b">{{ data.USERNAME }}</span>
              <span v-if="Number(data.IS_OWNER) === 1" class="status-badge status-badge-neutral">Owner</span>
            </div>
          </template>
        </Column>

        <Column header="AKSI" style="width: 170px">
          <template #body="{ data }">
            <span class="status-badge" :class="actionBadgeClass(data.ACTION)">{{ data.ACTION }}</span>
          </template>
        </Column>

        <Column header="ENTITY" style="width: 140px">
          <template #body="{ data }">
            <span class="mono" style="font-size: 11.5px">{{ data.ENTITY_ID ?? '-' }}</span>
          </template>
        </Column>

        <Column header="KETERANGAN">
          <template #body="{ data }">
            <span style="font-size: 12px; color: #475569">{{ data.KETERANGAN ?? '-' }}</span>
          </template>
        </Column>

        <Column header="IP" style="width: 110px">
          <template #body="{ data }">
            <span class="mono" style="font-size: 11px; color: #94a3b8">{{ data.IP_ADDRESS ?? '-' }}</span>
          </template>
        </Column>
      </DataTable>

      <!-- PAGER MANUAL — endpoint gak punya total-count, jadi "halaman terakhir" cuma di-infer
           dari length(response) < perPage (lihat spec log aktivitas), bukan dari total records. -->
      <div class="la-pager">
        <span class="la-pager-info">Halaman {{ page }} &middot; {{ logs.length }} baris</span>
        <div class="la-pager-actions">
          <Button
            icon="pi pi-chevron-left"
            label="Sebelumnya"
            size="small"
            outlined
            severity="secondary"
            :disabled="loading || page <= 1"
            @click="goToPage(page - 1)"
          />
          <Button
            icon="pi pi-chevron-right"
            iconPos="right"
            label="Selanjutnya"
            size="small"
            outlined
            severity="secondary"
            :disabled="loading || logs.length < perPage"
            @click="goToPage(page + 1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'
import { useConfigStore } from '@/stores/config'
import DatePicker from 'primevue/datepicker'

const toast = useToast()
const configStore = useConfigStore()

const apiUrl = `${configStore.apiApotikUrl}/index.php/api/apotek/LogAktivitas`

const actionOptions = [
  { label: 'Semua', value: null },
  { label: 'AUTH', value: 'AUTH' },
  { label: 'USER', value: 'USER' },
  { label: 'CLIENT', value: 'CLIENT' },
  { label: 'BARANG', value: 'BARANG' },
  { label: 'PENERIMAAN', value: 'PENERIMAAN' },
  { label: 'OPNAME', value: 'OPNAME' },
  { label: 'PENJUALAN', value: 'PENJUALAN' },
  { label: 'KONSINYASI', value: 'KONSINYASI' },
]

const filters = reactive({
  clientId: null,
  userId: null,
  action: null,
  dateFrom: null,
  dateTo: null,
})

const logs = ref([])
const loading = ref(false)
const page = ref(1)
const perPage = 50

// DatePicker balikin objek Date — endpoint butuh string YYYY-MM-DD.
const toDateParam = (d) => {
  if (!d) return undefined
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatWaktu = (raw) => {
  if (!raw) return '-'
  // "2026-09-17 14:22:03" -> "17 Sep 2026 14:22"
  const [datePart, timePart] = raw.split(' ')
  const [y, m, d] = datePart.split('-').map(Number)
  const tanggal = new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  return timePart ? `${tanggal} ${timePart.slice(0, 5)}` : tanggal
}

// Warna badge berdasarkan modul (prefix sebelum titik pertama di ACTION, mis. "USER.CREATE" -> "USER").
const actionBadgeClass = (action) => {
  const prefix = String(action || '').split('.')[0]
  if (['USER', 'CLIENT'].includes(prefix)) return 'status-badge-warn'
  if (['PENJUALAN', 'PENERIMAAN'].includes(prefix)) return 'status-badge-success'
  if (['OPNAME', 'KONSINYASI'].includes(prefix)) return 'status-badge-neutral'
  if (prefix === 'AUTH') return 'status-badge-danger'
  return 'status-badge-neutral'
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      perPage,
      clientId: filters.clientId || undefined,
      userId: filters.userId || undefined,
      action: filters.action || undefined,
      dateFrom: toDateParam(filters.dateFrom),
      dateTo: toDateParam(filters.dateTo),
    }
    const { data } = await axios.get(apiUrl, { params })
    logs.value = data?.response || []
  } catch (error) {
    console.error('Error fetching log aktivitas:', error)
    toast.add({
      severity: 'error',
      summary: 'Gagal',
      detail: error?.response?.data?.metadata?.message || 'Gagal mengambil data log aktivitas',
      life: 5000,
    })
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  page.value = 1
  fetchLogs()
}

const resetFilters = () => {
  filters.clientId = null
  filters.userId = null
  filters.action = null
  filters.dateFrom = null
  filters.dateTo = null
  page.value = 1
  fetchLogs()
}

const goToPage = (target) => {
  if (target < 1) return
  page.value = target
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.la-filter-bar { display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:var(--color-card);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4); }
.la-filter-label { font-size:11px;font-weight:600;color:#64748b;white-space:nowrap;display:block;margin-bottom:3px; }
.la-filter-actions { display:flex;align-items:center;gap:6px;flex-shrink:0; }

.la-table-wrap { background:var(--color-card);border:1px solid var(--color-border);border-top:3px solid var(--sky-500);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);overflow:hidden; }
:deep(.la-datatable .p-datatable-tbody > tr:hover > td) { background:#eef2ff !important; }

.la-empty { text-align:center;padding:40px 20px;color:#94a3b8; }
.la-empty-icon { font-size:36px;margin-bottom:10px;color:#cbd5e1; }
.la-empty-title { font-size:13px;font-weight:600;color:#64748b;margin:0; }

.la-pager { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid #e2e8f0;background:#fafafa; }
.la-pager-info { font-size:11.5px;color:#64748b; }
.la-pager-actions { display:flex;gap:6px; }

.status-badge { display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.2px;line-height:1.5;white-space:nowrap; }
.status-badge-success { background:#ecfdf5;color:#059669; }
.status-badge-warn { background:#fffbeb;color:#b45309; }
.status-badge-danger { background:#fef2f2;color:#dc2626; }
.status-badge-neutral { background:#f1f5f9;color:#64748b; }

.mono { font-family:monospace; }
</style>
