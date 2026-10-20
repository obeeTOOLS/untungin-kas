import { UMKMProfile, Transaksi, AkunKas, VoucherPro, AuditLog, HutangPiutang } from '../types';
import { SEED_PROFILES } from '../data/seedProfiles';
import { DEFAULT_ACCOUNTS, SEED_VOUCHERS, getSampleTransactions, getSampleHutangPiutang, OFFICIAL_KAS_TRANSACTIONS } from '../data/seedData';

export const GAS_ENDPOINT = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GAS_API_URL) 
  ? import.meta.env.VITE_GAS_API_URL 
  : 'https://script.google.com/macros/s/AKfycbwpLuT1HtWX7I9l1ABa2YthchqYEZ4cEuLcmXjeyW_PHOgXw9D9GhoOROySnKFHr1vO/exec';

export const SPREADSHEET_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SPREADSHEET_ID)
  ? import.meta.env.VITE_SPREADSHEET_ID
  : '183uoyYw6opnr3w7T6oljvwuy5Rzs7GZE7fM3vi_pwm4';

const STORAGE_KEYS = {
  PROFILES: 'untungin_std_profiles_v1',
  PROFILES_VERSION: 'untungin_std_profiles_version',
  ACTIVE_PROFILE_ID: 'untungin_std_active_profile_id_v1',
  ACTIVE_BUSINESS: 'untungin_std_active_business',
  TRANSAKSI: 'untungin_std_transaksi_v1',
  AKUN: 'untungin_std_akun_v1',
  VOUCHER: 'untungin_std_voucher_v1',
  AUDIT: 'untungin_std_audit_v1',
  HUTANG_PIUTANG: 'untungin_std_debt_records_v1',
  OFFLINE_QUEUE: 'untungin_std_offline_queue_v1'
};

export interface GasPingResponse {
  connected: boolean;
  message: string;
  serverTime?: string;
  engine?: string;
  databaseReady?: boolean;
}

class GasService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushQueue();
        this.syncCloudTransactions();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
      this.initStorage();
      if (this.isOnline) {
        setTimeout(() => this.syncCloudTransactions(), 1000);
      }
    }
  }

  private initStorage() {
    try {
      const storedProfilesRaw = localStorage.getItem(STORAGE_KEYS.PROFILES);
      const version = localStorage.getItem(STORAGE_KEYS.PROFILES_VERSION);
      
      let profileCount = 0;
      try {
        if (storedProfilesRaw) {
          profileCount = JSON.parse(storedProfilesRaw).length;
        }
      } catch {
        profileCount = 0;
      }

      // Auto-migrate to 62 official GEKRAFS Kota Batu profiles & 114 cloud transactions
      const storedTrxRaw = localStorage.getItem(STORAGE_KEYS.TRANSAKSI);
      let trxCount = 0;
      try {
        if (storedTrxRaw) trxCount = JSON.parse(storedTrxRaw).length;
      } catch {
        trxCount = 0;
      }

      const needsMigration = 
        !storedProfilesRaw || 
        profileCount !== 62 ||
        trxCount < 114 ||
        version !== 'v4_official_sheet_183_sync' || 
        storedProfilesRaw.includes('Warung Kopi Kenangan Nusantara') ||
        !storedProfilesRaw.includes('Inovasi Pangan Lestari') ||
        !storedProfilesRaw.includes('Enok Sri Kustiyah') ||
        !storedProfilesRaw.includes('Choirul Anisah') ||
        !storedProfilesRaw.includes('obeecreatives');

      if (needsMigration) {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(SEED_PROFILES));
        localStorage.setItem(STORAGE_KEYS.PROFILES_VERSION, 'v4_official_sheet_183_sync');
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, SEED_PROFILES[0].id);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_BUSINESS, SEED_PROFILES[0].namaUsaha);
        localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(OFFICIAL_KAS_TRANSACTIONS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.AKUN)) {
        localStorage.setItem(STORAGE_KEYS.AKUN, JSON.stringify(DEFAULT_ACCOUNTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.VOUCHER)) {
        localStorage.setItem(STORAGE_KEYS.VOUCHER, JSON.stringify(SEED_VOUCHERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TRANSAKSI)) {
        localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(OFFICIAL_KAS_TRANSACTIONS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.HUTANG_PIUTANG)) {
        const defaultDebt = getSampleHutangPiutang(SEED_PROFILES[0].id, SEED_PROFILES[0].namaUsaha);
        localStorage.setItem(STORAGE_KEYS.HUTANG_PIUTANG, JSON.stringify(defaultDebt));
      }
      if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
        localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([
          {
            id: 'audit-init',
            umkmId: SEED_PROFILES[0].id,
            aksi: 'SISTEM_INIT',
            detail: 'Database Untungin PWA Engine Standalone diinisialisasi.',
            timestamp: new Date().toISOString()
          }
        ]));
      }
    } catch (e) {
      console.warn('Storage init warning:', e);
    }
  }

  // Ping GAS Engine to verify live connection
  async pingEngine(): Promise<GasPingResponse> {
    try {
      const res = await fetch(GAS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          connected: true,
          message: data.message || 'PONG! Untungin Pro Engine Standalone Siap.',
          serverTime: data.timestamp || new Date().toISOString(),
          engine: 'UNTUNGIN - PRO API ENGINE (STANDALONE)',
          databaseReady: true
        };
      }
    } catch {
      // Fallback ping test via GET status check
      try {
        const getRes = await fetch(GAS_ENDPOINT, { signal: AbortSignal.timeout(4000) });
        if (getRes.ok) {
          const getData = await getRes.json();
          return {
            connected: true,
            message: 'Database spreadsheet terhubung & siap.',
            serverTime: getData.serverTime,
            engine: getData.engine,
            databaseReady: getData.databaseReady
          };
        }
      } catch {
        // Offline or connection timeout
      }
    }
    return {
      connected: false,
      message: 'Mode Mandiri (Offline Cache Aktif). Perubahan tersimpan lokal & disinkronkan saat online.'
    };
  }

  // Send request to GAS backend with local queue fallback
  private async dispatchToGas(payload: Record<string, unknown>): Promise<boolean> {
    try {
      if (!navigator.onLine) {
        this.enqueue(payload);
        return false;
      }
      const res = await fetch(GAS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000)
      });
      return res.ok;
    } catch {
      this.enqueue(payload);
      return false;
    }
  }

  private enqueue(payload: Record<string, unknown>) {
    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
      queue.push({ payload, queuedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('Queue error:', e);
    }
  }

  getOfflineQueueCount(): number {
    try {
      const queueRaw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (!queueRaw) return 0;
      const queue = JSON.parse(queueRaw);
      return Array.isArray(queue) ? queue.length : 0;
    } catch {
      return 0;
    }
  }

  async flushQueue(): Promise<{ total: number; synced: number }> {
    try {
      const queueRaw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (!queueRaw) return { total: 0, synced: 0 };
      const queue = JSON.parse(queueRaw);
      if (!Array.isArray(queue) || !queue.length) return { total: 0, synced: 0 };

      const total = queue.length;
      let synced = 0;
      const remaining = [];

      for (const item of queue) {
        try {
          const res = await fetch(GAS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(item.payload),
            signal: AbortSignal.timeout(6000)
          });
          if (res.ok) {
            synced++;
          } else {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(remaining));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('untungin:queue_flushed', { detail: { total, synced } }));
      }

      return { total, synced };
    } catch (e) {
      console.warn('Process queue error:', e);
      return { total: 0, synced: 0 };
    }
  }

  // Profil Management
  getProfiles(): UMKMProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
      return raw ? JSON.parse(raw) : SEED_PROFILES;
    } catch {
      return SEED_PROFILES;
    }
  }

  getProfileById(id: string): UMKMProfile | undefined {
    return this.getProfiles().find(p => p.id === id);
  }

  getActiveProfile(): UMKMProfile {
    const profiles = this.getProfiles();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    const activeBusiness = localStorage.getItem(STORAGE_KEYS.ACTIVE_BUSINESS);
    
    let found = profiles.find(p => p.id === activeId);
    if (!found && activeBusiness) {
      found = profiles.find(p => p.namaUsaha.toLowerCase() === activeBusiness.toLowerCase());
    }
    const current = found || profiles[0];
    if (current) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, current.id);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BUSINESS, current.namaUsaha);
    }
    return current;
  }

  setActiveProfileId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
    const profile = this.getProfileById(id);
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BUSINESS, profile.namaUsaha);
    }
    this.logAudit(id, 'LOGIN_PROFIL', `Masuk ke profil usaha ${profile?.namaUsaha || id}`);
  }

  verifyPin(profileId: string, enteredPin: string): boolean {
    const profile = this.getProfileById(profileId);
    if (!profile) return false;
    // Default PIN is 123456 or matches stored PIN
    return profile.pinKas === enteredPin;
  }

  updatePin(profileId: string, newPin: string): boolean {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx === -1) return false;

    profiles[idx].pinKas = newPin;
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    this.logAudit(profileId, 'GANTI_PIN', 'PIN Kas 6-digit berhasil diperbarui');
    this.dispatchToGas({ action: 'gantiPin', profileId, newPin });
    return true;
  }

  registerNewProfile(profileData: Omit<UMKMProfile, 'id' | 'createdAt' | 'statusLisensi' | 'lisensiExpiredAt' | 'durasiPaket'>): UMKMProfile {
    const profiles = this.getProfiles();
    const newId = `umkm-${(profiles.length + 1).toString().padStart(2, '0')}`;
    const newProfile: UMKMProfile = {
      ...profileData,
      id: newId,
      statusLisensi: 'PRO',
      lisensiExpiredAt: 'LIFETIME',
      durasiPaket: 'Lifetime',
      createdAt: new Date().toISOString().split('T')[0],
      isPro: true
    };

    profiles.unshift(newProfile);
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, newId);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BUSINESS, newProfile.namaUsaha);
    this.logAudit(newId, 'DAFTAR_USAHA_BARU', `Pendaftaran usaha baru: ${newProfile.namaUsaha}`);
    
    // Otomatis mengirim action: 'syncProfil' ke endpoint Google Apps Script Vault
    this.dispatchToGas({
      action: 'syncProfil',
      profile: newProfile,
      namaUsaha: newProfile.namaUsaha,
      pemilik: newProfile.pemilik,
      kategori: newProfile.kategoriUsaha,
      kontak: newProfile.kontak,
      alamat: newProfile.alamat,
      statusLisensi: newProfile.statusLisensi
    });
    return newProfile;
  }

  upgradeToPro(profileId: string, voucherCode: string): { success: boolean; message: string; expiredAt?: string } {
    const vouchers = this.getVouchers();
    const vIdx = vouchers.findIndex(v => v.kode.toUpperCase() === voucherCode.trim().toUpperCase());

    if (vIdx === -1) {
      return { success: false, message: 'Kode voucher tidak ditemukan atau tidak valid.' };
    }

    const voucher = vouchers[vIdx];
    if (voucher.status === 'DIGUNAKAN') {
      return { success: false, message: 'Voucher ini sudah pernah digunakan.' };
    }

    const profiles = this.getProfiles();
    const pIdx = profiles.findIndex(p => p.id === profileId);
    if (pIdx === -1) {
      return { success: false, message: 'Profil usaha tidak ditemukan.' };
    }

    let expiredDate = 'LIFETIME';
    let durasiText = voucher.namaPaket;

    if (voucher.durasiBulan !== 999) {
      const exp = new Date();
      exp.setMonth(exp.getMonth() + voucher.durasiBulan);
      expiredDate = exp.toISOString().split('T')[0];
    } else {
      durasiText = 'Akses Lifetime Unlimited';
    }

    profiles[pIdx].statusLisensi = 'PRO';
    profiles[pIdx].lisensiExpiredAt = expiredDate;
    profiles[pIdx].durasiPaket = durasiText;

    voucher.status = 'DIGUNAKAN';
    voucher.digunakanOleh = profiles[pIdx].namaUsaha;
    voucher.tanggalDigunakan = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_KEYS.VOUCHER, JSON.stringify(vouchers));

    this.logAudit(profileId, 'AKTIVASI_PRO', `Berhasil aktivasi paket ${voucher.namaPaket} dengan kode ${voucher.kode}`);
    this.dispatchToGas({ action: 'aktivasiVoucher', profileId, kodeVoucher: voucher.kode, expiredDate });

    return {
      success: true,
      message: `Selamat! Akun berhasil di-upgrade ke Untungin PRO (${durasiText}).`,
      expiredAt: expiredDate
    };
  }

  // Transaksi Management
  getTransactions(umkmId?: string): Transaksi[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSAKSI);
      const all: Transaksi[] = raw ? JSON.parse(raw) : [];
      if (!umkmId) return all;
      return all.filter(t => t.umkmId === umkmId);
    } catch {
      return [];
    }
  }

  // Sync live transactions from official Google Sheet Kas_Transaksi via gviz
  async syncCloudTransactions(): Promise<{ success: boolean; newCount: number; total: number }> {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Kas_Transaksi&_t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return { success: false, newCount: 0, total: this.getTransactions().length };

      const csvText = await res.text();
      const rows: string[][] = [];
      let row: string[] = [];
      let inQuotes = false;
      let field = '';
      for (let i = 0; i < csvText.length; i++) {
        const c = csvText[i];
        if (inQuotes) {
          if (c === '"') {
            if (i + 1 < csvText.length && csvText[i + 1] === '"') { field += '"'; i++; }
            else { inQuotes = false; }
          } else { field += c; }
        } else {
          if (c === '"') { inQuotes = true; }
          else if (c === ',') { row.push(field); field = ''; }
          else if (c === '\n' || c === '\r') {
            if (c === '\r' && i + 1 < csvText.length && csvText[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row);
            row = [];
          } else { field += c; }
        }
      }
      if (field || row.length > 0) { row.push(field); rows.push(row); }

      if (rows.length <= 1) return { success: true, newCount: 0, total: this.getTransactions().length };

      const profiles = this.getProfiles();
      const nameToId = new Map<string, string>();
      profiles.forEach(p => {
        nameToId.set(p.namaUsaha.toLowerCase().trim(), p.id);
      });
      // Aliases
      nameToId.set('kriups keripik sayur dan buah', nameToId.get('kriups!') || 'umkm-05');
      nameToId.set('kripik lokal dewi nurjan mbah batu', nameToId.get('kripik lokal dewi nurjan mbah batu') || 'umkm-12');

      const localTrx = this.getTransactions();
      const existingIds = new Set(localTrx.map(t => t.id));
      let newCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const txId = r[1]?.trim();
        const namaUsaha = r[2]?.trim();
        if (!txId || !namaUsaha) continue;

        if (!existingIds.has(txId)) {
          const jenis = (r[4]?.trim() || '').toLowerCase();
          const tipe = (jenis === 'income' || jenis === 'pemasukan')
            ? 'PEMASUKAN'
            : (jenis === 'expense' || jenis === 'pengeluaran')
              ? 'PENGELUARAN'
              : 'TRANSFER';
          const nominal = parseFloat(r[6]?.trim()) || 0;
          const umkmId = nameToId.get(namaUsaha.toLowerCase()) || profiles[0].id;
          const tanggal = r[3]?.trim() || new Date().toISOString().split('T')[0];
          const createdAt = r[11]?.trim() || new Date().toISOString();

          localTrx.push({
            id: txId,
            umkmId,
            tipe,
            tanggal,
            kategori: r[5]?.trim() || 'Umum',
            nominal,
            akunId: r[7]?.trim() || 'akun-tunai',
            akunTujuanId: r[8]?.trim() || undefined,
            keterangan: r[9]?.trim() || `${tipe} ${r[5]?.trim() || ''}`,
            createdAt,
            updatedAt: createdAt
          });
          existingIds.add(txId);
          newCount++;
        }
      }

      if (newCount > 0) {
        localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(localTrx));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('untungin:trx_synced', { detail: { newCount, total: localTrx.length } }));
        }
      }

      return { success: true, newCount, total: localTrx.length };
    } catch (e) {
      console.warn('Sync cloud transactions failed:', e);
      return { success: false, newCount: 0, total: this.getTransactions().length };
    }
  }


  addTransaction(trxData: Omit<Transaksi, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; transaction?: Transaksi; message?: string } {
    const profile = this.getProfileById(trxData.umkmId);
    const existingTrx = this.getTransactions(trxData.umkmId);

    // Trial restriction check: Maksimal 10 transaksi
    if (profile?.statusLisensi === 'TRIAL' && existingTrx.length >= 10) {
      return {
        success: false,
        message: 'Batas Trial tercapai (Maks. 10 Transaksi). Silakan upgrade ke Untungin PRO untuk transaksi unlimited!'
      };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newId = `TX-STD-${timestamp}-${randomSuffix}`;
    const now = new Date().toISOString();
    const newTrx: Transaksi = {
      ...trxData,
      id: newId,
      createdAt: now,
      updatedAt: now
    };

    const allTrx = this.getTransactions();
    allTrx.unshift(newTrx);
    localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(allTrx));

    // Update account balance
    this.applyAccountBalanceDelta(newTrx, 'ADD');

    this.logAudit(trxData.umkmId, 'TAMBAH_TRANSAKSI', `${newTrx.tipe} Rp ${newTrx.nominal.toLocaleString('id-ID')} (${newTrx.kategori}) [${newId}]`);
    this.dispatchToGas({ action: 'pushTransaksi', transaction: newTrx });

    return { success: true, transaction: newTrx };
  }

  updateTransaction(trxId: string, updatedData: Partial<Omit<Transaksi, 'id' | 'createdAt' | 'umkmId'>>): boolean {
    const allTrx = this.getTransactions();
    const idx = allTrx.findIndex(t => t.id === trxId);
    if (idx === -1) return false;

    const oldTrx = { ...allTrx[idx] };
    // Revert old transaction balance impact
    this.applyAccountBalanceDelta(oldTrx, 'REVERT');

    const updatedTrx: Transaksi = {
      ...allTrx[idx],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    allTrx[idx] = updatedTrx;
    localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(allTrx));

    // Apply new balance impact
    this.applyAccountBalanceDelta(updatedTrx, 'ADD');

    this.logAudit(oldTrx.umkmId, 'EDIT_TRANSAKSI', `Smart Update transaksi #${trxId.slice(-6)}: ${updatedTrx.keterangan}`);
    this.dispatchToGas({ action: 'pushTransaksi', transaction: updatedTrx });

    return true;
  }

  deleteTransaction(trxId: string): boolean {
    const allTrx = this.getTransactions();
    const idx = allTrx.findIndex(t => t.id === trxId);
    if (idx === -1) return false;

    const [deleted] = allTrx.splice(idx, 1);
    localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(allTrx));

    // Revert balance impact
    this.applyAccountBalanceDelta(deleted, 'REVERT');

    this.logAudit(deleted.umkmId, 'HAPUS_TRANSAKSI', `Smart Delete transaksi #${trxId.slice(-6)} senilai Rp ${deleted.nominal.toLocaleString('id-ID')}`);
    this.dispatchToGas({ action: 'deleteTransaksi', transactionId: trxId });

    return true;
  }

  // Accounts Management
  getAccounts(): AkunKas[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AKUN);
      return raw ? JSON.parse(raw) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  }

  addAccount(account: Omit<AkunKas, 'id'>): AkunKas {
    const accounts = this.getAccounts();
    const newAcc: AkunKas = {
      ...account,
      id: `akun-${Date.now().toString(36)}`
    };
    accounts.push(newAcc);
    localStorage.setItem(STORAGE_KEYS.AKUN, JSON.stringify(accounts));
    this.logAudit('all', 'TAMBAH_AKUN', `Tambah akun baru: ${newAcc.nama}`);
    return newAcc;
  }

  private applyAccountBalanceDelta(trx: Transaksi, mode: 'ADD' | 'REVERT') {
    const accounts = this.getAccounts();
    const multiplier = mode === 'ADD' ? 1 : -1;

    const sourceAcc = accounts.find(a => a.id === trx.akunId);
    if (sourceAcc) {
      if (trx.tipe === 'PEMASUKAN') {
        sourceAcc.saldo += trx.nominal * multiplier;
      } else if (trx.tipe === 'PENGELUARAN') {
        sourceAcc.saldo -= trx.nominal * multiplier;
      } else if (trx.tipe === 'TRANSFER') {
        sourceAcc.saldo -= trx.nominal * multiplier;
        if (trx.akunTujuanId) {
          const destAcc = accounts.find(a => a.id === trx.akunTujuanId);
          if (destAcc) {
            destAcc.saldo += trx.nominal * multiplier;
          }
        }
      }
    }
    localStorage.setItem(STORAGE_KEYS.AKUN, JSON.stringify(accounts));
  }

  // Vouchers
  getVouchers(): VoucherPro[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VOUCHER);
      return raw ? JSON.parse(raw) : SEED_VOUCHERS;
    } catch {
      return SEED_VOUCHERS;
    }
  }

  // Hutang & Piutang Management (Fase 4)
  getHutangPiutang(umkmId?: string): HutangPiutang[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HUTANG_PIUTANG);
      const all: HutangPiutang[] = raw ? JSON.parse(raw) : [];
      if (!umkmId) return all;
      return all.filter(h => h.umkmId === umkmId);
    } catch {
      return [];
    }
  }

  addHutangPiutang(data: Omit<HutangPiutang, 'id' | 'createdAt' | 'updatedAt'>): HutangPiutang {
    const timestamp = Math.floor(Date.now() / 1000);
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newId = `DEBT-STD-${timestamp}-${randomSuffix}`;
    const now = new Date().toISOString();

    const newDebt: HutangPiutang = {
      ...data,
      id: newId,
      createdAt: now,
      updatedAt: now
    };

    const allDebts = this.getHutangPiutang();
    allDebts.unshift(newDebt);
    localStorage.setItem(STORAGE_KEYS.HUTANG_PIUTANG, JSON.stringify(allDebts));

    this.logAudit(
      data.umkmId,
      'CATAT_HUTANG_PIUTANG',
      `Catat ${data.tipe}: ${data.pihakTerkait} senilai Rp ${data.nominal.toLocaleString('id-ID')} [${newId}]`
    );

    // Sync to GAS Engine v1.1
    this.dispatchToGas({
      action: 'pushHutangPiutang',
      data: {
        id: newDebt.id,
        namaUsaha: newDebt.namaUsaha,
        tipe: newDebt.tipe,
        pihakTerkait: newDebt.pihakTerkait,
        kontakWa: newDebt.kontakWa || '',
        nominal: newDebt.nominal,
        tanggal: newDebt.tanggal,
        jatuhTempo: newDebt.jatuhTempo,
        status: newDebt.status,
        keterangan: newDebt.keterangan
      }
    });

    return newDebt;
  }

  updateHutangPiutang(id: string, updatedData: Partial<HutangPiutang>): boolean {
    const allDebts = this.getHutangPiutang();
    const idx = allDebts.findIndex(d => d.id === id);
    if (idx === -1) return false;

    const updated: HutangPiutang = {
      ...allDebts[idx],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    allDebts[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.HUTANG_PIUTANG, JSON.stringify(allDebts));

    this.logAudit(
      updated.umkmId,
      'EDIT_HUTANG_PIUTANG',
      `Update ${updated.tipe} #${id.slice(-6)}: ${updated.pihakTerkait}`
    );

    this.dispatchToGas({
      action: 'pushHutangPiutang',
      data: {
        id: updated.id,
        namaUsaha: updated.namaUsaha,
        tipe: updated.tipe,
        pihakTerkait: updated.pihakTerkait,
        kontakWa: updated.kontakWa || '',
        nominal: updated.nominal,
        tanggal: updated.tanggal,
        jatuhTempo: updated.jatuhTempo,
        status: updated.status,
        keterangan: updated.keterangan
      }
    });

    return true;
  }

  deleteHutangPiutang(id: string): boolean {
    const allDebts = this.getHutangPiutang();
    const idx = allDebts.findIndex(d => d.id === id);
    if (idx === -1) return false;

    const [deleted] = allDebts.splice(idx, 1);
    localStorage.setItem(STORAGE_KEYS.HUTANG_PIUTANG, JSON.stringify(allDebts));

    this.logAudit(
      deleted.umkmId,
      'HAPUS_HUTANG_PIUTANG',
      `Hapus ${deleted.tipe} #${id.slice(-6)}: ${deleted.pihakTerkait} Rp ${deleted.nominal.toLocaleString('id-ID')}`
    );

    this.dispatchToGas({ action: 'deleteHutangPiutang', id });

    return true;
  }

  settleHutangPiutang(
    id: string,
    options?: { recordToCashbook: boolean; akunId?: string }
  ): { success: boolean; cashTransaction?: Transaksi; message?: string } {
    const allDebts = this.getHutangPiutang();
    const idx = allDebts.findIndex(d => d.id === id);
    if (idx === -1) return { success: false, message: 'Catatan tidak ditemukan.' };

    const debt = allDebts[idx];
    const todayStr = new Date().toISOString().split('T')[0];

    let createdCashTrx: Transaksi | undefined = undefined;

    // Pelunasan Cerdas: Catat otomatis ke Buku Kas jika dipilih
    if (options?.recordToCashbook) {
      const defaultAccount = this.getAccounts().find(a => a.isDefault) || this.getAccounts()[0];
      const selectedAkunId = options.akunId || defaultAccount?.id || 'akun-tunai';

      if (debt.tipe === 'PIUTANG') {
        // Pelunasan piutang = uang masuk (PEMASUKAN)
        const trxResult = this.addTransaction({
          umkmId: debt.umkmId,
          tipe: 'PEMASUKAN',
          tanggal: todayStr,
          kategori: 'Pelunasan Piutang',
          nominal: debt.nominal,
          akunId: selectedAkunId,
          keterangan: `Pelunasan piutang: ${debt.pihakTerkait} (${debt.keterangan || 'Bon'})`
        });
        if (trxResult.success && trxResult.transaction) {
          createdCashTrx = trxResult.transaction;
        }
      } else {
        // Pelunasan hutang = uang keluar (PENGELUARAN)
        const trxResult = this.addTransaction({
          umkmId: debt.umkmId,
          tipe: 'PENGELUARAN',
          tanggal: todayStr,
          kategori: 'Pelunasan Hutang Supplier',
          nominal: debt.nominal,
          akunId: selectedAkunId,
          keterangan: `Pelunasan hutang ke: ${debt.pihakTerkait} (${debt.keterangan || 'Faktur/Nota'})`
        });
        if (trxResult.success && trxResult.transaction) {
          createdCashTrx = trxResult.transaction;
        }
      }
    }

    // Update status to LUNAS
    const updatedDebt: HutangPiutang = {
      ...debt,
      status: 'LUNAS',
      tanggalLunas: todayStr,
      transaksiKasId: createdCashTrx ? createdCashTrx.id : debt.transaksiKasId,
      updatedAt: new Date().toISOString()
    };

    allDebts[idx] = updatedDebt;
    localStorage.setItem(STORAGE_KEYS.HUTANG_PIUTANG, JSON.stringify(allDebts));

    this.logAudit(
      debt.umkmId,
      'LUNAS_HUTANG_PIUTANG',
      `Pelunasan ${debt.tipe}: ${debt.pihakTerkait} Rp ${debt.nominal.toLocaleString('id-ID')}${
        createdCashTrx ? ` (Tercatat otomatis di Buku Kas #${createdCashTrx.id.slice(-6)})` : ''
      }`
    );

    this.dispatchToGas({
      action: 'pushHutangPiutang',
      data: {
        id: updatedDebt.id,
        namaUsaha: updatedDebt.namaUsaha,
        tipe: updatedDebt.tipe,
        pihakTerkait: updatedDebt.pihakTerkait,
        kontakWa: updatedDebt.kontakWa || '',
        nominal: updatedDebt.nominal,
        tanggal: updatedDebt.tanggal,
        jatuhTempo: updatedDebt.jatuhTempo,
        status: updatedDebt.status,
        keterangan: updatedDebt.keterangan
      }
    });

    return {
      success: true,
      cashTransaction: createdCashTrx,
      message: `Berhasil menandai lunas ${debt.tipe === 'PIUTANG' ? 'piutang' : 'hutang'} ${debt.pihakTerkait}.${
        createdCashTrx ? ' Transaksi kas otomatis tercatat.' : ''
      }`
    };
  }

  // Audit Logs
  getAuditLogs(umkmId?: string): AuditLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
      const all: AuditLog[] = raw ? JSON.parse(raw) : [];
      if (!umkmId) return all;
      return all.filter(a => a.umkmId === umkmId || a.umkmId === 'all');
    } catch {
      return [];
    }
  }

  logAudit(umkmId: string, aksi: string, detail: string) {
    try {
      const logs = this.getAuditLogs();
      const newLog: AuditLog = {
        id: `audit-${Date.now()}`,
        umkmId,
        aksi,
        detail,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newLog);
      // Keep up to 200 logs
      if (logs.length > 200) logs.pop();
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
    } catch (e) {
      console.warn('Audit error:', e);
    }
  }
}

export const gasService = new GasService();
