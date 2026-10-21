import { AkunKas, VoucherPro, Transaksi, HutangPiutang } from '../types';
import { OFFICIAL_KAS_TRANSACTIONS } from './cloudTransactions';

export { OFFICIAL_KAS_TRANSACTIONS };

export const DEFAULT_ACCOUNTS: AkunKas[] = [
  {
    id: 'akun-tunai',
    umkmId: 'all',
    nama: 'Kas Utama (Tunai)',
    tipe: 'TUNAI',
    saldo: 0,
    warna: '#10b981',
    isDefault: true
  },
  {
    id: 'akun-bca',
    umkmId: 'all',
    nama: 'Rekening Bank Usaha (BCA)',
    tipe: 'BANK',
    nomorRekening: '-',
    atasNama: 'Rekening Usaha',
    saldo: 0,
    warna: '#0066b2'
  },
  {
    id: 'akun-bri',
    umkmId: 'all',
    nama: 'Bank Tabungan (BRI)',
    tipe: 'BANK',
    nomorRekening: '-',
    atasNama: 'Kas Tabungan',
    saldo: 0,
    warna: '#00529c'
  },
  {
    id: 'akun-qris',
    umkmId: 'all',
    nama: 'QRIS & E-Wallet (GoPay/OVO/Dana)',
    tipe: 'QRIS',
    nomorRekening: 'NMID',
    atasNama: 'Merchant Untungin',
    saldo: 0,
    warna: '#f59e0b'
  }
];

export const SEED_VOUCHERS: VoucherPro[] = [
  {
    kode: 'GEKRAFS-PRO-BATU',
    durasiBulan: 999,
    namaPaket: 'Untungin PRO Lifetime (DPC Gekrafs Batu)',
    status: 'AKTIF'
  },
  {
    kode: 'PARTNERUP-VIP',
    durasiBulan: 999,
    namaPaket: 'Untungin PRO Lifetime (VIP PartnerUp)',
    status: 'AKTIF'
  },
  {
    kode: 'KAS-PREMIUM-LIFETIME',
    durasiBulan: 999,
    namaPaket: 'Untungin PRO Lifetime Premium',
    status: 'AKTIF'
  },
  {
    kode: 'BATCH2-JUARA',
    durasiBulan: 6,
    namaPaket: 'Untungin PRO 6 Bulan (Juara Batch 2)',
    status: 'AKTIF'
  },
  {
    kode: 'MASTER-DEV-UNLIMITED',
    durasiBulan: 999,
    namaPaket: 'Untungin PRO Lifetime (Master Developer)',
    status: 'AKTIF'
  }
];

export const DEFAULT_CATEGORIES = {
  pemasukan: [
    'Penjualan Produk',
    'Pendapatan Jasa',
    'Piutang Diterima',
    'Bonus & Komisi',
    'Pendapatan Lainnya'
  ],
  pengeluaran: [
    'Belanja Bahan Baku',
    'Operasional & Perlengkapan',
    'Gaji Karyawan',
    'Listrik, Air & Internet',
    'Sewa Tempat Usaha',
    'Pemasaran & Promosi',
    'Pajak & Retribusi',
    'Pengeluaran Lainnya'
  ]
};

export function getSampleTransactions(umkmId: string): Transaksi[] {
  return OFFICIAL_KAS_TRANSACTIONS.filter(t => t.umkmId === umkmId);
}

export function getSampleHutangPiutang(_umkmId: string, _namaUsaha: string): HutangPiutang[] {
  // Data hanya bersumber dari PartnerUp, tidak ada data hutang piutang dummy
  return [];
}


