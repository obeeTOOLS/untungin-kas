import React from 'react';
import { Transaksi, UMKMProfile, AkunKas } from '../types';

interface PrintableReportProps {
  umkm: UMKMProfile;
  transactions: Transaksi[];
  accounts: AkunKas[];
  periodLabel: string;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  umkm,
  transactions,
  accounts,
  periodLabel
}) => {
  const accountMap = new Map(accounts.map(a => [a.id, a.nama]));

  // Hitung ringkasan total pemasukan dan pengeluaran
  let totalMasuk = 0;
  let totalKeluar = 0;
  transactions.forEach(t => {
    if (t.tipe === 'PEMASUKAN') totalMasuk += t.nominal;
    else if (t.tipe === 'PENGELUARAN') totalKeluar += t.nominal;
  });
  const kasBersih = totalMasuk - totalKeluar;
  const ratio = totalMasuk > 0 ? Math.round((totalKeluar / totalMasuk) * 100) : 0;

  // Urutkan transaksi secara kronologis untuk kalkulasi saldo berjalan
  const sorted = [...transactions].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  let runningBalance = 0;

  const printedAt = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="print-only text-slate-900 bg-white p-6 max-w-4xl mx-auto font-sans leading-normal">
      
      {/* 1. Header Dokumen Resmi */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-xs tracking-wider uppercase text-slate-600">
                UNTUNGIN — BUKU KAS UMKM
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white uppercase tracking-wider">
                Laporan Resmi
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
              {umkm.namaUsaha}
            </h1>
            <p className="text-xs text-slate-700 mt-1 font-medium">
              Nama Pemilik: <strong>{umkm.pemilik}</strong> · Bidang Usaha: {umkm.kategoriUsaha}
            </p>
            <p className="text-xs text-slate-600">
              Alamat: {umkm.alamat || '-'} · Kontak / WhatsApp: {umkm.kontak || '-'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-block p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Rentang Periode Laporan
              </span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                {periodLabel}
              </span>
              <span className="block text-[10px] text-slate-500 mt-1">
                Dicetak: {printedAt} WIB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ringkasan Finansial Periode Terpilih */}
      <div className="grid grid-cols-3 gap-3 mb-6 print-avoid-break">
        <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/60">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Pemasukan (Omzet)
          </span>
          <span className="text-lg font-black text-emerald-700 tabular-nums block mt-1">
            Rp {totalMasuk.toLocaleString('id-ID')}
          </span>
          <span className="block text-[10px] text-slate-500 mt-1">
            {transactions.filter(t => t.tipe === 'PEMASUKAN').length} Transaksi Penerimaan
          </span>
        </div>

        <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/60">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Pengeluaran (Beban)
          </span>
          <span className="text-lg font-black text-rose-700 tabular-nums block mt-1">
            Rp {totalKeluar.toLocaleString('id-ID')}
          </span>
          <span className="block text-[10px] text-slate-500 mt-1">
            {transactions.filter(t => t.tipe === 'PENGELUARAN').length} Transaksi Pengeluaran
          </span>
        </div>

        <div className="border border-slate-900 rounded-xl p-3.5 bg-slate-100">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Saldo Akhir / Kas Bersih
          </span>
          <span className={`text-lg font-black tabular-nums block mt-1 ${
            kasBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {kasBersih >= 0 ? '+' : '-'}Rp {Math.abs(kasBersih).toLocaleString('id-ID')}
          </span>
          <span className="block text-[10px] text-slate-600 mt-1">
            {totalMasuk > 0 ? `Rasio Beban: ${ratio}% dari total omzet` : 'Laba Kas Bersih'}
          </span>
        </div>
      </div>

      {/* 3. Tabel Rincian Transaksi */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Tabel Rincian Transaksi Kas
          </h2>
          <span className="text-[10px] text-slate-500">
            Total: {transactions.length} mutasi tercatat
          </span>
        </div>

        <table className="w-full text-[10.5px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
              <th className="border border-slate-300 py-2 px-2 text-center w-7">No</th>
              <th className="border border-slate-300 py-2 px-2 text-left w-20">Tanggal</th>
              <th className="border border-slate-300 py-2 px-2 text-left w-28">Akun Kas</th>
              <th className="border border-slate-300 py-2 px-2 text-left w-28">Kategori</th>
              <th className="border border-slate-300 py-2 px-2 text-left">Keterangan</th>
              <th className="border border-slate-300 py-2 px-2 text-right w-24">Masuk (Rp)</th>
              <th className="border border-slate-300 py-2 px-2 text-right w-24">Keluar (Rp)</th>
              <th className="border border-slate-300 py-2 px-2 text-right w-24">Saldo (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 italic text-slate-500 border border-slate-300">
                  Tidak ada transaksi kas pada periode laporan ini.
                </td>
              </tr>
            ) : (
              sorted.map((t, idx) => {
                const accName = accountMap.get(t.akunId) || t.akunId;
                const destName = t.akunTujuanId ? ` ke ${accountMap.get(t.akunTujuanId) || t.akunTujuanId}` : '';
                
                let masuk = 0;
                let keluar = 0;
                if (t.tipe === 'PEMASUKAN') {
                  masuk = t.nominal;
                  runningBalance += t.nominal;
                } else if (t.tipe === 'PENGELUARAN') {
                  keluar = t.nominal;
                  runningBalance -= t.nominal;
                } else if (t.tipe === 'TRANSFER') {
                  // Transfer internal kas
                }

                return (
                  <tr key={t.id} className="border-b border-slate-200 print-avoid-break hover:bg-slate-50">
                    <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-600">{idx + 1}</td>
                    <td className="border border-slate-300 py-1.5 px-2 whitespace-nowrap font-mono text-[10px] text-slate-700">{t.tanggal}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-medium text-slate-800">{accName}{destName}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-700">{t.kategori}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-700">{t.keterangan || '-'}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right tabular-nums text-emerald-700 font-semibold">
                      {masuk > 0 ? masuk.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right tabular-nums text-rose-700 font-semibold">
                      {keluar > 0 ? keluar.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right tabular-nums font-bold text-slate-900">
                      {runningBalance.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
              <td colSpan={5} className="border border-slate-300 py-2 px-2 text-right uppercase tracking-wider text-slate-900">
                Total Akumulasi Periode:
              </td>
              <td className="border border-slate-300 py-2 px-2 text-right tabular-nums text-emerald-700 font-black">
                Rp {totalMasuk.toLocaleString('id-ID')}
              </td>
              <td className="border border-slate-300 py-2 px-2 text-right tabular-nums text-rose-700 font-black">
                Rp {totalKeluar.toLocaleString('id-ID')}
              </td>
              <td className="border border-slate-300 py-2 px-2 text-right tabular-nums text-slate-950 font-black">
                Rp {kasBersih.toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. Footer Dokumen: Tanggal Cetak Otomatis & Kolom Tanda Tangan */}
      <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-end text-xs print-avoid-break">
        <div className="text-[10px] text-slate-500 max-w-sm space-y-1">
          <p className="font-semibold text-slate-700">UNTUNGIN — Pembukuan & Arus Kas Digital</p>
          <p>Dokumen ini diterbitkan secara sah dan otomatis melalui UNTUNGIN Standalone PWA.</p>
          <p>Tersinkronisasi langsung dengan Database Google Spreadsheet Vault UMKM.</p>
          <p className="text-slate-400">Dicetak otomatis pada: {printedAt} WIB</p>
        </div>

        <div className="text-center w-56">
          <p className="text-xs text-slate-700 font-medium">
            Dibuat Oleh:
          </p>
          <p className="text-[11px] text-slate-500">
            Penanggung Jawab Usaha
          </p>
          <div className="h-14 flex items-center justify-center">
            {/* Ruang untuk TTD & Stempel Fisik */}
            <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan & Cap Usaha ]</span>
          </div>
          <p className="text-xs font-bold text-slate-950 border-t border-slate-400 pt-1">
            ( {umkm.pemilik} )
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{umkm.namaUsaha}</p>
        </div>
      </div>

    </div>
  );
};
