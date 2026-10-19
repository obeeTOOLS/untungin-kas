export type TipeTransaksi = 'PEMASUKAN' | 'PENGELUARAN' | 'TRANSFER';
export type StatusLisensi = 'TRIAL' | 'PRO';
export type TipeAkun = 'TUNAI' | 'BANK' | 'EWALLET' | 'QRIS';

export interface UMKMProfile {
  id: string;
  namaUsaha: string;
  pemilik: string;
  kategoriUsaha: string;
  kontak: string;
  alamat: string;
  statusLisensi: StatusLisensi;
  lisensiExpiredAt: string | null; // ISO Date or 'LIFETIME'
  durasiPaket: string; // 'Trial', '3 Bulan', '6 Bulan', '1 Tahun', 'Lifetime'
  pinKas: string; // 6-digit PIN
  saldoAwal: number;
  createdAt: string;
}

export interface Transaksi {
  id: string;
  umkmId: string;
  tipe: TipeTransaksi;
  tanggal: string; // YYYY-MM-DD
  kategori: string;
  nominal: number;
  akunId: string;
  akunTujuanId?: string; // Khusus TRANSFER
  keterangan: string;
  lampiran?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AkunKas {
  id: string;
  umkmId: string;
  nama: string;
  tipe: TipeAkun;
  nomorRekening?: string;
  atasNama?: string;
  saldo: number;
  warna: string;
  isDefault?: boolean;
}

export interface VoucherPro {
  kode: string;
  durasiBulan: number; // 3, 6, 9, 12, 999 for Lifetime
  namaPaket: string;
  status: 'AKTIF' | 'DIGUNAKAN';
  digunakanOleh?: string;
  tanggalDigunakan?: string;
}

export interface AuditLog {
  id: string;
  umkmId: string;
  aksi: string;
  detail: string;
  timestamp: string;
}

export interface RingkasanKeuangan {
  saldoBerjalan: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  labaBersih: number;
  estimasiPajak: number;
  jumlahTransaksi: number;
}

export type TipeHutangPiutang = 'PIUTANG' | 'HUTANG';
export type StatusHutangPiutang = 'BELUM_LUNAS' | 'LUNAS';

export interface HutangPiutang {
  id: string; // DEBT-STD-[TIMESTAMP]-[RANDOM]
  umkmId: string;
  namaUsaha: string;
  tipe: TipeHutangPiutang;
  pihakTerkait: string; // Nama pembeli / toko supplier
  kontakWa?: string; // No. WhatsApp / Kontak
  nominal: number;
  tanggal: string; // YYYY-MM-DD
  jatuhTempo: string; // YYYY-MM-DD
  status: StatusHutangPiutang;
  keterangan: string;
  tanggalLunas?: string;
  transaksiKasId?: string; // ID transaksi kas terkait saat pelunasan otomatis
  createdAt: string;
  updatedAt: string;
}

