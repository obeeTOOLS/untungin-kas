import { AkunKas, VoucherPro, Transaksi, HutangPiutang } from '../types';

export const DEFAULT_ACCOUNTS: AkunKas[] = [
  {
    id: 'akun-tunai',
    umkmId: 'all',
    nama: 'Kas Utama (Tunai)',
    tipe: 'TUNAI',
    saldo: 3500000,
    warna: '#10b981',
    isDefault: true
  },
  {
    id: 'akun-bca',
    umkmId: 'all',
    nama: 'BCA Operasional',
    tipe: 'BANK',
    nomorRekening: '8830-192-841',
    atasNama: 'Rekening Usaha',
    saldo: 12450000,
    warna: '#0066b2'
  },
  {
    id: 'akun-bri',
    umkmId: 'all',
    nama: 'BRI Simpedes',
    tipe: 'BANK',
    nomorRekening: '0341-01-002847-50-3',
    atasNama: 'Kas Tabungan',
    saldo: 7800000,
    warna: '#00529c'
  },
  {
    id: 'akun-qris',
    umkmId: 'all',
    nama: 'QRIS & E-Wallet (GoPay/OVO/Dana)',
    tipe: 'QRIS',
    nomorRekening: 'NMID: ID102003847192',
    atasNama: 'Merchant Untungin',
    saldo: 4920000,
    warna: '#f59e0b'
  }
];

export const SEED_VOUCHERS: VoucherPro[] = [
  {
    kode: 'PRO3BLN',
    durasiBulan: 3,
    namaPaket: 'Untungin PRO 3 Bulan',
    status: 'AKTIF'
  },
  {
    kode: 'PRO6BLN',
    durasiBulan: 6,
    namaPaket: 'Untungin PRO 6 Bulan',
    status: 'AKTIF'
  },
  {
    kode: 'PRO9BLN',
    durasiBulan: 9,
    namaPaket: 'Untungin PRO 9 Bulan',
    status: 'AKTIF'
  },
  {
    kode: 'PRO1THN',
    durasiBulan: 12,
    namaPaket: 'Untungin PRO 1 Tahun (Terpopuler)',
    status: 'AKTIF'
  },
  {
    kode: 'PROLIFETIME',
    durasiBulan: 999,
    namaPaket: 'Untungin PRO Lifetime (Akses Selamanya)',
    status: 'AKTIF'
  },
  {
    kode: 'UNTUNGIN2026',
    durasiBulan: 12,
    namaPaket: 'Promo Spesial UMKM Juara (1 Tahun)',
    status: 'AKTIF'
  },
  {
    kode: 'BERKAHUMKM',
    durasiBulan: 6,
    namaPaket: 'Voucher Komunitas UMKM Indonesia (6 Bulan)',
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
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');

  return [
    {
      id: 'trx-001',
      umkmId,
      tipe: 'PEMASUKAN',
      tanggal: `${year}-${month}-02`,
      kategori: 'Penjualan Produk',
      nominal: 1850000,
      akunId: 'akun-tunai',
      keterangan: 'Penjualan harian kasir tunai',
      createdAt: `${year}-${month}-02T10:00:00.000Z`,
      updatedAt: `${year}-${month}-02T10:00:00.000Z`
    },
    {
      id: 'trx-002',
      umkmId,
      tipe: 'PENGELUARAN',
      tanggal: `${year}-${month}-03`,
      kategori: 'Belanja Bahan Baku',
      nominal: 920000,
      akunId: 'akun-bca',
      keterangan: 'Restock bahan baku mingguan dari supplier',
      createdAt: `${year}-${month}-03T11:30:00.000Z`,
      updatedAt: `${year}-${month}-03T11:30:00.000Z`
    },
    {
      id: 'trx-003',
      umkmId,
      tipe: 'PEMASUKAN',
      tanggal: `${year}-${month}-05`,
      kategori: 'Penjualan Produk',
      nominal: 2450000,
      akunId: 'akun-qris',
      keterangan: 'Pembayaran pelanggan via QRIS & E-Wallet',
      createdAt: `${year}-${month}-05T14:15:00.000Z`,
      updatedAt: `${year}-${month}-05T14:15:00.000Z`
    },
    {
      id: 'trx-004',
      umkmId,
      tipe: 'PENGELUARAN',
      tanggal: `${year}-${month}-07`,
      kategori: 'Listrik, Air & Internet',
      nominal: 450000,
      akunId: 'akun-bca',
      keterangan: 'Bayar tagihan listrik PLN dan WiFi toko',
      createdAt: `${year}-${month}-07T09:00:00.000Z`,
      updatedAt: `${year}-${month}-07T09:00:00.000Z`
    },
    {
      id: 'trx-005',
      umkmId,
      tipe: 'TRANSFER',
      tanggal: `${year}-${month}-08`,
      kategori: 'Transfer Kas',
      nominal: 1000000,
      akunId: 'akun-tunai',
      akunTujuanId: 'akun-bca',
      keterangan: 'Setor tunai hasil kasir ke rekening BCA',
      createdAt: `${year}-${month}-08T16:00:00.000Z`,
      updatedAt: `${year}-${month}-08T16:00:00.000Z`
    },
    {
      id: 'trx-006',
      umkmId,
      tipe: 'PEMASUKAN',
      tanggal: `${year}-${month}-10`,
      kategori: 'Pendapatan Jasa',
      nominal: 1350000,
      akunId: 'akun-bri',
      keterangan: 'Pelunasan order katering/jasa pelanggan',
      createdAt: `${year}-${month}-10T13:45:00.000Z`,
      updatedAt: `${year}-${month}-10T13:45:00.000Z`
    },
    {
      id: 'trx-007',
      umkmId,
      tipe: 'PENGELUARAN',
      tanggal: `${year}-${month}-12`,
      kategori: 'Pemasaran & Promosi',
      nominal: 250000,
      akunId: 'akun-qris',
      keterangan: 'Iklan promosi media sosial & cetak banner promo',
      createdAt: `${year}-${month}-12T15:20:00.000Z`,
      updatedAt: `${year}-${month}-12T15:20:00.000Z`
    }
  ];
}

export function getSampleHutangPiutang(umkmId: string, namaUsaha: string): HutangPiutang[] {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Overdue date (3 days ago)
  const overdueDate = new Date(d);
  overdueDate.setDate(d.getDate() - 3);
  const overdueStr = overdueDate.toISOString().split('T')[0];

  // Upcoming date (+5 days)
  const upcomingDate = new Date(d);
  upcomingDate.setDate(d.getDate() + 5);
  const upcomingStr = upcomingDate.toISOString().split('T')[0];

  // Past transaction date (-7 days)
  const pastTxDate = new Date(d);
  pastTxDate.setDate(d.getDate() - 7);
  const pastTxStr = pastTxDate.toISOString().split('T')[0];

  return [
    {
      id: 'DEBT-STD-001',
      umkmId,
      namaUsaha,
      tipe: 'PIUTANG',
      pihakTerkait: 'Ibu Hj. Siti (Warung Berkah)',
      kontakWa: '081298765432',
      nominal: 1250000,
      tanggal: pastTxStr,
      jatuhTempo: overdueStr, // Overdue
      status: 'BELUM_LUNAS',
      keterangan: 'Bon pesanan paket tumpeng & sembako 50 porsi',
      createdAt: `${pastTxStr}T08:30:00.000Z`,
      updatedAt: `${pastTxStr}T08:30:00.000Z`
    },
    {
      id: 'DEBT-STD-002',
      umkmId,
      namaUsaha,
      tipe: 'PIUTANG',
      pihakTerkait: 'Pak Budi Handoko',
      kontakWa: '085712345678',
      nominal: 450000,
      tanggal: pastTxStr,
      jatuhTempo: todayStr, // Jatuh tempo hari ini
      status: 'BELUM_LUNAS',
      keterangan: 'Pembelian langganan bahan baku & konsumsi kantor',
      createdAt: `${pastTxStr}T10:15:00.000Z`,
      updatedAt: `${pastTxStr}T10:15:00.000Z`
    },
    {
      id: 'DEBT-STD-003',
      umkmId,
      namaUsaha,
      tipe: 'PIUTANG',
      pihakTerkait: 'Pak Hendra Saputra',
      kontakWa: '082188990011',
      nominal: 350000,
      tanggal: pastTxStr,
      jatuhTempo: pastTxStr,
      status: 'LUNAS',
      tanggalLunas: todayStr,
      keterangan: 'Bon nota #042 kopi & cemilan harian',
      createdAt: `${pastTxStr}T14:00:00.000Z`,
      updatedAt: `${todayStr}T11:00:00.000Z`
    },
    {
      id: 'DEBT-STD-004',
      umkmId,
      namaUsaha,
      tipe: 'HUTANG',
      pihakTerkait: 'CV Sumber Pangan Jaya',
      kontakWa: '081377889900',
      nominal: 2750000,
      tanggal: pastTxStr,
      jatuhTempo: upcomingStr, // Belum jatuh tempo
      status: 'BELUM_LUNAS',
      keterangan: 'Faktur tempo bahan baku beras 5 karung & minyak goreng',
      createdAt: `${pastTxStr}T09:00:00.000Z`,
      updatedAt: `${pastTxStr}T09:00:00.000Z`
    },
    {
      id: 'DEBT-STD-005',
      umkmId,
      namaUsaha,
      tipe: 'HUTANG',
      pihakTerkait: 'UD Berkah Plastik & Kemasan',
      kontakWa: '081922334455',
      nominal: 600000,
      tanggal: pastTxStr,
      jatuhTempo: todayStr, // Jatuh tempo hari ini
      status: 'BELUM_LUNAS',
      keterangan: 'Pengadaan 1000 pcs cup, plastik sealer, dan kardus packing',
      createdAt: `${pastTxStr}T11:30:00.000Z`,
      updatedAt: `${pastTxStr}T11:30:00.000Z`
    }
  ];
}

