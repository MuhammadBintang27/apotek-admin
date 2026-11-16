<template>
  <div class="content">
    <loading_overlay :is-loading="loading" message="Memproses..." />

    <AppPageHeader
      :title="isNewClient ? 'Tambah Client Apotek Baru' : `Edit Client${clientName ? ' — ' + clientName : ''}`"
      :subtitle="isNewClient ? 'Daftarkan apotek baru: profil, lokasi, sub-setting & POS setting' : `ID Client: ${activeClientId}`"
      :icon="isNewClient ? 'fas fa-plus-circle' : 'fas fa-store'"
    >
      <template #actions>
        <Button label="Kembali ke Daftar" icon="pi pi-arrow-left" severity="secondary" outlined size="small" @click="goBack()" />
      </template>
    </AppPageHeader>

    <!--
      Urutan yang WAJIB dari kontrak backend (lihat api_apotek.md, versi dengan IS_NEW_CLIENT):
      untuk client baru, ID_CLIENT SEKARANG DIGENERATE SERVER lewat POST save di step Profil
      (proceedFromProfile) — bukan diketik user lagi. Begitu itu selesai, activeClientId terisi
      dan isNewClient jadi false, jadi step Lokasi/Sub-Setting/User Pertama semuanya berjalan
      seperti mode edit biasa (lokasi & user pertama sudah pasti nempel ke client yang beneran
      ada, bukan ID sembarangan yang belum tentu terdaftar seperti pola lama). Itu satu-satunya
      hard gate — ditegakkan lewat guard di openAddLokasi()/submitBootstrapUser() yang menolak
      kalau activeClientId belum ada — jadi step header di sini bebas diklik pindah-pindah kapan
      saja (non-linear), sama kayak pola tab di SIMRS. Tombol "Lanjut"/"Kembali" di tiap step
      cuma kenyamanan urutan baca, bukan gate.
    -->
    <Stepper :value="activeStep" :linear="false" class="cr-stepper-wrap">
      <StepList>
        <Step value="1">Profil Client</Step>
        <Step value="2">Lokasi</Step>
        <Step value="3">Sub-Setting & POS</Step>
        <Step value="4">Review & Submit</Step>
        <Step value="5">User Pertama</Step>
      </StepList>

      <StepPanels>
        <!-- ══════════ STEP 1: PROFIL CLIENT ══════════ -->
        <StepPanel v-slot="{ activateCallback }" value="1">
          <div class="row mt-3">
            <div class="col-md-8">
              <!-- Informasi Umum -->
              <Panel class="mb-2">
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-info-circle me-1 mr-1"></i>
                    <strong>INFORMASI UMUM</strong>
                  </h6>
                </template>
                <div class="row">
                  <div class="col-md-6 mb-3" v-for="f in profileTextFields" :key="f.key">
                    <label class="form-label">{{ f.label }} <span v-if="f.required" class="required">*</span></label>
                    <InputText
                      v-model="profileForm[f.key]"
                      class="form-control w-100"
                      :maxlength="f.maxlength"
                      :placeholder="f.placeholder"
                      :disabled="loading"
                    />
                    <small v-if="f.hint" class="form-text text-muted">{{ f.hint }}</small>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Tipe Klien</label>
                    <Select
                      v-model="profileForm.TIPE_KLIEN"
                      :options="['APOTEK', 'GROSIR']"
                      class="w-100"
                      :disabled="loading"
                    />
                    <small class="form-text text-muted">GROSIR menyembunyikan fitur & istilah obat di aplikasi kasir.</small>
                  </div>
                </div>
                <hr />
                <div class="row">
                  <div class="col-md-6 mb-2" v-for="f in profileToggleFields" :key="f.key">
                    <div class="setting-row-inline">
                      <span class="setting-row-label">{{ f.label }}</span>
                      <ToggleSwitch v-model="profileForm[f.key]" :disabled="loading" />
                    </div>
                  </div>
                </div>
              </Panel>

              <!-- Integrasi Satu Sehat -->
              <Panel class="mb-2" toggleable :collapsed="true">
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-heart me-1 mr-1"></i>
                    <strong>INTEGRASI SATU SEHAT (OPSIONAL)</strong>
                  </h6>
                </template>
                <div class="row">
                  <div class="col-md-6 mb-3" v-for="f in satuSehatTextFields" :key="f.key">
                    <label class="form-label">{{ f.label }}</label>
                    <InputText v-model="profileForm[f.key]" class="form-control w-100" :disabled="loading" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Client Secret Satu Sehat</label>
                    <Password
                      v-model="profileForm.SATU_SEHAT_CLIENT_SECRET"
                      class="w-100"
                      inputClass="w-100"
                      :feedback="false"
                      toggleMask
                      :disabled="loading"
                    />
                  </div>
                </div>
              </Panel>

              <!-- Integrasi APOL / BPOM -->
              <Panel toggleable :collapsed="true">
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-shield me-1 mr-1"></i>
                    <strong>INTEGRASI APOL / BPOM (OPSIONAL)</strong>
                  </h6>
                </template>
                <div class="row">
                  <div class="col-md-6 mb-3" v-for="f in apolTextFields" :key="f.key">
                    <label class="form-label">{{ f.label }}</label>
                    <InputText v-model="apolForm[f.key]" class="form-control w-100" :disabled="loading" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Secret Key APOL</label>
                    <Password
                      v-model="apolForm.SCRET_KEY"
                      class="w-100"
                      inputClass="w-100"
                      :feedback="false"
                      toggleMask
                      :disabled="loading"
                    />
                  </div>
                </div>
              </Panel>
            </div>

            <div class="col-md-4">
              <Panel>
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-bars me-1 mr-1"></i>
                    <strong>AKSI</strong>
                  </h6>
                </template>
                <p class="info-note">
                  {{
                    isNewClient
                      ? 'Belum disimpan ke server. ID Client akan digenerate otomatis begitu tombol di bawah diklik — sesudahnya baru lokasi & user pertama bisa ditambahkan.'
                      : 'Ubah profil lalu lanjut ke step lain sesuai kebutuhan. Perubahan profil baru tersimpan setelah klik Simpan Perubahan di step Review & Submit.'
                  }}
                </p>
                <div class="aksi-actions">
                  <Button size="small"
                    :label="isNewClient ? 'Buat Client & Lanjut ke Lokasi' : 'Lanjut ke Lokasi'"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    @click="proceedFromProfile(activateCallback)"
                    :loading="creatingClient"
                    :disabled="loading || creatingClient"
                  />
                </div>
              </Panel>
            </div>
          </div>
        </StepPanel>

        <!-- ══════════ STEP 2: LOKASI ══════════ -->
        <StepPanel v-slot="{ activateCallback }" value="2">
          <div class="mt-3">
            <div class="d-flex justify-content-end mb-2">
              <Button size="small" label="Tambah Lokasi" icon="pi pi-plus" @click="openAddLokasi()" />
            </div>
            <Panel class="mb-2">
              <template #header>
                <h6 style="color: var(--sky-600); margin: 0">
                  <i class="pi pi-map-marker me-1 mr-1"></i>
                  <strong>DAFTAR LOKASI ({{ lokasiList.length }})</strong>
                </h6>
              </template>
              <DataTable :value="lokasiList" :loading="lokasiLoading" responsiveLayout="scroll">
                <Column field="LOKASI" header="Lokasi" sortable />
                <Column field="JENIS_LOKASI" header="Jenis" />
                <Column header="Induk">
                  <template #body="{ data }">
                    <Tag
                      :severity="getLokasiExtra(data.LOKASI_ID).INDUK ? 'success' : 'secondary'"
                      :value="getLokasiExtra(data.LOKASI_ID).INDUK ? 'Ya' : 'Tidak'"
                      v-tooltip="'GET lokasi tidak mengembalikan field ini — status cuma akurat kalau kamu ubah lokasi ini di sesi sekarang'"
                    />
                  </template>
                </Column>
                <Column header="HQ">
                  <template #body="{ data }">
                    <Tag :severity="isTruthy(data.IS_HQ) ? 'success' : 'secondary'" :value="isTruthy(data.IS_HQ) ? 'Ya' : 'Tidak'" />
                  </template>
                </Column>
                <Column header="Depo">
                  <template #body="{ data }">
                    <Tag :severity="isTruthy(data.IS_DEPO) ? 'success' : 'secondary'" :value="isTruthy(data.IS_DEPO) ? 'Ya' : 'Tidak'" />
                  </template>
                </Column>
                <Column header="Visible">
                  <template #body="{ data }">
                    <Tag :severity="isTruthy(data.VISIBLE) ? 'success' : 'danger'" :value="isTruthy(data.VISIBLE) ? 'Ya' : 'Tidak'" />
                  </template>
                </Column>
                <Column header="Aksi" style="width: 70px">
                  <template #body="{ data }">
                    <div class="action-btns">
                      <Button
                        icon="pi pi-pencil"
                        size="small"
                        text
                        rounded
                        severity="warning"
                        v-tooltip.top="'Edit Lokasi'"
                        @click="openEditLokasi(data)"
                      />
                    </div>
                  </template>
                </Column>

                <template #empty>
                  <div class="p-4 text-center" style="color: #94a3b8">
                    <i class="pi pi-inbox me-2" style="font-size: 1.5rem"></i>
                    <p>Belum ada lokasi. Tambahkan minimal 1 lokasi dan jadikan salah satunya Induk.</p>
                  </div>
                </template>
              </DataTable>
            </Panel>
            <div class="info-box mb-3">
              <i class="pi pi-info-circle me-1"></i>
              Cuma lokasi <strong>Induk</strong> yang boleh dipakai untuk "Tambah Barang" nanti.
              <span v-if="isNewClient">Minimal satu lokasi harus jadi induk sebelum submit final.</span>
              <span v-else>
                Catatan: endpoint <code>GET lokasi</code> apotek ini tidak mengembalikan field Induk/Kategori
                Barang/Potong Stock (di-whitelist di backend), jadi kolom Induk di tabel ini cuma akurat untuk
                lokasi yang kamu tambah/edit di sesi sekarang — bukan hasil baca ulang dari server.
              </span>
            </div>
            <div class="d-flex justify-content-between">
              <Button size="small" label="Kembali" icon="pi pi-arrow-left" severity="secondary" outlined @click="activateCallback('1')" />
              <Button size="small"
                label="Lanjut ke Sub-Setting & POS"
                icon="pi pi-arrow-right"
                iconPos="right"
                @click="goToSubSetting(activateCallback)"
              />
            </div>
          </div>
        </StepPanel>

        <!-- ══════════ STEP 3: SUB-SETTING & POS SETTING ══════════ -->
        <StepPanel v-slot="{ activateCallback }" value="3">
          <div class="row mt-3">
            <div class="col-md-8">
              <Panel class="mb-2">
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-sliders-h me-1 mr-1"></i>
                    <strong>SUB-SETTING PER LOKASI</strong>
                  </h6>
                </template>
                <DataTable :value="lokasiList" responsiveLayout="scroll">
                  <Column field="LOKASI" header="Lokasi" />
                  <Column header="Hanya Cek Harga Sebelum Tulis Baru" style="width: 260px">
                    <template #body="{ data }">
                      <ToggleSwitch v-model="subSettingState[data.LOKASI_ID]" :disabled="loading" />
                    </template>
                  </Column>
                  <template #empty>
                    <div class="p-4 text-center" style="color: #94a3b8">
                      <p>Belum ada lokasi — kembali ke step Lokasi untuk menambahkan.</p>
                    </div>
                  </template>
                </DataTable>
              </Panel>

              <Panel>
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-shopping-cart me-1 mr-1"></i>
                    <strong>POS SETTING (BERLAKU UNTUK SELURUH CLIENT)</strong>
                  </h6>
                </template>
                <div class="setting-row" v-for="f in posSettingFields" :key="f.key">
                  <div class="setting-row-text">
                    <div class="setting-row-label">{{ f.label }}</div>
                    <div class="setting-row-desc">{{ f.desc }}</div>
                  </div>
                  <ToggleSwitch v-model="posSettingForm[f.key]" :disabled="loading" />
                </div>
              </Panel>
            </div>
            <div class="col-md-4">
              <Panel>
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-bars me-1 mr-1"></i>
                    <strong>AKSI</strong>
                  </h6>
                </template>
                <p class="info-note">
                  Field yang tidak diubah akan tetap memakai nilai lama saat submit (merge), bukan direset ke default.
                </p>
                <div class="aksi-actions">
                  <Button size="small"
                    label="Lanjut ke Review & Submit"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    @click="activateCallback('4')"
                  />
                  <Button size="small" label="Kembali" icon="pi pi-arrow-left" severity="secondary" outlined @click="activateCallback('2')" />
                </div>
              </Panel>
            </div>
          </div>
        </StepPanel>

        <!-- ══════════ STEP 4: REVIEW & SUBMIT ══════════ -->
        <StepPanel v-slot="{ activateCallback }" value="4">
          <div class="row mt-3">
            <div class="col-md-8">
              <Panel class="mb-2">
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-eye me-1 mr-1"></i>
                    <strong>RINGKASAN</strong>
                  </h6>
                </template>
                <dl class="review-details">
                  <dt>ID Client</dt>
                  <dd>{{ effectiveClientId ?? '-' }}</dd>

                  <dt>Nama Apotek</dt>
                  <dd>{{ profileForm.NAMA_APOTEK || '-' }}</dd>

                  <dt>Alamat</dt>
                  <dd>{{ profileForm.ALAMAT || '-' }}</dd>

                  <dt>Jumlah Lokasi</dt>
                  <dd>
                    {{ lokasiList.length }} lokasi
                    <span v-if="!hasInduk" class="text-danger">— belum ada lokasi Induk!</span>
                  </dd>

                  <dt>Lokasi</dt>
                  <dd>
                    <Tag
                      v-for="l in lokasiList"
                      :key="l.LOKASI_ID"
                      :value="l.LOKASI + (getLokasiExtra(l.LOKASI_ID).INDUK ? ' (Induk)' : '')"
                      :severity="getLokasiExtra(l.LOKASI_ID).INDUK ? 'success' : 'secondary'"
                      style="margin: 0 6px 6px 0"
                    />
                    <span v-if="lokasiList.length === 0">-</span>
                  </dd>

                  <dt>POS Setting</dt>
                  <dd>
                    <Tag
                      v-for="f in posSettingFields"
                      :key="f.key"
                      :value="`${f.label}: ${posSettingForm[f.key] ? 'Aktif' : 'Nonaktif'}`"
                      :severity="posSettingForm[f.key] ? 'success' : 'secondary'"
                      style="margin: 0 6px 6px 0"
                    />
                  </dd>
                </dl>
              </Panel>

              <!-- LANGGANAN (SUBSCRIPTION) — cuma nambah baris baru, tidak pernah menimpa riwayat lama.
                   Baru muncul begitu client sudah punya ID (selalu benar di step ini, karena Step 1
                   sudah bikin client + ID_CLIENT sebelum step manapun lain bisa diakses secara berarti). -->
              <Panel v-if="effectiveClientId" class="mb-2">
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-calendar-plus me-1 mr-1"></i>
                    <strong>LANGGANAN (SUBSCRIPTION)</strong>
                  </h6>
                </template>
                <div v-if="subscriptionLoading" class="p-3 text-center" style="color: #94a3b8">
                  <i class="pi pi-spin pi-spinner me-1"></i> Memuat riwayat langganan...
                </div>
                <DataTable v-else :value="subscriptionHistory" size="small" responsiveLayout="scroll">
                  <Column field="TANGGAL_MULAI" header="Mulai" />
                  <Column field="TANGGAL_BERAKHIR" header="Berakhir" />
                  <Column field="PAKET" header="Paket" />
                  <Column header="Harga">
                    <template #body="{ data }">{{ formatRupiah(data.HARGA) }}</template>
                  </Column>
                  <Column field="CATATAN" header="Catatan" />
                  <Column header="" style="width: 90px">
                    <template #body="{ data }">
                      <Button size="small" text icon="pi pi-print" label="Invoice"
                        @click="printInvoice(data, { ID_CLIENT: effectiveClientId, NAMA_APOTEK: profileForm.NAMA_APOTEK, ALAMAT: profileForm.ALAMAT })" />
                    </template>
                  </Column>
                  <template #empty>
                    <div class="p-3 text-center" style="color: #94a3b8">Belum ada riwayat langganan.</div>
                  </template>
                </DataTable>
                <hr />
                <p class="info-note">
                  Baris baru dipakai untuk pendaftaran pertama maupun perpanjangan — riwayat lama tidak pernah
                  ditimpa. Kosongkan Tanggal Mulai supaya server otomatis menyambung dari langganan aktif
                  terakhir (atau hari ini kalau ini yang pertama).
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
                <div class="d-flex justify-content-end">
                  <Button size="small"
                    label="Simpan Langganan"
                    icon="pi pi-save"
                    @click="submitSubscription()"
                    :loading="subscriptionSaving"
                  />
                </div>
              </Panel>
            </div>
            <div class="col-md-4">
              <Panel>
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-bars me-1 mr-1"></i>
                    <strong>AKSI</strong>
                  </h6>
                </template>
                <div class="aksi-actions">
                  <Button size="small"
                    label="Simpan Perubahan"
                    icon="pi pi-save"
                    @click="submitFinal()"
                    :loading="loading"
                    :disabled="loading"
                  />
                  <Button size="small"
                    v-if="effectiveClientId"
                    label="Lanjut ke User Pertama"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    severity="secondary"
                    outlined
                    @click="activateCallback('5')"
                    :disabled="loading"
                  />
                  <Button size="small" label="Kembali" icon="pi pi-arrow-left" severity="secondary" outlined @click="activateCallback('3')" :disabled="loading" />
                </div>
                <small v-if="!hasInduk" class="form-text text-danger d-block mt-2">
                  Belum ada lokasi Induk — sebaiknya tambahkan minimal 1 sebelum client ini dipakai untuk transaksi.
                </small>
              </Panel>
            </div>
          </div>
        </StepPanel>

        <!-- ══════════ STEP 5: USER PERTAMA (BOOTSTRAP, OWNER) ══════════ -->
        <StepPanel v-slot="{ activateCallback }" value="5">
          <div class="row mt-3">
            <div class="col-md-8">
              <div v-if="!effectiveClientId" class="info-box">
                <i class="pi pi-info-circle me-1"></i>
                Simpan client di step Review & Submit dulu (butuh ID Client valid) sebelum bisa bootstrap user pertama.
              </div>
              <Panel v-else class="mb-2">
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-user-plus me-1 mr-1"></i>
                    <strong>BOOTSTRAP USER PERTAMA</strong>
                  </h6>
                </template>
                <p class="info-note">
                  Endpoint <code>POST /api/apotek/user</code> dengan <code>ID_CLIENT</code> eksplisit — satu-satunya
                  cara membuat user pertama client baru (owner belum tentu terikat ke client manapun). Setelah dibuat,
                  user ini bisa login dan menambah user lain lewat layar Manajemen User biasa.
                </p>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Nama User <span class="required">*</span></label>
                    <InputText v-model="bootstrapForm.NAMA_USER" class="form-control w-100" :disabled="bootstrapSaving" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Username <span class="required">*</span></label>
                    <!-- Backend nempelin prefix "{ID_CLIENT}-" otomatis (M_user_apotek::build_username())
                         supaya USERNAME yang unik-global gak bentrok antar client — sama kayak Username
                         di UserManajemenView.vue, FE cuma nampilin prefix, user cukup ketik sisanya. -->
                    <InputGroup>
                      <InputGroupAddon>{{ bootstrapUsernamePrefix }}</InputGroupAddon>
                      <InputText v-model="bootstrapForm.USERNAME" placeholder="mis. bintang" :disabled="bootstrapSaving" />
                    </InputGroup>
                    <small class="form-text text-muted">
                      Username final: <strong>{{ bootstrapUsernamePrefix }}{{ bootstrapForm.USERNAME || '...' }}</strong>
                    </small>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Password <span class="required">*</span></label>
                    <Password
                      v-model="bootstrapForm.PWD"
                      class="w-100"
                      inputClass="w-100"
                      :feedback="false"
                      toggleMask
                      :disabled="bootstrapSaving"
                    />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Profesi</label>
                    <InputText v-model="bootstrapForm.PROFESI" class="form-control w-100" placeholder="mis. Apoteker, Admin" :disabled="bootstrapSaving" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">No. SIPA</label>
                    <InputText v-model="bootstrapForm.NO_SIPA" class="form-control w-100" :disabled="bootstrapSaving" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Lokasi</label>
                    <Select
                      v-model="bootstrapForm.ID_LOKASI"
                      :options="lokasiList"
                      optionLabel="LOKASI"
                      optionValue="LOKASI_ID"
                      placeholder="Semua Lokasi"
                      class="w-100"
                      showClear
                      :disabled="bootstrapSaving"
                    />
                    <small class="form-text text-muted">Kosongkan supaya user bisa akses semua lokasi client ini.</small>
                  </div>
                </div>
              </Panel>

              <!-- Muncul begitu user pertama berhasil dibuat — assign menu-nya langsung di sini,
                   sekalian, tanpa harus pindah ke layar Assign Menu terpisah. -->
              <Panel v-if="bootstrapUserId" class="mb-2">
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-sitemap me-1 mr-1"></i>
                    <strong>ASSIGN MENU — {{ bootstrapUsername }}</strong>
                  </h6>
                </template>
                <p class="info-note">
                  User <strong>{{ bootstrapUsername }}</strong> berhasil dibuat. Centang menu yang boleh diakses,
                  lalu Simpan — user ini bisa login dan menambah user lain lewat layar Manajemen User biasa.
                </p>
                <div v-if="loadingMenus" class="p-3 text-center" style="color:#94a3b8">
                  <i class="pi pi-spin pi-spinner me-1"></i> Memuat daftar menu...
                </div>
                <template v-else>
                  <div class="d-flex justify-content-end gap-2 mb-2">
                    <Button label="Pilih Semua" size="small" text @click="menuSelectAll()" />
                    <Button label="Hapus Semua" size="small" text severity="secondary" @click="menuClearAll()" />
                  </div>
                  <div class="bootstrap-menu-tree">
                    <div v-for="parent in bootstrapMenuTree" :key="parent.id" class="bm-group">
                      <div class="bm-parent-row">
                        <Checkbox
                          v-if="parent.children.length === 0"
                          :modelValue="bootstrapSelectedMenuIds.has(Number(parent.id))"
                          :binary="true"
                          @change="menuToggle(parent.id)"
                        />
                        <span v-else class="bm-spacer"></span>
                        <span class="bm-title">{{ parent.title }}</span>
                      </div>
                      <div v-if="parent.children.length" class="bm-children">
                        <div v-for="child in parent.children" :key="child.id" class="bm-child-row">
                          <Checkbox
                            :modelValue="bootstrapSelectedMenuIds.has(Number(child.id))"
                            :binary="true"
                            @change="menuToggle(child.id)"
                          />
                          <span class="bm-title">{{ child.title }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <Button
                    label="Buat User Lain"
                    icon="pi pi-user-plus"
                    text
                    severity="secondary"
                    @click="resetBootstrapPanel()"
                    :disabled="menuSaving"
                  />
                  <Button size="small"
                    :label="menuSaving ? 'Menyimpan...' : `Simpan Menu (${bootstrapSelectedMenuIds.size})`"
                    icon="pi pi-save"
                    @click="submitBootstrapMenus()"
                    :loading="menuSaving"
                    :disabled="menuSaving || bootstrapSelectedMenuIds.size === 0"
                  />
                </div>
              </Panel>
            </div>
            <div class="col-md-4">
              <Panel>
                <template #header>
                  <h6 style="color: var(--sky-600); margin: 0">
                    <i class="pi pi-bars me-1 mr-1"></i>
                    <strong>AKSI</strong>
                  </h6>
                </template>
                <div class="aksi-actions">
                  <Button size="small"
                    v-if="!bootstrapUserId"
                    label="Buat User Pertama"
                    icon="pi pi-user-plus"
                    @click="submitBootstrapUser()"
                    :loading="bootstrapSaving"
                    :disabled="!effectiveClientId || bootstrapSaving"
                  />
                  <Button size="small" label="Kembali" icon="pi pi-arrow-left" severity="secondary" outlined @click="activateCallback('4')" :disabled="bootstrapSaving" />
                </div>
              </Panel>
            </div>
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>

    <!-- ══ DIALOG TAMBAH / EDIT LOKASI ══ -->
    <Dialog
      v-model:visible="showAddLokasiDialog"
      :header="editingLokasiId ? 'Edit Lokasi' : 'Tambah Lokasi Baru'"
      :modal="true"
      :style="{ width: '40rem' }"
    >
      <div class="row">
        <div class="col-md-12 mb-3">
          <label class="form-label">Nama Lokasi <span class="required">*</span></label>
          <InputText v-model="lokasiForm.LOKASI" class="form-control w-100" :disabled="lokasiSaving" />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Jenis Lokasi</label>
          <InputText v-model="lokasiForm.JENIS_LOKASI" class="form-control w-100" :disabled="lokasiSaving" />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Kategori Barang</label>
          <InputText v-model="lokasiForm.KATEGORI_BARANG" class="form-control w-100" :disabled="lokasiSaving" />
        </div>

        <div class="col-md-12 mt-2 mb-1">
          <hr class="my-2" />
        </div>
        <div class="col-md-6 mb-2" v-for="f in lokasiToggleFields" :key="f.key">
          <div class="setting-row-inline">
            <span class="setting-row-label">{{ f.label }}</span>
            <ToggleSwitch v-model="lokasiForm[f.key]" :disabled="lokasiSaving" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button size="small" label="Batal" severity="secondary" outlined @click="showAddLokasiDialog = false" :disabled="lokasiSaving" />
        <Button size="small" label="Simpan" icon="pi pi-save" @click="submitLokasiForm()" :loading="lokasiSaving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'
import { useConfigStore } from '@/stores/config'
import { useClientSubscription } from '@/composables/useClientSubscription'
import ToggleSwitch from 'primevue/toggleswitch'
import DatePicker from 'primevue/datepicker'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const configStore = useConfigStore()

// Kontrak lengkap flow "Tambah Client Apotek Baru" — lihat api_apotek.md.
const apiUrl = computed(() => `${configStore.apiApotikUrl}/index.php/api/apotek/ClientRegistration`)

const showSuccess = (msg) => toast.add({ severity: 'success', summary: 'Berhasil', detail: msg, life: 3000 })
const showError = (msg) => toast.add({ severity: 'error', summary: 'Gagal', detail: msg, life: 5000 })

const isTruthy = (v) => String(v ?? '') === '1' || v === true

// ══ STATE UMUM ══
const loading = ref(false)
const activeStep = ref('1')
const clientName = ref('')
// activeClientId cuma diisi kalau mode edit (dari route) ATAU setelah client baru berhasil dibuat
// di step Profil (proceedFromProfile) — isNewClient turunan dari sini, BUKAN dari route, supaya
// begitu client baru selesai dibuat, form langsung "pindah" ke mode edit tanpa remount.
// Number("") atau Number(undefined) balik NaN, yang truthy-check-nya `!activeClientId.value`
// salah kira jadi "belum ada ID" → isNewClient jadi true padahal harusnya mode edit. Makanya
// wajib divalidasi Number.isFinite, bukan cuma dicek truthy.
const parsedRouteClientId = route.params.clientId ? Number(route.params.clientId) : null
const activeClientId = ref(Number.isFinite(parsedRouteClientId) ? parsedRouteClientId : null)
const isNewClient = computed(() => !activeClientId.value)
// ID_CLIENT sekarang selalu digenerate server (lihat proceedFromProfile) — effectiveClientId
// dipertahankan sebagai alias supaya semua pemanggil di bawah tetap konsisten namanya.
const effectiveClientId = computed(() => activeClientId.value)

// ══ FIELD METADATA ══
const profileTextFields = [
  { key: 'NAMA_APOTEK', label: 'Nama Apotek', maxlength: 100, required: true },
  { key: 'ALAMAT', label: 'Alamat', maxlength: 200 },
  { key: 'LINK_LOGO', label: 'Link Logo' },
  { key: 'KOP_SURAT', label: 'Kota (tempat tanda tangan)', placeholder: 'mis. Nagan Raya', hint: 'mis. Nagan Raya — dicetak sebagai "Nagan Raya, <tanggal>"' },
  { key: 'NO_SIA', label: 'No. SIA', maxlength: 100, hint: 'Dicetak di SP Prekursor/Psikotropika/Narkotika' },
]
const profileToggleFields = [
  { key: 'TAMPILKAN_NO_URUTAN_DISPLAY', label: 'Tampilkan No. Urutan Display' },
  { key: 'DISABLE_JIKA_SEDIAAN_NOL', label: 'Disable Jika Sediaan Nol' },
]
const satuSehatTextFields = [
  { key: 'SATU_SEHAT_URL', label: 'URL Satu Sehat' },
  { key: 'SATU_SEHAT_IDCLIENT', label: 'ID Client Satu Sehat' },
  { key: 'SATU_SEHAT_ORGANIZATION_ID', label: 'Organization ID' },
  { key: 'SATU_SEHAT_STRUKTUR_ORG', label: 'Struktur Organisasi' },
]
const apolTextFields = [
  { key: 'KODE_FASKES', label: 'Kode Faskes' },
  { key: 'CONSID', label: 'Cons ID' },
  { key: 'USER_KEY', label: 'User Key' },
  { key: 'URL_APOL', label: 'URL APOL' },
]

const posSettingFields = [
  { key: 'IZINKAN_DISKON_ITEM', label: 'Izinkan Diskon per Item', desc: 'Kasir boleh kasih diskon di masing-masing barang saat belanja.' },
  { key: 'IZINKAN_DISKON_BILL', label: 'Izinkan Diskon per Struk', desc: 'Kasir boleh kasih potongan flat rupiah untuk keseluruhan struk.' },
  { key: 'PAKAI_SHIFT', label: 'Pakai Shift Kasir', desc: 'Kasir wajib buka/tutup shift sebelum bisa transaksi.' },
  { key: 'IZINKAN_PIUTANG', label: 'Izinkan Piutang', desc: 'Kasir boleh checkout dengan metode bayar Piutang.' },
]

const lokasiToggleFields = [
  { key: 'INDUK', label: 'Induk' },
  { key: 'IS_HQ', label: 'HQ' },
  { key: 'IS_DEPO', label: 'Depo' },
  { key: 'VISIBLE', label: 'Visible' },
  { key: 'POTONG_STOCK', label: 'Potong Stock' },
]

// ══ FORM STATE ══
const emptyProfile = () => ({
  NAMA_APOTEK: '',
  ALAMAT: '',
  LINK_LOGO: '',
  TIPE_KLIEN: 'APOTEK',
  NO_SIA: '',
  TAMPILKAN_NO_URUTAN_DISPLAY: false,
  DISABLE_JIKA_SEDIAAN_NOL: false,
  KOP_SURAT: '',
  SATU_SEHAT_URL: '',
  SATU_SEHAT_IDCLIENT: '',
  SATU_SEHAT_CLIENT_SECRET: '',
  SATU_SEHAT_ORGANIZATION_ID: '',
  SATU_SEHAT_STRUKTUR_ORG: '',
})
const profileForm = reactive(emptyProfile())

const emptyApol = () => ({
  KODE_FASKES: '',
  CONSID: '',
  SCRET_KEY: '',
  USER_KEY: '',
  URL_APOL: '',
})
const apolForm = reactive(emptyApol())

const emptyPosSetting = () => ({
  IZINKAN_DISKON_ITEM: true,
  IZINKAN_DISKON_BILL: true,
  PAKAI_SHIFT: true,
  IZINKAN_PIUTANG: true,
})
const posSettingForm = reactive(emptyPosSetting())

// ══ LOKASI STATE ══
const lokasiList = ref([])
const lokasiLoading = ref(false)
const subSettingState = reactive({}) // { [LOKASI_ID]: boolean }

// GET lokasi cuma balikin 6 field (LOKASI_ID, LOKASI, JENIS_LOKASI, IS_DEPO, IS_HQ, VISIBLE) —
// INDUK, KATEGORI_BARANG, POTONG_STOCK sengaja nggak ikut (select() eksplisit di backend, dan
// belum ada endpoint detail-per-lokasi buat baca baliknya di controller ini). Jadi 3 field itu
// HARUS dilacak lokal dari apa yang kita kirim sendiri lewat dialog Tambah/Edit Lokasi — akurat
// 100% untuk lokasi yang disentuh di sesi ini, tapi "tidak diketahui" (default false/'') untuk
// lokasi lama yang belum pernah diutak-atik di sesi sekarang (keterbatasan API, bukan bug FE).
const lokasiExtra = reactive({}) // { [LOKASI_ID]: { INDUK, KATEGORI_BARANG, POTONG_STOCK } }
const getLokasiExtra = (lokasiId) =>
  lokasiExtra[lokasiId] || { INDUK: false, KATEGORI_BARANG: '', POTONG_STOCK: false }

// hasInduk cuma bisa dipercaya penuh untuk lokasi yang disentuh di sesi ini (lihat lokasiExtra) —
// dipakai sebagai info/warning, bukan hard gate (client sudah pasti ada duluan lewat proceedFromProfile).
const hasInduk = computed(() => lokasiList.value.some((l) => getLokasiExtra(l.LOKASI_ID).INDUK))
const showAddLokasiDialog = ref(false)
const lokasiSaving = ref(false)
const editingLokasiId = ref(null) // null = mode tambah, terisi = mode edit
const emptyLokasiForm = () => ({
  LOKASI: '',
  JENIS_LOKASI: '',
  KATEGORI_BARANG: '',
  INDUK: false,
  IS_HQ: false,
  IS_DEPO: false,
  VISIBLE: true,
  POTONG_STOCK: false,
})
const lokasiForm = reactive(emptyLokasiForm())

// ══ STEP 5: BOOTSTRAP USER PERTAMA (POST /api/apotek/user dengan ID_CLIENT eksplisit) ══
// Cuma boleh dipanggil akun IS_OWNER=1 (halaman ini sendiri sudah owner-only lewat router
// guard), dan cuma dipakai buat client yang belum punya user sama sekali — server tidak
// menolak dobel-create, jadi kalau dipanggil lagi ya cuma nambah user baru lagi (bukan error).
const emptyBootstrapForm = () => ({
  NAMA_USER: '',
  USERNAME: '',
  PWD: '',
  PROFESI: '',
  NO_SIPA: '',
  ID_LOKASI: null,
})
const bootstrapForm = reactive(emptyBootstrapForm())
const bootstrapSaving = ref(false)
const userApiUrl = computed(() => `${configStore.apiApotikUrl}/index.php/api/apotek/user`)
// Prefix yang bakal ditempel backend di depan USERNAME (lihat M_user_apotek::build_username())
// — cuma buat DITAMPILKAN, tidak ikut dikirim di payload submitBootstrapUser(). Di sini selalu
// pasti ada (beda dari UserManajemenView.vue yang owner-nya bisa belum pilih client) karena
// effectiveClientId sudah wajib ada duluan sebelum panel Step 5 ini ditampilkan sama sekali.
const bootstrapUsernamePrefix = computed(() => `${effectiveClientId.value}-`)

// ══ ASSIGN MENU LANGSUNG SETELAH USER PERTAMA DIBUAT ══
// Endpoint /user/{id}/menu (User.php) dipatch untuk terima ID_CLIENT eksplisit dari owner —
// sebelumnya endpoint ini selalu pakai ID_CLIENT token (punya owner sendiri, tidak terikat
// client manapun) jadi assign_menu() selalu balikin "User apotek tidak ditemukan" kalau
// dipanggil owner untuk user di client lain. Tanpa ID_CLIENT eksplisit di bawah, ini akan gagal.
const bootstrapUserId = ref(null)
const bootstrapUsername = ref('')
const allMenuItems = ref([])
const loadingMenus = ref(false)
const bootstrapSelectedMenuIds = ref(new Set())
const menuSaving = ref(false)

const normalizeMenuItem = (row) => ({
  id: row.ID,
  parent_id: row.PARENT_ID ?? '',
  title: row.TITLE,
  sort_order: Number(row.SORT_ORDER) || 0,
})
const bootstrapMenuTree = computed(() => {
  const parents = allMenuItems.value.filter((i) => !i.parent_id)
  return parents
    .map((p) => ({
      ...p,
      children: allMenuItems.value
        .filter((c) => c.parent_id === p.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
})

const fetchAllMenuItems = async () => {
  if (allMenuItems.value.length) return // sudah pernah di-load di sesi ini
  loadingMenus.value = true
  try {
    const { data } = await axios.get(`${configStore.apiApotikUrl}/index.php/api/apotek/referensi/menu_item_all`)
    allMenuItems.value = (data?.response || []).map(normalizeMenuItem)
  } catch (error) {
    console.error('Error fetching menu items:', error)
    showError('Gagal memuat daftar menu')
  } finally {
    loadingMenus.value = false
  }
}

const menuToggle = (id) => {
  const numId = Number(id)
  const set = new Set(bootstrapSelectedMenuIds.value)
  if (set.has(numId)) set.delete(numId)
  else set.add(numId)
  bootstrapSelectedMenuIds.value = set
}
const menuSelectAll = () => {
  const ids = new Set()
  bootstrapMenuTree.value.forEach((parent) => {
    if (parent.children.length === 0) ids.add(Number(parent.id))
    else parent.children.forEach((c) => ids.add(Number(c.id)))
  })
  bootstrapSelectedMenuIds.value = ids
}
const menuClearAll = () => {
  bootstrapSelectedMenuIds.value = new Set()
}

const resetBootstrapPanel = () => {
  bootstrapUserId.value = null
  bootstrapUsername.value = ''
  bootstrapSelectedMenuIds.value = new Set()
}

const submitBootstrapUser = async () => {
  if (!effectiveClientId.value) {
    showError('ID Client belum ada — simpan client dulu di step Review & Submit.')
    return
  }
  if (!bootstrapForm.NAMA_USER.trim() || !bootstrapForm.USERNAME.trim() || !bootstrapForm.PWD.trim()) {
    showError('Nama User, Username, dan Password wajib diisi.')
    return
  }
  bootstrapSaving.value = true
  try {
    const { data } = await axios.post(userApiUrl.value, {
      ID_CLIENT: effectiveClientId.value,
      NAMA_USER: bootstrapForm.NAMA_USER,
      USERNAME: bootstrapForm.USERNAME,
      PWD: bootstrapForm.PWD,
      PROFESI: bootstrapForm.PROFESI || null,
      NO_SIPA: bootstrapForm.NO_SIPA || null,
      ID_LOKASI: bootstrapForm.ID_LOKASI ?? null,
    })
    if (data?.metadata?.code && data.metadata.code !== 200) {
      showError(data.metadata.message || 'Gagal membuat user pertama')
      return
    }
    showSuccess(`User "${bootstrapForm.USERNAME}" berhasil dibuat — sekarang pilih menu yang boleh diakses.`)
    bootstrapUserId.value = data?.response?.ID ?? null
    bootstrapUsername.value = bootstrapForm.USERNAME
    Object.assign(bootstrapForm, emptyBootstrapForm())
    await fetchAllMenuItems()
  } catch (error) {
    console.error('Error creating bootstrap user:', error)
    showError(error?.response?.data?.metadata?.message || 'Gagal membuat user pertama')
  } finally {
    bootstrapSaving.value = false
  }
}

const submitBootstrapMenus = async () => {
  if (!bootstrapUserId.value || bootstrapSelectedMenuIds.value.size === 0) return
  menuSaving.value = true
  try {
    const results = await Promise.all(
      [...bootstrapSelectedMenuIds.value].map((menuId) =>
        axios.post(`${userApiUrl.value}/${bootstrapUserId.value}/menu`, {
          ID_MENU: menuId,
          ID_CLIENT: effectiveClientId.value,
        }),
      ),
    )
    const allOk = results.every((r) => r.data?.metadata?.code === 200)
    if (allOk) {
      showSuccess(`${bootstrapSelectedMenuIds.value.size} menu berhasil diassign ke ${bootstrapUsername.value}.`)
    } else {
      toast.add({ severity: 'warn', summary: 'Sebagian Gagal', detail: 'Beberapa menu gagal diassign', life: 4000 })
    }
  } catch (error) {
    console.error('Error assigning bootstrap menus:', error)
    showError(error?.response?.data?.metadata?.message || 'Gagal menyimpan assignment menu')
  } finally {
    menuSaving.value = false
  }
}

// ══ LOAD DATA (MODE EDIT) ══
const fetchForm = async (id) => {
  loading.value = true
  try {
    const { data } = await axios.get(`${apiUrl.value}/form`, { params: { clientId: id } })
    const res = data?.response || {}
    const p = res.PROFILE_APOTEK || {}
    const a = res.PROFILE_APOL_APOTEK || {}
    const pos = res.POS_SETTING || {}

    clientName.value = p.NAMA_APOTEK || ''

    Object.keys(profileForm).forEach((key) => {
      if (typeof profileForm[key] === 'boolean') {
        profileForm[key] = isTruthy(p[key])
      } else {
        profileForm[key] = p[key] ?? ''
      }
    })

    Object.keys(apolForm).forEach((key) => {
      apolForm[key] = a[key] ?? ''
    })

    Object.keys(posSettingForm).forEach((key) => {
      posSettingForm[key] = pos[key] != null ? isTruthy(pos[key]) : true
    })

    // Pre-seed sub-setting state dari response form (kalau step Lokasi belum di-buka)
    const subs = res.SETTING_SYS_SUBSETTING_APOTEK || []
    subs.forEach((row) => {
      subSettingState[row.LOKASI_ID] = isTruthy(row.HANYA_CHECK_HARGA_UNTUK_TULIS_BARU)
    })
  } catch (error) {
    console.error('Error fetching client form:', error)
    showError(error?.response?.data?.metadata?.message || 'Gagal mengambil data client')
  } finally {
    loading.value = false
  }
}

const fetchLokasi = async (id) => {
  if (!id) return
  lokasiLoading.value = true
  try {
    const { data } = await axios.get(`${apiUrl.value}/lokasi`, { params: { clientId: id } })
    lokasiList.value = data?.response || []
    lokasiList.value.forEach((row) => {
      if (!(row.LOKASI_ID in subSettingState)) {
        subSettingState[row.LOKASI_ID] = false
      }
    })
  } catch (error) {
    console.error('Error fetching lokasi:', error)
    showError(error?.response?.data?.metadata?.message || 'Gagal mengambil data lokasi')
  } finally {
    lokasiLoading.value = false
  }
}

// ══ NAVIGASI STEP ══
// Step header di Stepper sudah non-linear (bebas diklik pindah-pindah kapan saja, kayak tab
// di SIMRS). Satu-satunya hard gate sekarang: client (activeClientId) harus sudah ada — untuk
// client baru itu berarti sudah lewat proceedFromProfile() — sebelum lokasi/user pertama bisa
// ditambahkan. Ditegakkan lewat guard di openAddLokasi()/submitBootstrapUser(), bukan di sini.
const goToSubSetting = (activateCallback) => {
  if (!hasInduk.value) {
    showError('Belum ada lokasi Induk — boleh lanjut dulu, tapi sebaiknya tambahkan sebelum client dipakai transaksi.')
  }
  activateCallback('3')
}

// Step 1: untuk client baru, ini yang memicu POST save dengan IS_NEW_CLIENT: true (ID_CLIENT
// digenerate server — lihat api_apotek.md). Mode edit tinggal pindah step, tidak ada save di sini.
const creatingClient = ref(false)
const proceedFromProfile = async (activateCallback) => {
  if (!isNewClient.value) {
    activateCallback('2')
    return
  }
  if (!profileForm.NAMA_APOTEK.trim()) {
    showError('Nama Apotek wajib diisi.')
    return
  }
  creatingClient.value = true
  try {
    const payload = { IS_NEW_CLIENT: true, PROFILE_APOTEK: buildProfilePayload() }
    const apolPayload = buildApolPayload()
    if (apolPayload) payload.PROFILE_APOL_APOTEK = apolPayload

    const { data } = await axios.post(`${apiUrl.value}/save`, payload)
    if (data?.metadata?.code && data.metadata.code !== 200) {
      showError(data.metadata.message || 'Gagal membuat client')
      return
    }
    const newId = data?.response?.ID_CLIENT
    if (newId == null) {
      showError('Server tidak mengembalikan ID_CLIENT — hubungi backend.')
      return
    }
    activeClientId.value = Number(newId)
    router.replace({ name: 'ClientRegistrationFormEditView', params: { clientId: activeClientId.value } })
    showSuccess(`Client baru berhasil dibuat (ID ${activeClientId.value}) — lanjut tambahkan lokasi.`)
    activateCallback('2')
  } catch (error) {
    console.error('Error creating client:', error)
    showError(error?.response?.data?.metadata?.message || 'Gagal membuat client')
  } finally {
    creatingClient.value = false
  }
}

// ══ LOKASI DIALOG (tambah & edit) ══
const openAddLokasi = () => {
  if (!activeClientId.value) {
    showError('Buat client dulu di step Profil Client sebelum menambah lokasi')
    return
  }
  editingLokasiId.value = null
  Object.assign(lokasiForm, emptyLokasiForm())
  showAddLokasiDialog.value = true
}

const openEditLokasi = (row) => {
  editingLokasiId.value = row.LOKASI_ID
  // INDUK/KATEGORI_BARANG/POTONG_STOCK tidak ada di response GET lokasi (lihat lokasiExtra) —
  // seed dari state lokal, bukan dari `row`, biar nggak ketimpa jadi false/'' tiap buka dialog.
  const extra = getLokasiExtra(row.LOKASI_ID)
  Object.assign(lokasiForm, emptyLokasiForm(), {
    LOKASI: row.LOKASI || '',
    JENIS_LOKASI: row.JENIS_LOKASI || '',
    IS_HQ: isTruthy(row.IS_HQ),
    IS_DEPO: isTruthy(row.IS_DEPO),
    VISIBLE: isTruthy(row.VISIBLE),
    KATEGORI_BARANG: extra.KATEGORI_BARANG,
    INDUK: extra.INDUK,
    POTONG_STOCK: extra.POTONG_STOCK,
  })
  showAddLokasiDialog.value = true
}

const buildLokasiPayload = () => ({
  LOKASI: lokasiForm.LOKASI,
  JENIS_LOKASI: lokasiForm.JENIS_LOKASI || undefined,
  KATEGORI_BARANG: lokasiForm.KATEGORI_BARANG || undefined,
  INDUK: lokasiForm.INDUK ? 1 : 0,
  IS_HQ: lokasiForm.IS_HQ ? 1 : 0,
  IS_DEPO: lokasiForm.IS_DEPO ? 1 : 0,
  VISIBLE: lokasiForm.VISIBLE ? 1 : 0,
  POTONG_STOCK: lokasiForm.POTONG_STOCK ? 1 : 0,
})

const submitLokasiForm = async () => {
  if (!lokasiForm.LOKASI.trim()) {
    showError('Nama lokasi wajib diisi')
    return
  }
  const idClient = effectiveClientId.value
  lokasiSaving.value = true
  try {
    let data
    let newLokasiId = null
    if (editingLokasiId.value) {
      ;({ data } = await axios.post(`${apiUrl.value}/lokasi/update`, {
        IDCLIENT: idClient,
        LOKASI_ID: editingLokasiId.value,
        ...buildLokasiPayload(),
      }))
    } else {
      ;({ data } = await axios.post(`${apiUrl.value}/lokasi`, {
        IDCLIENT: idClient,
        ...buildLokasiPayload(),
      }))
      // POST lokasi cuma balikin { LOKASI_ID } (number) — beda dari GET yang stringify semua.
      newLokasiId = data?.response?.LOKASI_ID ?? null
    }

    if (data?.metadata?.code && data.metadata.code !== 200) {
      showError(data.metadata.message || 'Gagal menyimpan lokasi')
      return
    }
    // Simpan INDUK/KATEGORI_BARANG/POTONG_STOCK yang barusan dikirim — GET lokasi tidak akan
    // pernah mengembalikannya, jadi ini satu-satunya sumber kebenaran buat field itu.
    const savedLokasiId = editingLokasiId.value ?? newLokasiId
    if (savedLokasiId != null) {
      lokasiExtra[savedLokasiId] = {
        INDUK: lokasiForm.INDUK,
        KATEGORI_BARANG: lokasiForm.KATEGORI_BARANG,
        POTONG_STOCK: lokasiForm.POTONG_STOCK,
      }
    }
    showSuccess(editingLokasiId.value ? 'Lokasi berhasil diperbarui' : 'Lokasi berhasil ditambahkan')
    showAddLokasiDialog.value = false
    await fetchLokasi(idClient)
  } catch (error) {
    console.error('Error saving lokasi:', error)
    showError(error?.response?.data?.metadata?.message || 'Gagal menyimpan lokasi')
  } finally {
    lokasiSaving.value = false
  }
}

// ══ SUBMIT FINAL (step Review) ══
const buildProfilePayload = () => {
  const out = {}
  Object.keys(profileForm).forEach((key) => {
    const val = profileForm[key]
    out[key] = typeof val === 'boolean' ? (val ? 1 : 0) : val
  })
  return out
}

const buildApolPayload = () => {
  const hasValue = Object.values(apolForm).some((v) => String(v ?? '').trim() !== '')
  return hasValue ? { ...apolForm } : null
}

// Client baru sudah dibuat lebih dulu di step Profil (proceedFromProfile) — begitu step ini
// bisa dicapai, activeClientId selalu sudah terisi, jadi submit di sini murni update (edit mode),
// tidak pernah lagi mengirim IS_NEW_CLIENT.
const submitFinal = async () => {
  if (!activeClientId.value) {
    showError('Client belum dibuat — kembali ke step Profil Client dan klik "Buat Client & Lanjut ke Lokasi" dulu.')
    return
  }
  if (!profileForm.NAMA_APOTEK.trim()) {
    showError('Nama Apotek wajib diisi — isi dulu di step Profil Client.')
    return
  }
  const idClient = activeClientId.value
  loading.value = true
  try {
    const payload = {
      IDCLIENT: idClient,
      PROFILE_APOTEK: buildProfilePayload(),
      SETTING_SYS_SUBSETTING_APOTEK: lokasiList.value.map((l) => ({
        // GET lokasi balikin LOKASI_ID sebagai string ("1") — contoh payload save() di kontrak
        // pakai number literal, jadi di-Number() dulu biar cocok sama contoh resminya.
        LOKASI_ID: Number(l.LOKASI_ID),
        HANYA_CHECK_HARGA_UNTUK_TULIS_BARU: subSettingState[l.LOKASI_ID] ? 1 : 0,
      })),
      POS_SETTING: {
        IZINKAN_DISKON_ITEM: posSettingForm.IZINKAN_DISKON_ITEM ? 1 : 0,
        IZINKAN_DISKON_BILL: posSettingForm.IZINKAN_DISKON_BILL ? 1 : 0,
        PAKAI_SHIFT: posSettingForm.PAKAI_SHIFT ? 1 : 0,
        IZINKAN_PIUTANG: posSettingForm.IZINKAN_PIUTANG ? 1 : 0,
      },
    }
    const apolPayload = buildApolPayload()
    if (apolPayload) payload.PROFILE_APOL_APOTEK = apolPayload

    const { data } = await axios.post(`${apiUrl.value}/save`, payload)

    if (data?.metadata?.code && data.metadata.code !== 200) {
      showError(data.metadata.message || 'Gagal menyimpan client')
      return
    }

    showSuccess('Client berhasil disimpan')
    await fetchForm(idClient)
    await fetchLokasi(idClient)
  } catch (error) {
    console.error('Error saving client:', error)
    showError(error?.response?.data?.metadata?.message || 'Gagal menyimpan client')
  } finally {
    loading.value = false
  }
}

// ══ LANGGANAN (SUBSCRIPTION) ══
// Logic (fetch riwayat, submit tambah/perpanjang) dipakai bareng ClientRegistrationListView.vue
// (dialog "Perpanjang" per baris) — lihat composables/useClientSubscription.js.
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
const submitSubscription = () => submitSubscriptionForm(effectiveClientId.value)

// Client baru baru punya ID setelah proceedFromProfile() sukses — watch (bukan cuma onMounted)
// supaya riwayat langganan otomatis dimuat begitu itu terjadi, tanpa perlu wiring manual di sana.
watch(
  effectiveClientId,
  (id) => {
    if (id) fetchSubscriptionHistory(id)
  },
  { immediate: true },
)

const goBack = () => {
  router.push({ name: 'ClientRegistrationListView' })
}

onMounted(() => {
  if (activeClientId.value) {
    fetchForm(activeClientId.value)
    fetchLokasi(activeClientId.value)
  }
})
</script>

<style scoped>
/* ── HERO ── */
/* ── STEPPER CARD ── */
.cr-stepper-wrap :deep(.p-stepper-panels) {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-top: 3px solid var(--sky-600);
  border-radius: 6px;
  padding: 1rem;
}

/* ── Form Controls ── */
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  display: block;
}
.required {
  color: #dc2626;
}
.form-control {
  font-size: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  height: auto;
}
.form-text {
  font-size: 12px;
  color: #6b7280;
  display: block;
  margin-top: 4px;
}
.text-danger {
  color: #dc2626 !important;
}

/* ── Toggle rows ── */
.setting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.setting-row:last-of-type {
  border-bottom: none;
}
.setting-row-text {
  flex: 1;
}
.setting-row-label {
  font-weight: 600;
  font-size: 13.5px;
  color: #1e293b;
}
.setting-row-desc {
  font-size: 11.5px;
  color: #6b7280;
  line-height: 1.5;
  margin-top: 2px;
}
.setting-row-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  background: var(--sky-50);
  border-radius: 4px;
}

/* ── Aksi panel button stack ── */
.aksi-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.aksi-actions :deep(.p-button) {
  width: 100%;
}

/* ── Info ── */
.info-box {
  background: var(--sky-50);
  border-left: 3px solid var(--sky-600);
  padding: 14px;
  border-radius: 2px;
  font-size: 13px;
  color: #475569;
}
.info-note {
  font-size: 11.5px;
  color: #6b7280;
  margin: 0 0 10px;
  line-height: 1.5;
}

/* ── Action buttons (lokasi table) ── */
.action-btns { display:flex;gap:2px;align-items:center;justify-content:center; }
:deep(.action-btns .p-button.p-button-text) { padding:0 .2rem !important;font-size:10px !important;height:1.4rem !important;min-height:unset !important;width:1.4rem !important; }

/* ── Review dl/dt/dd ── */
.review-details {
  margin: 0;
}
.review-details dt {
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  margin-top: 0.75rem;
}
.review-details dd {
  margin: 0 0 0.25rem 0;
  font-size: 14px;
  color: #1e293b;
}

/* ── Bootstrap: assign menu checklist ── */
.bootstrap-menu-tree {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem;
}
.bm-group {
  margin-bottom: 2px;
}
.bm-parent-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.4rem;
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}
.bm-spacer {
  width: 18px;
  display: inline-block;
}
.bm-children {
  padding-left: 1.7rem;
}
.bm-child-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.4rem;
  font-size: 12.5px;
  color: #374151;
}
.bm-title {
  line-height: 1.2;
}

</style>
