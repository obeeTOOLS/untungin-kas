import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaksi, UMKMProfile, AkunKas } from '../types';

/**
 * Ekspor data transaksi terpilih ke format CSV / Excel murni (UTF-8 BOM)
 * dengan penamaan Laporan-Kas-[NamaUsaha]-[Periode].csv
 */
export function exportTransactionsToCSV(
  transactions: Transaksi[],
  accounts: AkunKas[],
  umkm: UMKMProfile,
  periodLabel: string = 'Semua_Waktu'
) {
  const accountMap = new Map(accounts.map(a => [a.id, a.nama]));
  
  // Format sanitasi nama file
  const cleanUmkmName = umkm.namaUsaha.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan-Kas-${cleanUmkmName}-${cleanPeriod}.csv`;

  // Hitung ringkasan
  let totalMasuk = 0;
  let totalKeluar = 0;
  transactions.forEach(t => {
    if (t.tipe === 'PEMASUKAN') totalMasuk += t.nominal;
    else if (t.tipe === 'PENGELUARAN') totalKeluar += t.nominal;
  });
  const kasBersih = totalMasuk - totalKeluar;

  // Header meta & kolom
  const metaLines = [
    `"LAPORAN BUKU KAS UMKM - UNTUNGIN STANDALONE"`,
    `"Nama Usaha:","${umkm.namaUsaha.replace(/"/g, '""')}"`,
    `"Pemilik:","${umkm.pemilik.replace(/"/g, '""')}"`,
    `"Kontak:","${umkm.kontak.replace(/"/g, '""')}"`,
    `"Periode:","${periodLabel.replace(/"/g, '""')}"`,
    `"Tanggal Ekspor:","${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}"`,
    `"Total Pemasukan:",${totalMasuk}`,
    `"Total Pengeluaran:",${totalKeluar}`,
    `"Kas Bersih (Net):",${kasBersih}`,
    `` // Baris kosong pemisah
  ];

  const headers = ['No', 'ID Transaksi', 'Tanggal', 'Tipe Mutasi', 'Akun Kas', 'Kategori', 'Keterangan', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Saldo Kas (Rp)'];

  let runningBalance = 0;
  // Urutkan transaksi secara kronologis untuk kalkulasi saldo berjalan
  const sorted = [...transactions].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const rows = sorted.map((t, idx) => {
    const accName = accountMap.get(t.akunId) || t.akunId;
    const destName = t.akunTujuanId ? ` -> ${accountMap.get(t.akunTujuanId) || t.akunTujuanId}` : '';
    
    let masuk = 0;
    let keluar = 0;
    if (t.tipe === 'PEMASUKAN') {
      masuk = t.nominal;
      runningBalance += t.nominal;
    } else if (t.tipe === 'PENGELUARAN') {
      keluar = t.nominal;
      runningBalance -= t.nominal;
    } else if (t.tipe === 'TRANSFER') {
      // Transfer antar-rekening tidak mengubah kas konsolidasi
    }

    return [
      idx + 1,
      `"${t.id}"`,
      `"${t.tanggal}"`,
      `"${t.tipe}"`,
      `"${(accName + destName).replace(/"/g, '""')}"`,
      `"${t.kategori.replace(/"/g, '""')}"`,
      `"${(t.keterangan || '-').replace(/"/g, '""')}"`,
      masuk,
      keluar,
      runningBalance
    ].join(',');
  });

  // Gabungkan dengan UTF-8 Byte Order Mark (BOM) agar Excel tidak rusak membaca aksen/angka
  const csvContent = '\uFEFF' + [...metaLines, headers.join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor dokumen PDF resmi menggunakan jsPDF
 */
export function exportTransactionsToPDF(
  transactions: Transaksi[],
  accounts: AkunKas[],
  umkm: UMKMProfile,
  periodText: string = 'Bulan Ini'
) {
  const accountMap = new Map(accounts.map(a => [a.id, a.nama]));
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Banner
  doc.setFillColor(0, 28, 60); // #001c3c
  doc.rect(0, 0, 210, 36, 'F');

  // Title & Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('UNTUNGIN — BUKU KAS & ARUS KAS UMKM', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Usaha: ${umkm.namaUsaha} | Pemilik: ${umkm.pemilik} | Kontak: ${umkm.kontak}`, 14, 23);
  doc.text(`Periode: ${periodText} | Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 29);

  // Financial Summary Strip
  let totalMasuk = 0;
  let totalKeluar = 0;
  transactions.forEach(t => {
    if (t.tipe === 'PEMASUKAN') totalMasuk += t.nominal;
    else if (t.tipe === 'PENGELUARAN') totalKeluar += t.nominal;
  });
  const labaBersih = totalMasuk - totalKeluar;
  const estimasiPajak = Math.round(totalMasuk * 0.005);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 182, 22, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, 182, 22, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Pemasukan', 20, 49);
  doc.text('Total Pengeluaran', 68, 49);
  doc.text('Laba Bersih (Net Profit)', 116, 49);
  doc.text('Estimasi Pajak 0,5%', 162, 49);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`Rp ${totalMasuk.toLocaleString('id-ID')}`, 20, 57);

  doc.setTextColor(244, 63, 94); // rose
  doc.text(`Rp ${totalKeluar.toLocaleString('id-ID')}`, 68, 57);

  doc.setTextColor(labaBersih >= 0 ? 16 : 244, labaBersih >= 0 ? 185 : 63, labaBersih >= 0 ? 129 : 94);
  doc.text(`Rp ${labaBersih.toLocaleString('id-ID')}`, 116, 57);

  doc.setTextColor(217, 119, 6); // amber
  doc.text(`Rp ${estimasiPajak.toLocaleString('id-ID')}`, 162, 57);

  // Table Data
  const tableRows = transactions.map((t, idx) => {
    const accName = accountMap.get(t.akunId) || t.akunId;
    const destName = t.akunTujuanId ? ` ke ${accountMap.get(t.akunTujuanId) || t.akunTujuanId}` : '';
    const prefix = t.tipe === 'PEMASUKAN' ? '+' : t.tipe === 'PENGELUARAN' ? '-' : '⇄ ';
    
    return [
      idx + 1,
      t.tanggal,
      t.tipe,
      t.kategori,
      `${prefix}Rp ${t.nominal.toLocaleString('id-ID')}`,
      `${accName}${destName}`,
      t.keterangan || '-'
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Akun Kas', 'Keterangan']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 28, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 32 },
      4: { cellWidth: 28, fontStyle: 'bold', halign: 'right' },
      5: { cellWidth: 30 },
      6: { cellWidth: 'auto' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (text.startsWith('-')) {
          data.cell.styles.textColor = [244, 63, 94];
        } else {
          data.cell.styles.textColor = [37, 99, 235];
        }
      }
    }
  });

  // Footer & Signature Block
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  if (finalY < 250) {
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan ini dihasilkan secara otomatis oleh UNTUNGIN Apps Standalone PWA.', 14, finalY);
    doc.text('Tervalidasi & terintegrasi dengan Google Spreadsheet Database.', 14, finalY + 4);

    doc.text('Penanggung Jawab Usaha,', 150, finalY);
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${umkm.pemilik} )`, 150, finalY + 20);
  }

  doc.save(`Laporan-Kas-${umkm.namaUsaha.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`);
}
