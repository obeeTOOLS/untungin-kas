import { UMKMProfile, Transaksi, AkunKas, VoucherPro, AuditLog } from '../types';
import { SEED_PROFILES } from '../data/seedProfiles';
import { DEFAULT_ACCOUNTS, SEED_VOUCHERS, getSampleTransactions } from '../data/seedData';

export const GAS_ENDPOINT = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GAS_API_URL) 
  ? import.meta.env.VITE_GAS_API_URL 
  : 'https://script.google.com/macros/s/AKfycbzt3TEU-OQioP9OxUm5BPHuuAihKqF1tJDDb396T4TguB2V_-KpKMaLD5O8VD6xAiVk/exec';

export const SPREADSHEET_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SPREADSHEET_ID)
  ? import.meta.env.VITE_SPREADSHEET_ID
  : '1l_MT50H0blcu771UYMm6Tqc4Q1R2s4U2iOglx-cW4kE';

const STORAGE_KEYS = {
  PROFILES: 'untungin_std_profiles_v1',
  ACTIVE_PROFILE_ID: 'untungin_std_active_profile_id_v1',
  TRANSAKSI: 'untungin_std_transaksi_v1',
  AKUN: 'untungin_std_akun_v1',
  VOUCHER: 'untungin_std_voucher_v1',
  AUDIT: 'untungin_std_audit_v1',
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
        this.processQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
      this.initStorage();
    }
  }

  private initStorage() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(SEED_PROFILES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.AKUN)) {
        localStorage.setItem(STORAGE_KEYS.AKUN, JSON.stringify(DEFAULT_ACCOUNTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.VOUCHER)) {
        localStorage.setItem(STORAGE_KEYS.VOUCHER, JSON.stringify(SEED_VOUCHERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TRANSAKSI)) {
        const defaultTrx = getSampleTransactions(SEED_PROFILES[0].id);
        localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(defaultTrx));
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

  private async processQueue() {
    try {
      const queueRaw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (!queueRaw) return;
      const queue = JSON.parse(queueRaw);
      if (!queue.length) return;

      const remaining = [];
      for (const item of queue) {
        try {
          const res = await fetch(GAS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(item.payload),
            signal: AbortSignal.timeout(5000)
          });
          if (!res.ok) remaining.push(item);
        } catch {
          remaining.push(item);
        }
      }
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(remaining));
    } catch (e) {
      console.warn('Process queue error:', e);
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
    const found = profiles.find(p => p.id === activeId);
    return found || profiles[0];
  }

  setActiveProfileId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
    this.logAudit(id, 'LOGIN_PROFIL', `Masuk ke profil usaha ${this.getProfileById(id)?.namaUsaha || id}`);
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
      statusLisensi: 'TRIAL',
      lisensiExpiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durasiPaket: 'Trial',
      createdAt: new Date().toISOString().split('T')[0]
    };

    profiles.unshift(newProfile);
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, newId);
    this.logAudit(newId, 'DAFTAR_USAHA_BARU', `Pendaftaran usaha baru: ${newProfile.namaUsaha}`);
    this.dispatchToGas({ action: 'daftarUsaha', profile: newProfile });
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
