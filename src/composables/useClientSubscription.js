/**
 * Riwayat & pendaftaran/perpanjangan subscription client (owner-only) —
 * GET/POST /api/apotek/ClientRegistration/subscription (lihat api_apotek.md).
 * POST cuma nambah baris baru, tidak pernah menimpa riwayat lama. Baris paling atas
 * (TANGGAL_BERAKHIR paling jauh) = subscription yang sedang aktif.
 *
 * Dipakai di ClientRegistrationFormView.vue (panel di step Review) dan
 * ClientRegistrationListView.vue (dialog "Perpanjang" per baris) — tiap pemanggil dapat
 * instance state sendiri-sendiri (bukan singleton/cache seperti useLokasiGudang).
 *
 * Usage:
 * import { useClientSubscription } from '@/composables/useClientSubscription'
 * const { history, loading, saving, form, fetchHistory, submit, resetForm, formatRupiah } = useClientSubscription()
 */

import { ref, reactive, computed } from 'vue'
import axios from 'axios'
import { useToast } from 'primevue/usetoast'
import { useConfigStore } from '@/stores/config'

export function useClientSubscription() {
  const toast = useToast()
  const configStore = useConfigStore()
  const apiUrl = computed(() => `${configStore.apiApotikUrl}/index.php/api/apotek/ClientRegistration/subscription`)

  const history = ref([])
  const loading = ref(false)
  const saving = ref(false)

  const emptyForm = () => ({
    TANGGAL_MULAI: null,
    TANGGAL_BERAKHIR: null,
    PAKET: '',
    HARGA: null,
    CATATAN: '',
  })
  const form = reactive(emptyForm())
  const resetForm = () => Object.assign(form, emptyForm())

  const formatRupiah = (v) => {
    if (v === null || v === undefined || v === '') return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v))
  }
  // DatePicker v-model balikin Date object — server minta string "yyyy-mm-dd".
  const toDateStr = (d) => {
    if (!d) return null
    const dt = new Date(d)
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const day = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const fetchHistory = async (clientId) => {
    if (!clientId) return
    loading.value = true
    try {
      const { data } = await axios.get(apiUrl.value, { params: { clientId } })
      history.value = data?.response || []
    } catch (error) {
      console.error('Error fetching subscription history:', error)
      toast.add({
        severity: 'error',
        summary: 'Gagal',
        detail: error?.response?.data?.metadata?.message || 'Gagal mengambil riwayat langganan',
        life: 5000,
      })
    } finally {
      loading.value = false
    }
  }

  // Balikin true kalau berhasil, biar caller (mis. dialog di List) bisa tahu kapan boleh nutup dialog.
  const submit = async (clientId) => {
    if (!clientId) return false
    if (!form.TANGGAL_BERAKHIR) {
      toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tanggal Berakhir wajib diisi', life: 5000 })
      return false
    }
    saving.value = true
    try {
      const payload = {
        IDCLIENT: clientId,
        TANGGAL_BERAKHIR: toDateStr(form.TANGGAL_BERAKHIR),
      }
      const mulaiStr = toDateStr(form.TANGGAL_MULAI)
      if (mulaiStr) payload.TANGGAL_MULAI = mulaiStr
      if (form.PAKET.trim()) payload.PAKET = form.PAKET.trim()
      if (form.HARGA != null) payload.HARGA = form.HARGA
      if (form.CATATAN.trim()) payload.CATATAN = form.CATATAN.trim()

      const { data } = await axios.post(apiUrl.value, payload)
      if (data?.metadata?.code && data.metadata.code !== 200) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: data.metadata.message || 'Gagal menyimpan langganan', life: 5000 })
        return false
      }
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Langganan berhasil disimpan', life: 3000 })
      resetForm()
      await fetchHistory(clientId)
      return true
    } catch (error) {
      console.error('Error saving subscription:', error)
      toast.add({
        severity: 'error',
        summary: 'Gagal',
        detail: error?.response?.data?.metadata?.message || 'Gagal menyimpan langganan',
        life: 5000,
      })
      return false
    } finally {
      saving.value = false
    }
  }

  // ══ INVOICE — 1 invoice per baris riwayat (tiap perpanjangan = 1 baris = 1 invoice) ══
  // Buka window baru berisi HTML invoice lalu window.print() — user bisa "Save as PDF" dari dialog print.
  // NO_INVOICE disimpan BE (di-generate saat POST); fallback deterministik untuk baris lama / BE belum deploy.
  const invoiceNo = (row, clientId) =>
    row.NO_INVOICE || `INV/SUB/${clientId}/${String(row.TANGGAL_MULAI || '').slice(0, 10).replaceAll('-', '')}`

  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

  const tgl = (s) => {
    if (!s) return '-'
    const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Penerbit invoice tetap (perusahaan penyedia aplikasi) — sengaja hardcode, bukan dari data user login.
  const ISSUER = { nama: 'PT. Paripurna Sentosa Digital', alamat: 'Aceh Barat, Aceh' }
  const SIGNERS = [
    { nama: 'Hardinal Farihas', jabatan: 'Direktur' },
    { nama: 'Miza Irmawan', jabatan: 'Product Manager' },
  ]

  const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']
  const terbilangRaw = (x) => {
    const n = Math.floor(x)
    if (n < 12) return SATUAN[n]
    if (n < 20) return `${terbilangRaw(n - 10)} belas`
    if (n < 100) return `${terbilangRaw(n / 10)} puluh ${terbilangRaw(n % 10)}`
    if (n < 200) return `seratus ${terbilangRaw(n - 100)}`
    if (n < 1000) return `${terbilangRaw(n / 100)} ratus ${terbilangRaw(n % 100)}`
    if (n < 2000) return `seribu ${terbilangRaw(n - 1000)}`
    if (n < 1e6) return `${terbilangRaw(n / 1000)} ribu ${terbilangRaw(n % 1000)}`
    if (n < 1e9) return `${terbilangRaw(n / 1e6)} juta ${terbilangRaw(n % 1e6)}`
    if (n < 1e12) return `${terbilangRaw(n / 1e9)} miliar ${terbilangRaw(n % 1e9)}`
    return `${terbilangRaw(n / 1e12)} triliun ${terbilangRaw(n % 1e12)}`
  }
  const terbilang = (v) => {
    const s = terbilangRaw(Number(v) || 0).replace(/\s+/g, ' ').trim() || 'nol'
    return `${s.charAt(0).toUpperCase()}${s.slice(1)} rupiah`
  }

  // client: { ID_CLIENT, NAMA_APOTEK, ALAMAT }
  const printInvoice = (row, client) => {
    const w = window.open('', '_blank', 'width=900,height=1000')
    if (!w) {
      toast.add({ severity: 'error', summary: 'Gagal', detail: 'Popup diblokir browser, izinkan popup untuk mencetak invoice', life: 5000 })
      return
    }
    const no = invoiceNo(row, client.ID_CLIENT)
    const harga = formatRupiah(row.HARGA)
    w.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(no)}</title>
<style>
  @page { size: A4; margin: 0 }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  body { margin: 0; background: #e5e7eb; font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; font-size: 10.5pt }
  .page { width: 210mm; min-height: 297mm; margin: 10mm auto; background: #fff; padding: 18mm 18mm 16mm; position: relative; box-shadow: 0 2px 12px rgba(0,0,0,.15); display: flex; flex-direction: column }
  .band { position: absolute; top: 0; left: 0; right: 0; height: 6mm; background: linear-gradient(90deg, #0c4a6e, #0284c7) }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 4mm }
  .co-name { font-size: 16pt; font-weight: 800; color: #0c4a6e; letter-spacing: .3px }
  .co-addr { color: #6b7280; margin-top: 2px }
  .title { text-align: right }
  .title h1 { margin: 0; font-size: 30pt; font-weight: 300; letter-spacing: 6px; color: #0284c7 }
  .meta { margin-top: 12mm; display: flex; justify-content: space-between; gap: 10mm }
  .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; font-weight: 700; margin-bottom: 4px }
  .bill strong { font-size: 12pt; color: #111827 }
  .meta-table td { padding: 2px 0 2px 12px; vertical-align: top }
  .meta-table td:first-child { color: #6b7280; padding-left: 0 }
  .meta-table td:last-child { text-align: right; font-weight: 600 }
  table.items { width: 100%; border-collapse: collapse; margin-top: 12mm }
  table.items th { background: #0c4a6e; color: #fff; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1px; padding: 9px 10px; text-align: left; font-weight: 600 }
  table.items td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top }
  .r { text-align: right !important }
  .desc-sub { color: #6b7280; font-size: 9pt; margin-top: 3px }
  .summary { display: flex; justify-content: space-between; gap: 10mm; margin-top: 8mm }
  .words { flex: 1; background: #f0f9ff; border-left: 3px solid #0284c7; padding: 10px 12px; font-style: italic; color: #0c4a6e; align-self: flex-start }
  .totals { width: 75mm; border-collapse: collapse }
  .totals td { padding: 6px 0 }
  .totals .grand td { border-top: 2px solid #0c4a6e; padding-top: 10px; font-size: 13pt; font-weight: 800; color: #0c4a6e }
  .note { margin-top: 8mm; padding: 10px 12px; border: 1px dashed #d1d5db; border-radius: 4px; color: #4b5563 }
  .sign { margin-top: auto; padding-top: 14mm; text-align: center }
  .sign-co { font-weight: 700; color: #0c4a6e; margin-top: 2px }
  .signers { display: flex; justify-content: space-around; margin-top: 4mm }
  .signer { width: 65mm }
  .signer .line { margin-top: 24mm; border-top: 1px solid #374151; padding-top: 5px; font-weight: 700 }
  .signer .role { color: #6b7280; font-size: 9pt }
  .foot { margin-top: 10mm; padding-top: 4mm; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 8.5pt }
  @media print { body { background: #fff } .page { margin: 0; box-shadow: none; min-height: 297mm } }
</style></head><body>
<div class="page">
  <div class="band"></div>
  <div class="head">
    <div><div class="co-name">${esc(ISSUER.nama)}</div><div class="co-addr">${esc(ISSUER.alamat)}</div></div>
    <div class="title"><h1>INVOICE</h1></div>
  </div>

  <div class="meta">
    <div class="bill">
      <div class="label">Ditagihkan Kepada</div>
      <strong>${esc(client.NAMA_APOTEK || '-')}</strong>
      <div style="color:#6b7280;margin-top:3px">ID Client: ${esc(client.ID_CLIENT)}</div>
      ${client.ALAMAT ? `<div style="color:#6b7280;max-width:85mm">${esc(client.ALAMAT)}</div>` : ''}
    </div>
    <table class="meta-table">
      <tr><td>No. Invoice</td><td>${esc(no)}</td></tr>
      <tr><td>Tanggal</td><td>${tgl(row.CREATED_AT || row.TANGGAL_MULAI)}</td></tr>
      <tr><td>Periode</td><td>${tgl(row.TANGGAL_MULAI)} s/d ${tgl(row.TANGGAL_BERAKHIR)}</td></tr>
    </table>
  </div>

  <table class="items">
    <thead><tr><th style="width:12mm">No</th><th>Deskripsi</th><th class="r" style="width:20mm">Qty</th><th class="r" style="width:40mm">Harga</th><th class="r" style="width:40mm">Jumlah</th></tr></thead>
    <tbody><tr>
      <td>1</td>
      <td><strong>Langganan Aplikasi Apotek${row.PAKET ? `, Paket ${esc(row.PAKET)}` : ''}</strong>
        <div class="desc-sub">Periode ${tgl(row.TANGGAL_MULAI)} s/d ${tgl(row.TANGGAL_BERAKHIR)}</div></td>
      <td class="r">1</td><td class="r">${esc(harga)}</td><td class="r">${esc(harga)}</td>
    </tr></tbody>
  </table>

  <div class="summary">
    <div class="words"><div class="label" style="font-style:normal">Terbilang</div>${esc(terbilang(row.HARGA))}</div>
    <table class="totals">
      <tr><td>Subtotal</td><td class="r">${esc(harga)}</td></tr>
      <tr class="grand"><td>TOTAL</td><td class="r">${esc(harga)}</td></tr>
    </table>
  </div>

  ${row.CATATAN ? `<div class="note"><div class="label">Catatan</div>${esc(row.CATATAN)}</div>` : ''}

  <div class="sign">Hormat kami,<div class="sign-co">${esc(ISSUER.nama)}</div>
    <div class="signers">${SIGNERS.map((p) => `<div class="signer"><div class="line">${esc(p.nama)}</div><div class="role">${esc(p.jabatan)}</div></div>`).join('')}</div>
  </div>
  <div class="foot">Terima kasih atas kepercayaan Anda menggunakan layanan kami.</div>
</div>
<script>window.onload = () => window.print()<\/script>
</body></html>`)
    w.document.close()
  }

  return { history, loading, saving, form, fetchHistory, submit, resetForm, formatRupiah, toDateStr, printInvoice }
}
