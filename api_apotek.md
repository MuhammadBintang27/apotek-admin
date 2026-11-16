# API Vertikal Apotek — Kontrak untuk FE

Modul apotek baru, seluruhnya di `application/controllers/api/apotek/`. Base
path semua endpoint di bawah ini: **`/api/apotek/<controller>/<endpoint>`**
(nama controller lowercase kecuali yang eksplisit disebut PascalCase:
`referensi`, `inventory`, `pemesanan`, `penerimaan`, `sales`, `konsinyasi`,
`StockOpname`, `ClientRegistration`). Ini **modul baru**, jadi tidak ada
endpoint lama yang "pindah" — FE tinggal implement dari nol mengikuti
kontrak ini.

---

## Konvensi umum

**Response envelope** — sama untuk SEMUA endpoint di bawah:
```json
// sukses
{ "metadata": { "code": 200, "message": "Success" }, "response": { ... } }
// gagal validasi/bisnis (HTTP 400)
{ "metadata": { "code": 202, "message": "pesan error 1, pesan error 2" }, "response": null }
// not found (HTTP 404) — cuma di endpoint detail/get-by-id tertentu
{ "metadata": { "code": 404, "message": "... tidak ditemukan" }, "response": null }
```
`message` pada sukses kadang diisi teks spesifik (mis. `"Barang berhasil
disimpan"`), kadang cuma `"Success"` — jangan bergantung ke isi `message`
untuk logic, cuma untuk tampilan/toast.

**Body POST/PUT** — selalu JSON (`Content-Type: application/json`), dibaca
langsung dari raw body, BUKAN form-encoded.

**Auth** — **tidak ada endpoint login/logout di modul ini, dan memang tidak
akan pernah ada.** Login apotek 100% lewat jalur yang SAMA dengan RS
sekarang: **`simrs_v2_backend`** (project terpisah), yang query tabel
`m_login` — tabel **shared**, cuma beda `ID_CLIENT` per tenant (RS vs Apotek
bukan dua identity space beda, cuma dua nilai `ID_CLIENT` berbeda di tabel
yang sama). FE apotek login ke `simrs_v2_backend` seperti FE RS, dapat
token/identitas user dari sana, baru pakai identitas itu (NIP) saat manggil
endpoint `api/apotek/*` di ws_posindo_v2.1 ini. Semua field identitas user di
bawah (`ID_USER`, `ID_PJ`, dst) **VARCHAR bebas** — endpoint di modul ini
TIDAK memvalidasi ulang ke `m_login` (FE yang sudah tahu siapa yang login
dari hasil `simrs_v2_backend`), kecuali `GET referensi/apoteker` yang
memang query `m_login` buat dropdown nama.

**Konversi satuan** — barang boleh punya `SATUAN_KECIL`/`SATUAN_SEDANG`/
`SATUAN_BESAR` (mis. Tablet/Strip/Box). Endpoint yang terima `QTY` + `SATUAN`
(checkout, penerimaan, stock opname, dst) otomatis mengonversi ke basis
`SATUAN_KECIL` di backend — kirim `SATUAN` sesuai yang dipilih user, jangan
dikonversi manual di FE.

**Kategori barang — 2 level, bukan 3.** `KATEGORI_BESAR` cuma `BARANG` atau
`JASA` (tidak ada `OBAT_BMHP`/`ATK`/`JENIS` seperti draft lama). Item
`JASA` tidak boleh muncul di Surat Pesanan (Pemesanan) — lihat catatan di
bagian Pemesanan.

---

## 1. Referensi (`/api/apotek/referensi/...`) — 12 endpoint

| Endpoint | Query/Body | Response |
|---|---|---|
| `GET lokasi/{id}?clientId=` | segmen `id`, `clientId` | Objek `m_lokasi_apotek` (404 kalau tidak ada) |
| `GET lokasi_info?clientId=&lokasiId=` | | `{ID, LOKASI, INDUK, IS_GUDANG}` — `IS_GUDANG` dipakai FE toggle tombol "Tambah Barang" (cuma lokasi induk boleh) |
| `GET profil_apotek/{idClient}` | segmen | Objek `profile_rs_apotek` (404 kalau belum diisi) |
| `GET profil_apotek_integrasi/{idClient}` | segmen | Objek `profile_rs_apol_apotek` (404 kalau belum diisi) |
| `GET apoteker?clientId=` | | Array `{ID, NAMA_USER, NO_SIPA, IS_DEFAULT_APOTEKER}` — dropdown pemilihan apoteker penanggung jawab SP |
| `GET menu?userId=&clientId=&mode=` | `mode=1`(default) menu ter-assign ke user itu; `mode=2` semua menu | Array pohon `{ID, TITLE, ICON, CHILDREN:[{ID,TITLE,PATH,ICON}]}` |
| `GET menu_item_all` | | Array datar semua menu (layar admin kelola menu) |
| `POST menu_item_create` | `{PARENT_ID?, TITLE, PATH?, ICON?, SORT_ORDER?}` | `{ID}` |
| `PUT menu_item_update/{id}` | body sama dgn create | `null` |
| `DELETE menu_item_delete/{id}` | | `null` (hard delete — `ON DELETE CASCADE` ikut hapus children & assignment-nya) |
| `GET menu_assigned?userId=&clientId=` | | Array `main_menu_assign_apotek` milik user itu — buat prefill checkbox di layar admin |
| `POST menu_assign` | `{ID_MENU, USER_ID, ID_CLIENT}` | `{ID}` (idempotent — assignment yang sudah ada tidak dobel) |
| `POST menu_unassign/{id}` | `{ID_CLIENT}` | `null` (soft-delete) |

⚠️ Endpoint jabatan & manajemen user (CRUD akun) **SENGAJA TIDAK ADA** di
sini — itu domain `simrs_v2_backend`. Tapi **menu SEKARANG ada**, di tabel
**sendiri** (`main_menu_items_apotek`/`main_menu_assign_apotek`) — BUKAN
numpang tabel menu shared RS (`main_menu_items` global, isinya menu RS,
tidak relevan/tidak bisa di-scope buat apotek). `apoteker` tetap query
`m_login` (tabel shared), persis pola RS.

---

## 2. Inventory (`/api/apotek/inventory/...`) — 25 endpoint

### Supplier
| Endpoint | Body/Query | Response |
|---|---|---|
| `GET supplier_list?clientId=&search=&page=&limit=` | | `{rows:[...], total, page, limit, totalPages}` |
| `GET supplier_all?clientId=` | | Array semua supplier aktif (tanpa pagination) |
| `POST supplier_create` | `{ID_CLIENT, NAMASUPLIER, KOTA?, ALAMAT?, NOHP?, CATATAN?, NO_IZIN_PBF?, NO_SERTIFIKAT_CDOB?}` | `{ID}` |
| `PUT supplier_update/{id}` | body sama dgn create + `ID_CLIENT` | `null` |
| `DELETE supplier_delete/{id}?clientId=` | | `null` (soft-delete) |

### Barang
| Endpoint | Body/Query | Response |
|---|---|---|
| `GET barang_list?clientId=&lokasiId=&search=&page=&limit=&KATEGORI=&bucket=&jenis_sp=&DELETED=&ARSIPKAN=&mode=&sortField=&sortOrder=&grouped=` | `bucket`=`BARANG`/`JASA`; `jenis_sp`=`BRG`/`PSI`/`PRE`/`NAR` (dipakai item-picker Pemesanan, otomatis exclude JASA); `mode=2` sertakan `batches` per baris; `grouped=1` balikin grup per `GROUPING` | `{rows:[...], total, page, limit, totalPages}` (tiap baris ikut `BUCKET`, `IS_BELOW_MINIMUM`) |
| `GET barang_group_items?clientId=&lokasiId=&grouping=&mode=&bucket=&ARSIPKAN=` | `grouping=""` → grup "(Tanpa Grouping)" | Array item dalam grup itu |
| `GET barang_stock_detail/{id}?clientId=&lokasiId=&ARSIPKAN=` | | Array batch (`SUB_BARCODE`, `QTY`, `HARGA`, `HARGAJUAL`, `TGL_EXPIRED`, `ID_RAK`/`KODE_RAK`/`NAMA_RAK`, dst) |
| `GET barang_detail/{id}?clientId=` | | Objek `barang_apotek` |
| `POST barang_create?clientId=&lokasiId=` | `{NAMA, KATEGORI?, SATUAN_KECIL?, ...}` — lihat daftar field di `M_barang_apotek::create_barang()` | `{ID, IDBARANG, BARCODE}`. **Ditolak (400)** kalau `lokasiId` bukan lokasi induk |
| `PUT barang_update/{id}?clientId=` | field yang mau diubah | `null` |
| `DELETE barang_delete/{id}?clientId=` | | `null` (soft-delete) |
| `PUT barang_arsip/{id}?clientId=&lokasiId=` | | `null` — arsipkan master + semua batch di lokasi itu |
| `PUT barang_aktif/{id}?clientId=` | | `null` |
| `PUT batch_arsip/{batch_id}?clientId=` | | `null` |
| `PUT batch_aktif/{batch_id}?clientId=` | | `null` |
| `POST batch_create/{barangId}?clientId=&lokasiId=` | `{QTY, SATUAN?, HARGA_BELI, HARGAJUAL_KECIL, HARGAJUAL_SEDANG?, HARGAJUAL_BESAR?, NO_BATCH?, TGL_EXPIRED?, ID_RAK?, CATATAN?}` | `{SUB_BARCODE}`. Tambah batch (SUB_BARCODE) baru langsung dari Master Barang — TANPA lewat Penerimaan (tidak ada supplier/faktur/hutang tercatat). `ID_RAK` kosong = auto-suggest sama seperti Penerimaan |
| `PUT batch_tambah_stok/{batch_id}?clientId=` | `{QTY, SATUAN?, CATATAN?}` | `{QTY_BARU}`. Tambah QTY ke batch yang SUDAH ADA — harga/no batch/expired tidak berubah. Batch konsinyasi (titipan) ditolak |
| `GET barang_stock_card/{id}?clientId=&lokasiId=&tglMin=&tglMax=` | | `{barang: {...}, rows: [kartu stok]}` |
| `GET barang_akan_expired?clientId=&lokasiId=&search=&bucket=&expired_before=&months=&page=&limit=` | `expired_before` (tanggal) ATAU `months` (N bulan ke depan) | `{rows, total, page, limit, totalPages, target_date}` |
| `GET barang_stok_minimum?clientId=&lokasiId=&search=&bucket=&page=&limit=` | | `{rows, total, page, limit, totalPages}` — cuma barang `GUNAKAN_STOCK_MIN=1` dan stok ≤ `STOCKMINIMUM` |
| `GET barang_dropdown?clientId=` | | Array ringkas (ID, IDBARANG, NAMA, BARCODE, KATEGORI, satuan) — buat dropdown picker |

### Master kecil
| Endpoint | Body/Query | Response |
|---|---|---|
| `GET kategori_list?clientId=&bucket=` | `bucket` opsional (`BARANG`/`JASA`) | Array `m_kategori_apotek` |
| `POST kategori_create` | `{ID_CLIENT, KATEGORI_BESAR, NAMA_KATEGORI}` | `{ID}` |
| `PUT kategori_update/{id}?clientId=` | `{KATEGORI_BESAR, NAMA_KATEGORI}` | `null`. Nama bentrok dgn kategori aktif lain (client sama) → ditolak. Kalau nama berubah, cascade rename `barang_apotek.KATEGORI` (lama→baru) utk client itu — kolomnya nyimpen nama sbg string, bukan FK |
| `DELETE kategori_delete/{id}?clientId=&reassignTo=` | `reassignTo` opsional (ID kategori pengganti) | `null`. **409** kalau masih ada barang aktif pakai kategori itu & `reassignTo` kosong — body `{response:{COUNT_BARANG}}`; isi `reassignTo` valid → barang dipindah ke kategori pengganti dulu baru kategori lama di-soft-delete |
| `GET kategori_barang_list/{id}?clientId=&page=&limit=` | `page`/`limit` opsional (default 1/20, cap 100) | `{rows:[{IDBARANG,NAMA,BARCODE}], total, page, limit, totalPages}` — lazy-load dipanggil FE cuma pas user klik "lihat barang" di dialog konfirmasi hapus (409) |
| `GET master_klasifikasi_list` | | Array `m_klasifikasi_obat_apotek` (UMUM/PSI/PRE/NAR, global) |
| `GET master_sediaan_list` / `POST master_sediaan_create` | body create: `{KODE_SEDIAAN, NAMA_SEDIAAN}` | Array / `{ID}` |
| `GET master_rute_list` / `POST master_rute_create` | body create: `{KODE_RUTE, NAMA_RUTE}` | Array / `{ID}` |
| `GET master_grouping_list` / `POST master_grouping_create` | body create: `{KODE_GROUP, NAMA_GROUP}` | Array / `{ID}` |
| `GET master_satuan_list?clientId=` / `POST master_satuan_create` | body create: `{SATUAN, ID_CLIENT}` (cari-atau-buat, idempotent) | Array / `{ID, SATUAN, ID_CLIENT}` |

### Rak
Lokasi penyimpanan fisik **di dalam** satu `ID_LOKASI` (rak/lemari/laci — mis.
"A1", "Lemari Narkotik"). Rak adalah properti Lokasi (bukan properti Barang);
di-assign ke *batch* (`ID_RAK` di `t_stock_barang_apotek`), bukan ke
`barang_apotek` — batch baru barang yang sama bisa ditaruh di rak berbeda dari
batch lama. Semua field `ID_RAK`/`KODE_RAK`/`NAMA_RAK` nullable/opsional.

| Endpoint | Body/Query | Response |
|---|---|---|
| `GET rak_list?clientId=&lokasiId=` | | Array `m_rak_apotek` aktif milik lokasi itu |
| `POST rak_create` | `{ID_CLIENT, ID_LOKASI, KODE_RAK, NAMA_RAK?, KETERANGAN?}` | `{ID}`. `KODE_RAK` unik per lokasi — ditolak kalau sudah dipakai rak lain di lokasi yang sama |
| `PUT rak_update/{id}?clientId=` | `{KODE_RAK?, NAMA_RAK?, KETERANGAN?}` (PATCH-style, cuma field yang dikirim yang diupdate) | `null`. `KODE_RAK` sama-sama unik per lokasi kalau diubah |
| `DELETE rak_delete/{id}?clientId=&reassignTo=` | `reassignTo` opsional (ID rak pengganti, harus di lokasi yang sama) | `null` (soft-delete). **409** kalau masih ada batch aktif nunjuk rak itu & `reassignTo` kosong — body `{response:{COUNT_BATCH}}`; isi `reassignTo` valid → semua batch dipindah ke rak pengganti dulu baru rak lama di-soft-delete |
| `PUT batch_update_rak/{batch_id}?clientId=` | `{ID_RAK}` (`null`/`0`/`""` = lepas rak) | `null`. Tanpa gate konsinyasi — posisi fisik bukan data finansial |
| `GET rak_suggest?clientId=&lokasiId=&barcode=` | Preview hasil auto-suggest SEBELUM submit Penerimaan/Konsinyasi — logic identik dengan yang beneran jalan pas batch baru dibuat (read-only, aman dipanggil tiap kali user pilih barang di satu baris form) | `{ID_RAK, KODE_RAK, NAMA_RAK}` atau `null` kalau barang ini belum punya histori rak sama sekali di lokasi itu |

Field `ID_RAK`/`KODE_RAK`/`NAMA_RAK` ikut disertakan (LEFT JOIN) di
`barang_stock_detail`, `barang_list?mode=2` (`batches[]`), dan item-picker
kasir `sales/barang_list` (`batches[]`).

---

## 3. Pemesanan / Surat Pesanan (`/api/apotek/pemesanan/...`) — 8 endpoint

⚠️ **`otorisasi_sp` re-verifikasi username+password (NIP+PWD)** ke `m_login`
— tabel yang SAMA dengan RS — persis pola
`M_triase_igd.php::otorisasi_suratpemesanan()` versi RS. Bedanya, verifikasi
dilakukan LOKAL di backend apotek sendiri (bukan panggil balik ke
`simrs_v2_backend`), karena `m_login` memang satu database yang sama.
Kalau `JENIS_SP != BRG`, user yang login lewat NIP/PWD itu wajib
`PROFESI='Apoteker'` dan punya `NO_SIPA`. `NAMA_PJ`/`NO_SIPA` diambil dari
baris `m_login` yang cocok — TIDAK lagi dipercaya dari input FE. Dropdown
`GET /api/apotek/referensi/apoteker?clientId=` masih ada tapi sudah tidak
dipakai form otorisasi SP.

⚠️ **`JENIS_SP` cuma 4 nilai**: `BRG` (barang biasa — default), `PSI`, `PRE`,
`NAR`. (Versi lama punya `OBT` terpisah dari `BRG` — sekarang di-merge jadi
`BRG` semua, karena kategori barang sekarang cuma `BARANG`/`JASA`, bukan
`OBAT_BMHP`/`ATK` lagi). **Item `JASA` DITOLAK masuk SP** (400 dgn pesan
"...adalah jasa/layanan, tidak bisa dipesan lewat Surat Pesanan").

| Endpoint | Body/Query | Response |
|---|---|---|
| `POST save_pemesanan` | `{ID_SUPPLIER, ID_CLIENT, ID_LOKASI, KETERANGAN?, NO_REFERENSI?, details:[{ID_BARANG, QTY_PESAN, SATUAN, HARGA_SATUAN?}]}` | `{ID_PEMESANAN, NO_SP}`. `JENIS_SP` di-deteksi otomatis dari isi `details` |
| `POST edit_pemesanan` | sama + `ID_PEMESANAN` | `{ID_PEMESANAN}`. Cuma boleh saat `STATUS` Draft/Siap Dikirim |
| `POST get_list_pemesanan` | body: `{ID_CLIENT, ID_LOKASI?, ID_SUPPLIER?, JENIS_SP?, status?(draft/siap_dikirim/dikirim/diterima/selesai), start_date?, end_date?, search?, page?, limit?}` | `{rows:[...], total, page, limit, totalPages}` |
| `GET get_detail_pemesanan/{id_pemesanan}/{idclient}` | segmen | `{head:{...}, details:[...], grand_total}` |
| `POST otorisasi_sp` | `{ID_PEMESANAN, ID_CLIENT, NIP, PWD}` | `{NAMA_PJ, NO_SIPA}`. NIP+PWD diverifikasi ke `m_login` (+ `PROFESI='Apoteker'` kalau `JENIS_SP != BRG`); `NO_SIPA` wajib ada di baris `m_login` yang cocok kalau `JENIS_SP != BRG`. Set `STATUS=1` (Siap Dikirim) |
| `POST cek_otorisasi_sp` | `{ID_CLIENT, NO_SP?, ID_PEMESANAN?}` (salah satu wajib) | `{ID_PEMESANAN, NO_SP, JENIS_SP, TANGGAL_SP, NAMA_SUPPLIER, STATUS, STATUS_LABEL, SUDAH_OTORISASI, PJ:{NAMA,NO_SIPA}|null, QR_CONTENT}` |
| `POST kirim_sp` | `{ID_PEMESANAN, ID_CLIENT}` | `null`. Cuma dari `STATUS=1` → `STATUS=2` (Dikirim) |
| `POST hapus_pemesanan` | `{ID_PEMESANAN, ID_CLIENT}` | `null`. Hard delete, ditolak kalau `STATUS>=3` (Diterima/Selesai) atau sudah >30 hari |

---

## 4. Penerimaan & Hutang (`/api/apotek/penerimaan/...`) — 17 endpoint

⚠️ **Beda besar dari draft lama**: modul ini **SELALU beli-putus**, tidak ada
lagi opsi `JENIS_PENERIMAAN=KONSINYASI_TITIP`. Titipan konsinyasi 100% lewat
`/api/apotek/konsinyasi/terima_titipan` (lihat bagian 6) — jangan kirim
apa pun terkait konsinyasi ke endpoint di modul ini.

`save_penerimaan_sp` dan `save_penerimaan_tanpa_sp` menerima **JSON polos**
ATAU **multipart/form-data** (field `data` = JSON string, field `lampiran` =
file foto/PDF faktur) — kirim multipart hanya kalau ada lampiran.

| Endpoint | Body/Query | Response |
|---|---|---|
| `GET get_items_sp/{id_pemesanan}/{idclient}/{idlokasi}` | segmen | `{sp:{...}, rows:[{ID_BARANG, QTY_SISA, IS_FULL, ...}]}` — sisa item SP yang belum diterima penuh |
| `POST save_penerimaan_sp` | `{ID_PEMESANAN, ID_CLIENT, ID_LOKASI, ID_USER, PAJAK?, PAJAK_INCLUDE?, ID_METODE_PEMBAYARAN?, JATUH_TEMPO?(wajib jika kredit), NO_FAKTUR?, LAMPIRAN?, details:[{ID_BARANG, QTY_DITERIMA, SATUAN, HARGA_SATUAN, HARGA_JUAL?, NO_BATCH?, TGL_EXPIRED?, DISKON?, ID_RAK?}]}` — `ID_RAK?` cuma dipakai kalau baris ini membentuk batch baru; kosongkan → backend auto-suggest dari rak batch terakhir barang ini di lokasi yang sama (lihat bagian Rak) | `{NO_PENERIMAAN, IS_FULLY_RECEIVED}` |
| `POST save_penerimaan_tanpa_sp` | sama tanpa `ID_PEMESANAN`, tambah `ID_SUPPLIER` wajib | `{NO_PENERIMAAN}` |
| `POST selesaikan_sp` | `{ID_PEMESANAN, ID_CLIENT, ID_LOKASI}` | `{PERSENTASE}`. Cuma dari `STATUS=3` (Diterima) → `4` (Selesai) |
| `GET get_list_penerimaan_sp/{id_pemesanan}/{idclient}/{idlokasi}` | segmen | Array riwayat penerimaan utk SP itu |
| `GET get_detail_penerimaan_sp/{no_penerimaan}/{idclient}` | segmen | `{header:{...,LAMPIRAN_URL}, details:[...]}` |
| `POST get_list_penerimaan` | body: `{ID_CLIENT, ID_LOKASI?, ID_SUPPLIER?, start_date?, end_date?, search?, jenis?(sp/direct/semua), page?, limit?}` | `{rows:[...gabungan SP+langsung...], total, page, limit, totalPages}` |
| `GET get_summary_penerimaan/{idclient}/{idlokasi}` | segmen | `{MINGGU_INI, BULAN_INI, TAHUN_INI}` masing² `{JUMLAH, TOTAL}` |
| `POST batal_item_penerimaan` | `{NO_PENERIMAAN, ID_BARANG, ID_USER, ID_CLIENT, ID_LOKASI, KETERANGAN_BATAL?}` | `{SEMUA_ITEM_BATAL}` — true kalau item terakhir, otomatis batalkan seluruh penerimaan |
| `POST batal_penerimaan` | `{NO_PENERIMAAN, ID_USER, ID_CLIENT, ID_LOKASI, KETERANGAN_BATAL?}` | `null` |
| `GET get_rekap_supplier?idClient=&idLokasi=&tahun=` | | `{TAHUN, data:[{ID_SUPPLIER, NAMA_SUPPLIER, PER_BULAN:{JAN..DES}, TOTAL, JUMLAH_TRANSAKSI}]}` |
| `GET get_rekap_supplier_detail?idClient=&idLokasi=&tahun=&bulan=&idSupplier=&mode=` | `mode=2` sertakan `ITEMS` per faktur | `{TAHUN, BULAN, NAMA_BULAN, ID_SUPPLIER, MODE, data:[...faktur...]}` |
| `GET get_rekap_barang?idClient=&idLokasi=&tahun=&bulan=` | | `{TAHUN, BULAN, NAMA_BULAN, data:[{ID_BARANG, NAMA_BARANG, KATEGORI, TOTAL_QTY, TOTAL_NILAI, JUMLAH_TRANSAKSI}]}` |
| `GET get_rekap_barang_detail?idClient=&idLokasi=&tahun=&bulan=&idBarang=&mode=` | `mode=2`: per-batch; `mode=1`(default): per-supplier | `{TAHUN, BULAN, ID_BARANG, NAMA_BARANG, SATUAN, MODE, data:[...]}` (404 kalau barang tidak ada) |
| `GET get_rekap_hutang?idClient=&idLokasi=&idSupplier=&groupBy=&search=&statusLunas=&tahun=&bulan=` | `groupBy=pbf` → dikelompokkan per supplier | `{GROUP_BY, RINGKASAN:{...}, data:[...]}` |
| `GET get_detail_hutang_faktur/{no_penerimaan}/{idclient}` | segmen | `{header:{...,SISA_HUTANG}, riwayat:[cicilan]}` |
| `POST bayar_hutang` | `{NO_PENERIMAAN, ID_CLIENT, ID_USER, JUMLAH_BAYAR, TANGGAL_BAYAR?, CATATAN?}` | `{NO_PENERIMAAN, TOTAL_DIBAYAR, SISA_HUTANG, STATUS_LUNAS}` |

---

## 5. Sales / Kasir (`/api/apotek/sales/...`) — 26 endpoint

`ID_METODE_PEMBAYARAN`: `1`=Tunai, `2`=Non-Tunai, `3`=Piutang (global, sama
utk semua client — beda dari `m_metode_pembayaran` RS yang per-client).

⚠️ **Barang konsinyasi tetap terkunci harganya di checkout** — kalau
`SUB_BARCODE` yang dikirim adalah batch titipan (`ID_TITIPAN_DETAIL` terisi),
backend **mengabaikan** `HARGA` yang dikirim FE (pakai `HARGAJUAL` batch) dan
**menolak** kalau `DISCOUNT > 0` untuk baris itu (400: "Barang konsinyasi
tidak boleh didiskon"). FE sebaiknya disable input diskon utk baris yang
diketahui dari batch konsinyasi.

⚠️ **`ringkasan_kasir`/`NAMA_USER` selalu `null`** — lookup nama user dari
`m_login_apotek` dihapus (auth ikut ws_posindo). FE isi nama user dari sesi
login sendiri, jangan andalkan field ini.

### POS Setting & Shift
| Endpoint | Body/Query | Response |
|---|---|---|
| `GET pos_setting?clientId=` | | `{IZINKAN_DISKON_ITEM, IZINKAN_DISKON_BILL, PAKAI_SHIFT, IZINKAN_PIUTANG}` (default semua `1` kalau belum pernah diset) |
| `POST pos_setting` | `{ID_CLIENT, IZINKAN_DISKON_ITEM?, IZINKAN_DISKON_BILL?, PAKAI_SHIFT?, IZINKAN_PIUTANG?}` | `null` |
| `GET shift_aktif?clientId=&lokasiId=&idUser=` | | Objek shift `STATUS=OPEN` milik user itu, atau `null` |
| `POST buka_shift` | `{ID_CLIENT, ID_LOKASI, ID_USER, MODAL_AWAL?}` | `{ID_SHIFT}`. Ditolak kalau masih ada shift OPEN |
| `POST tutup_shift` | `{ID_CLIENT, ID_SHIFT, MODAL_AKHIR, CATATAN?}` | `{MODAL_AKHIR, TOTAL_TUNAI, TOTAL_NONTUNAI, SELISIH, TOTAL_REFUND, TOTAL_OMZET, TOTAL_PIUTANG, PEMASUKAN_LAIN_TUNAI, PENGELUARAN_LAIN_TUNAI, JUMLAH_TRANSAKSI, JUMLAH_TRANSAKSI_REFUND, ...}` |
| `GET riwayat_shift?clientId=&lokasiId=&dateStart=&dateEnd=&limit=` | | Array shift + angka `_LIVE` (real-time, termasuk shift yg masih OPEN) |

### Checkout, Void, Piutang
| Endpoint | Body/Query | Response |
|---|---|---|
| `GET barang_list?clientId=&lokasiId=&search=&page=&limit=` | item-picker kasir (batch-aware); tiap `batches[]` ikut `ID_RAK`/`KODE_RAK`/`NAMA_RAK` | `{rows:[{...,batches:[...]}], page, limit}` |
| `POST checkout` | `{ID_CLIENT, ID_LOKASI, ID_USER, ID_SHIFT?, ID_METODE_PEMBAYARAN?, ID_PELANGGAN?(wajib jika Piutang), POTONGAN?, NOTE?, TOTALBAYAR?, details:[{BARCODE, SUB_BARCODE, QTY, SATUAN?, HARGA, HARGABELI?, DISCOUNT?, DISCOUNT_TYPE?(PERSEN/RUPIAH), NAMA?, MEREK?, JENIS?}], racikan:[{NAMA, JML_BUNGKUS, JASA_RACIK?, BENTUK?, CARA_PAKAI?, bahan:[{BARCODE, SUB_BARCODE, QTY, HARGA, HARGABELI?, NAMA?}]}]}` | `{RECEIPT_NO, GRANDTOTAL, TOTALBAYAR, KEMBALIAN, POTONGAN, POTONGAN_MANUAL, POTONGAN_GROUPING}` |
| `POST void/{receiptNo}` | body `{ID_CLIENT}` (atau `?clientId=`) | `{VOID_AMOUNT}`. Ditolak kalau shift sudah CLOSED atau piutangnya sudah dicicil |
| `POST void_item` | `{ID_TRANSAKSI, ID_DETAIL, ID_CLIENT}` | `{VOID_AMOUNT, HEADER_VOID}` — `HEADER_VOID=true` kalau item terakhir (struk ikut ke-void). Void induk racikan ikut void semua bahannya |
| `POST bayar_piutang` | `{ID_TRANSAKSI, ID_CLIENT, ID_USER, JUMLAH_BAYAR, TANGGAL_BAYAR?, CATATAN?}` | `{LUNAS}` |
| `GET rekap_piutang?clientId=&lokasiId=&statusLunas=&dateStart=&dateEnd=&search=&groupBy=` | `groupBy=pelanggan` | `{GROUP_BY, RINGKASAN, data:[...]}` |
| `GET detail_piutang/{idTransaksi}?clientId=` | | `{...header, RIWAYAT_CICILAN, TOTAL_DIBAYAR, SISA_PIUTANG}` |

### Kas & Laporan
| Endpoint | Body/Query | Response |
|---|---|---|
| `GET buku_kas?clientId=&lokasiId=&dateStart=&dateEnd=` | default bulan berjalan | `{SALDO_AWAL_PERIODE, rows:[...]}` |
| `GET ringkasan_kas?clientId=&lokasiId=&dateStart=&dateEnd=` | | `{...penjualan, PEMASUKAN_LAIN, PENGELUARAN_LAIN, PEMBAYARAN_SUPPLIER, PEMBAYARAN_PIUTANG, SALDO_KAS_BERSIH}` — `SALDO_KAS_BERSIH` real-time, TIDAK ikut filter tanggal |
| `GET laba_rugi?clientId=&lokasiId=&dateStart=&dateEnd=` | | `{PENDAPATAN_PENJUALAN, HPP, LABA_KOTOR, PEMASUKAN_LAIN:[...], PENGELUARAN_LAIN:[...], LABA_BERSIH}` |
| `GET top_selling?clientId=&lokasiId=&dateStart=&dateEnd=&sortBy=&limit=` | `sortBy=qty`\|`nilai` | Array `{BARCODE, NAMA, TOTAL_QTY, TOTAL_NILAI, JUMLAH_TRANSAKSI}` |
| `GET recent_sales?clientId=&lokasiId=&idShift=&limit=` | | Array baris per-item struk (lihat catatan `SISA_GRANDTOTAL`/`BATAL` di `api_laporan_penjualan.md` — sama polanya) |
| `GET ringkasan_kasir?clientId=&lokasiId=&idUser=&idShift=&tglAwal=&tglAkhir=` | wajib scope ke `idUser` yg login | `{ID_USER, NAMA_USER:null, WAKTU_BUKA, WAKTU_TUTUP, MODAL_AWAL, JUMLAH_TRANSAKSI, TOTAL_OMZET, BREAKDOWN_PAYMENT:[...], TRANSAKSI_TERAKHIR:[...(max 20)]}` |

### Transaksi Lain (beban/pendapatan non-penjualan)
| Endpoint | Body/Query | Response |
|---|---|---|
| `GET kategori_transaksi_lain?clientId=` / `POST kategori_transaksi_lain` | create: `{ID_CLIENT, JENIS(PEMASUKAN/PENGELUARAN), TIPE?, NAMA}` | Array / `{ID}` |
| `POST kategori_transaksi_lain_hapus/{id}` | `{ID_CLIENT}` | `null` (soft-delete) |
| `GET transaksi_lain?clientId=&lokasiId=&tglAwal=&tglAkhir=` | | Array |
| `POST transaksi_lain` | `{ID_CLIENT, ID_LOKASI, ID_USER, ID_KATEGORI, TANGGAL?, JUMLAH, KETERANGAN?}` | `{ID}`. Otomatis nempel ke shift aktif user itu kalau ada |
| `POST transaksi_lain_hapus/{id}` | `{ID_CLIENT}` | `null` |

### Pelanggan & Grouping/Tier
| Endpoint | Body/Query | Response |
|---|---|---|
| `GET pelanggan/{id}?clientId=` | | Objek pelanggan + `NAMA_GROUPING`/`PERSEN_DISKON` (404 kalau tidak ada) |
| `GET pelanggan_search?clientId=&q=` | cari nama/NIK/no HP | Array (max 20) |
| `POST pelanggan` | `{ID_CLIENT, NAMA, NO_HP?, ALAMAT?, TANGGAL_LAHIR?, JENIS_KELAMIN?, NIK?, CATATAN?, IS_RESELLER?, ID_GROUPING_PELANGGAN?, ID?(isi utk update)}` | `{ID}` |
| `GET grouping_pelanggan?clientId=` | | Array tier `{ID, NAMA, PERSEN_DISKON}` |
| `POST grouping_pelanggan` | `{ID_CLIENT, NAMA, PERSEN_DISKON, ID?(update)}` | `{ID}` |
| `POST grouping_pelanggan_hapus/{id}` | `{ID_CLIENT}` | `null`. Ditolak kalau masih dipakai pelanggan aktif |

Diskon tier: kalau `ID_PELANGGAN` yang di-checkout sudah punya
`ID_GROUPING_PELANGGAN`, `PERSEN_DISKON` tier itu otomatis ditambahkan ke
`POTONGAN` (di luar `POTONGAN` manual kasir) — lihat `POTONGAN_GROUPING` di
response `checkout`.

---

## 6. Konsinyasi (`/api/apotek/konsinyasi/...`) — 11 endpoint

Modul titipan PBF — **berdiri sendiri**, tidak numpang Penerimaan/Hutang.
Alur: **terima titipan → dijual di kasir (Sales/checkout) → laku masuk
`generate_settlement` / tidak laku jadi `retur_titipan` → settlement per PBF
per periode (draft, boleh digenerate ulang, lalu final) → `bayar_settlement`**.

| Endpoint | Body/Query | Response |
|---|---|---|
| `POST terima_titipan` | `{ID_SUPPLIER, ID_CLIENT, ID_LOKASI, TANGGAL?, CATATAN?, ID_USER?, DETAILS:[{ID_BARANG, QTY_TITIP, BATCH_NUMBER?, TGL_EXPIRED?, HARGA_JUAL_SEPAKAT, HARGA_BELI_SEPAKAT, ID_RAK?}]}` — `ID_RAK?` opsional sama pola dgn Penerimaan biasa: kosongkan → backend auto-suggest dari rak batch terakhir barang ini di lokasi yang sama (lihat bagian Rak) | `{ID, NO_TITIPAN, DETAILS:[{ID, SUB_BARCODE, ID_BARANG, QTY_TITIP}]}`. `HARGA_BELI_SEPAKAT` tidak boleh > `HARGA_JUAL_SEPAKAT` |
| `GET list_titipan?clientId=&lokasiId=&idSupplier=&status=` | `status`=`AKTIF`/`BATAL` | Array titipan + `DETAILS[]` (tiap detail bawa `SISA_QTY`, `PERSEN_KOMISI_TERSIRAT`) |
| `GET detail_titipan/{id}?clientId=` | | Objek titipan + `DETAILS[]` (404 kalau tidak ada) |
| `POST retur_titipan` | `{ID_TITIPAN_DETAIL, QTY_RETUR, ID_CLIENT, ID_LOKASI, TANGGAL?, ALASAN?, ID_USER?}` | `{NO_RETUR}`. **1 panggilan = 1 batch** — retur multi-item = panggil berkali-kali dari FE |
| `GET list_retur?clientId=&idLokasi=&dateStart=&dateEnd=` | | Array retur |
| `POST generate_settlement` | `{ID_SUPPLIER, ID_CLIENT, ID_LOKASI, TANGGAL_MULAI, TANGGAL_SELESAI, ID_USER?}` | `{ID, JUMLAH_ITEM, TOTAL_KOMISI_APOTEK, TOTAL_SETOR_PBF}`. **Idempotent selama DRAFT** — boleh dipanggil berkali-kali (dipakai jg buat "preview" tanpa harus difinalisasi) |
| `DELETE delete_settlement/{id}?clientId=` | | `null`. Cuma boleh kalau masih `DRAFT` |
| `POST finalize_settlement/{id}` | `{ID_CLIENT}` | `null`. Mengunci settlement, hutang riil ke PBF resmi terbentuk. Ditolak kalau `TOTAL_SETOR_PBF <= 0` atau sudah FINAL |
| `POST bayar_settlement` | `{ID_SETTLEMENT, ID_CLIENT, ID_USER, JUMLAH_BAYAR, TANGGAL_BAYAR?, CATATAN?}` | `{TOTAL_DIBAYAR, SISA_SETOR, STATUS_LUNAS}`. Wajib `FINAL` dulu |
| `GET rekap_settlement?clientId=&idSupplier=&status=&statusLunas=` | | Array settlement + `TOTAL_DIBAYAR`, `SISA_SETOR` |
| `GET detail_settlement/{id}?clientId=` | | `{...header, DETAILS:[...item terjual], RIWAYAT_PEMBAYARAN:[...]}` |

⚠️ **Belum ada penjualan konsinyasi kalau modul Sales/Penerimaan belum
dipakai sungguhan** — `generate_settlement` cuma menemukan item lewat
`t_details_trans_apotek` yang `SUB_BARCODE`-nya balik ke `terima_titipan`.

---

## 7. Stock Opname (`/api/apotek/StockOpname/...`) — 7 endpoint

Per-`SUB_BARCODE` per-bulan (`BULAN_TAHUN`, format `YYYY-MM`), langsung
diterapkan ke stok saat disimpan — **tidak ada approval/header terpisah**.
`simpan` **hanya berlaku utk bulan berjalan** (400 kalau kirim bulan
lain) — endpoint lihat-lihat (`barang_list`/`batch_list`/`riwayat*`) bebas
bulan apa saja.

| Endpoint | Body/Query | Response |
|---|---|---|
| `GET barang_list?clientId=&idLokasi=&bulanTahun=YYYY-MM&page=&limit=&search=&kategori=&idRak=` | `idRak` opsional — batasi ke barang yang punya minimal satu batch aktif di rak itu (jalur opname "per kategori"; lihat `batch_list_by_rak` di bawah utk jalur "per rak") | `{ITEMS:[{...,JUMLAH_BATCH,JUMLAH_BATCH_SUDAH,TOTAL_QTY_SISTEM}], TOTAL, PAGE, LIMIT}`. Barang `KATEGORI_BESAR=JASA` otomatis dikecualikan |
| `GET kategori_list?clientId=&idLokasi=` | `idLokasi` opsional (kosong = se-client) | Array nama kategori |
| `GET batch_list?clientId=&idLokasi=&barcode=&bulanTahun=YYYY-MM` | | `{BARANG:{...}, BATCHES:[{...,STTS:'SUDAH'/'BELUM', QTY_FISIK?, SELISIH?, TERAKHIR_DIHITUNG?}]}` |
| `GET batch_list_by_rak?clientId=&idLokasi=&idRak=&bulanTahun=YYYY-MM` | Jalur opname "jalan per rak" — hitung fisik rak demi rak, lintas-barang, alternatif dari `barang_list`+`batch_list` yang jalan per-item | `{RAK:{...}, BATCHES:[{...,BARCODE,NAMA_BARANG,STTS:'SUDAH'/'BELUM', QTY_FISIK?, SELISIH?, TERAKHIR_DIHITUNG?}]}` |
| `POST simpan` | `{ID_CLIENT, ID_LOKASI, ID_USER?, BULAN_TAHUN, ITEMS:[{SUB_BARCODE, QTY, SATUAN?, CATATAN?}]}` | `{JUMLAH_ITEM, DETAIL:[{SUB_BARCODE, QTY_SISTEM_LAMA, QTY_FISIK_BARU, SELISIH}]}` |
| `GET riwayat_transaksi?clientId=&idLokasi=&bulanTahun=&kategori=&idUser=&search=&page=&limit=` | laporan lintas-transaksi (bukan cuma 1 batch) | `{ITEMS:[...], TOTAL, PAGE, LIMIT}` |
| `GET riwayat?clientId=&idLokasi=&subBarcode=&bulanTahun=YYYY-MM` | panel kecil di `batch_list` | Array percobaan hitung bulan itu, terbaru dulu |
| `POST void_riwayat` | `{ID_CLIENT, ID_LOKASI, SUB_BARCODE, TANGGAL_OPNAME}` (`TANGGAL_OPNAME` dari `TERAKHIR_DIHITUNG` di `batch_list`) | `null`. Soft-delete, **TIDAK membalikkan stok** |

---

## 8. ClientRegistration — Subscription (`/api/apotek/ClientRegistration/subscription`)

Owner only. Append-only: 1 baris = 1 pendaftaran/perpanjangan = 1 invoice.

| Endpoint | Body/Query | Response |
|---|---|---|
| `GET subscription?clientId=` | | Array baris `{ID, ID_CLIENT, TANGGAL_MULAI, TANGGAL_BERAKHIR, PAKET, HARGA, CATATAN, NO_INVOICE, CREATED_AT, CREATED_BY}`, `TANGGAL_BERAKHIR` terjauh dulu. `NO_INVOICE` bisa `null` utk baris lama yang belum di-backfill |
| `POST subscription` | `{IDCLIENT, TANGGAL_BERAKHIR, TANGGAL_MULAI?, PAKET?, HARGA?, CATATAN?}` | `{ID, NO_INVOICE}`. `NO_INVOICE` digenerate BE: `INV/SUB/{YYYYMM}/{urut 4 digit per bulan}` (bulan = bulan input, bukan `TANGGAL_MULAI`), unik |

---

## Checklist migrasi FE

- [ ] Semua endpoint di atas **baru** — belum ada base path lama yang perlu di-redirect
- [ ] Pakai response envelope standar `{metadata, response}` di semua modul — TIDAK ada shape khusus seperti `rekap_piutang` di `LaporanPenjualan`
- [ ] Halaman Pemesanan: dropdown item-picker filter `jenis_sp` cuma 4 opsi (`BRG`/`PSI`/`PRE`/`NAR`), dan wajib exclude barang `KATEGORI_BESAR=JASA` dari picker SP
- [x] Halaman "Otorisasi SP": form (username, password) — verifikasi NIP+PWD ke `m_login`, sama seperti pola RS (`TtdDigitalComponent.vue`/`otorisasi_suratpemesanan`), cuma dieksekusi lokal di backend apotek
- [ ] Halaman kasir: disable input diskon utk baris yang `SUB_BARCODE`-nya batch konsinyasi (kalau FE tahu dari flag/lookup terpisah — endpoint checkout sendiri yang menegakkan aturannya di backend)
- [ ] `ringkasan_kasir.NAMA_USER` selalu `null` — pakai nama dari sesi login FE sendiri
- [ ] Halaman baru yang perlu dibuat dari nol (belum ada di sistem RS): Konsinyasi (titipan/retur/settlement) dan Stock Opname (per-bulan, per-batch)
