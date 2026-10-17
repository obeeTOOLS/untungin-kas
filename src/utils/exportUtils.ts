import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaksi, UMKMProfile, AkunKas } from '../types';

export function exportTransactionsToCSV(transactions: Transaksi[], accounts: AkunKas[], umkm: UMKMProfile) {
  const accountMap = new Map(accounts.map(a => [a.id, a.nama]));
  
  const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Akun Sumber', 'Akun Tujuan', 'Keterangan'];
  const rows = transactions.map(t => [
    t.id,
    t.tanggal,
    t.tipe,
    `"${t.kategori.replace(/"/g, '""')}"`,
    t.nominal,
    `"${(accountMap.get(t.akunId) || t.akunId).replace(/"/g, '""')}"`,
    `"${(t.akunTujuanId ? accountMap.get(t.akunTujuanId) || t.akunTujuanId : '-').replace(/"/g, '""')}"`,
    `"${(t.keterangan || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
    [`# BUKU KAS: ${umkm.namaUsaha} - Pemilik: ${umkm.pemilik}`, headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Buku_Kas_${umkm.namaUsaha.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTransactionsToPDF(transactions: Transaksi[], accounts: AkunKas[], umkm: UMKMProfile, periodText: string = 'Bulan Ini') {
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

  doc.save(`Laporan_Kas_${umkm.namaUsaha.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
