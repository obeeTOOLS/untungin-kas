import React, { useState, useMemo } from 'react';
import { Transaksi, UMKMProfile, AkunKas, TipeTransaksi } from '../types';
import { 
  Search, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  FileDown, 
  Filter, 
  Calendar,
  Share2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  CalendarDays,
  X
} from 'lucide-react';
import { exportTransactionsToCSV, exportTransactionsToPDF } from '../utils/exportUtils';
import { getLocalDateString, getPeriodRange } from '../utils/dateUtils';

interface TransaksiViewProps {
  activeProfile: UMKMProfile;
  transactions: Transaksi[];
  accounts: AkunKas[];
  onOpenAddTrx: () => void;
  onEditTrx: (trx: Transaksi) => void;
  onDeleteTrx: (id: string) => void;
}

type DatePeriodType = 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL' | 'CUSTOM';

export const TransaksiView: React.FC<TransaksiViewProps> = ({
  activeProfile,
  transactions,
  accounts,
  onOpenAddTrx,
  onEditTrx,
  onDeleteTrx
}) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TipeTransaksi>('ALL');
  const [dateFilter, setDateFilter] = useState<DatePeriodType>('THIS_MONTH');

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const firstOfMonthStr = useMemo(() => {
    const d = new Date();
    return getLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1));
  }, []);

  const [customStartDate, setCustomStartDate] = useState<string>(firstOfMonthStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const accountMap = useMemo(() => {
    return new Map(accounts.map(a => [a.id, a]));
  }, [accounts]);

  // Compute active date period range and human label
  const activePeriod = useMemo(() => {
    return getPeriodRange(dateFilter, customStartDate, customEndDate);
  }, [dateFilter, customStartDate, customEndDate]);

  // Filter transactions based on date range, type, and search query
  const filteredTrx = useMemo(() => {
    return transactions.filter(t => {
      // 1. Date Range Filter
      if (dateFilter !== 'ALL') {
        if (activePeriod.startDate && t.tanggal < activePeriod.startDate) return false;
        if (activePeriod.endDate && t.tanggal > activePeriod.endDate) return false;
      }

      // 2. Type Filter
      if (typeFilter !== 'ALL' && t.tipe !== typeFilter) return false;

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNote = t.keterangan?.toLowerCase().includes(q);
        const matchCategory = t.kategori?.toLowerCase().includes(q);
        const matchNominal = t.nominal.toString().includes(q);
        const account = accountMap.get(t.akunId);
        const matchAccount = account?.nama?.toLowerCase().includes(q);
        if (!matchNote && !matchCategory && !matchNominal && !matchAccount) return false;
      }

      return true;
    });
  }, [transactions, dateFilter, activePeriod, typeFilter, searchQuery, accountMap]);

  // Fast financial aggregations
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let transferCount = 0;

    filteredTrx.forEach(t => {
      if (t.tipe === 'PEMASUKAN') {
        totalIncome += t.nominal;
        incomeCount++;
      } else if (t.tipe === 'PENGELUARAN') {
        totalExpense += t.nominal;
        expenseCount++;
      } else if (t.tipe === 'TRANSFER') {
        transferCount++;
      }
    });

    const netCash = totalIncome - totalExpense;
    const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      netCash,
      incomeCount,
      expenseCount,
      transferCount,
      expenseRatio,
      totalCount: filteredTrx.length
    };
  }, [filteredTrx]);

  // WhatsApp Message Formatter
  const waShareUrl = useMemo(() => {
    const sign = summary.netCash >= 0 ? '+Rp ' : '-Rp ';
    const netFormatted = `${sign}${Math.abs(summary.netCash).toLocaleString('id-ID')}`;
    
    let ratioDesc = '-';
    if (summary.totalIncome > 0) {
      ratioDesc = `${summary.expenseRatio}% dari total omzet`;
    } else if (summary.totalExpense > 0) {
      ratioDesc = 'Pengeluaran tanpa omzet masuk';
    } else {
      ratioDesc = '0% beban';
    }

    const message = 
`━━━━━━━━━━━━━━━━━━━━━━
📊 *REKAP BUKU KAS: ${activeProfile.namaUsaha.toUpperCase()}*
👤 Pemilik: ${activeProfile.pemilik}
🗓️ Periode: ${activePeriod.label}
━━━━━━━━━━━━━━━━━━━━━━
🟢 Pemasukan: Rp ${summary.totalIncome.toLocaleString('id-ID')} (${summary.incomeCount} transaksi)
🔴 Pengeluaran: Rp ${summary.totalExpense.toLocaleString('id-ID')} (${summary.expenseCount} transaksi)
💰 Kas Bersih: ${netFormatted}
📈 Rasio Beban: ${ratioDesc}
━━━━━━━━━━━━━━━━━━━━━━
_Dicatat mandiri via Untungin Standalone PWA_`;

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }, [activeProfile, activePeriod, summary]);

  const handleDelete = (id: string) => {
    onDeleteTrx(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            Buku Kas & Riwayat Transaksi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pencatatan mutasi kas, pengeluaran operasional, dan transfer antar-rekening {activeProfile.namaUsaha}.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* WhatsApp Share Button */}
          <a
            href={waShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition"
            title="Bagikan ringkasan buku kas periode aktif ke WhatsApp"
          >
            {/* WhatsApp crisp official SVG */}
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.12-.519-1.815-.751-2.986-2.59-3.076-2.711-.091-.121-.734-.977-.734-1.867 0-.89.465-1.328.63-1.509.166-.182.364-.228.485-.228.122 0 .243.002.348.006.111.005.26-.042.406.309.152.364.516 1.258.561 1.35.045.091.076.197.015.318-.061.121-.091.197-.182.303-.091.107-.191.239-.273.321-.092.091-.188.191-.081.374.106.182.472.779 1.014 1.261.697.621 1.285.813 1.467.904.182.091.288.076.394-.045.106-.121.455-.53.576-.712.121-.182.242-.152.406-.091.164.061 1.042.491 1.22.58.178.089.297.133.342.209.045.076.045.441-.099.846zm-3.397-12.416c-5.523 0-10 4.477-10 10 0 1.782.469 3.456 1.288 4.908l-1.368 5 5.148-1.35c1.402.77 2.998 1.207 4.701 1.207 5.523 0 10-4.477 10-10 0-5.522-4.477-10-9.769-10z"/>
            </svg>
            <span>Kirim WA</span>
          </a>

          {/* Export CSV / Excel */}
          <button
            onClick={() => exportTransactionsToCSV(filteredTrx, accounts, activeProfile)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            title="Ekspor daftar kas periode ini ke format CSV / Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">CSV / Excel</span>
          </button>

          {/* Export PDF Report */}
          <button
            onClick={() => exportTransactionsToPDF(filteredTrx, accounts, activeProfile, activePeriod.label)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            title="Cetak Laporan PDF Resmi untuk periode terpilih"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF Laporan</span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={onOpenAddTrx}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Kas</span>
          </button>
        </div>
      </div>

      {/* 2. Kartu Ringkasan Finansial Dinamis (Dynamic Financial Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Total Pemasukan (Emerald) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Pemasukan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight font-display">
              Rp {summary.totalIncome.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span>{summary.incomeCount} Transaksi Masuk</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Arus Kas Masuk</span>
          </div>
        </div>

        {/* Card 2: Total Pengeluaran (Rose) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight font-display">
              Rp {summary.totalExpense.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span>{summary.expenseCount} Transaksi Keluar</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">Biaya & Beban</span>
          </div>
        </div>

        {/* Card 3: Arus Kas Bersih / Laba Kas (Biru / Navy / Indigo) */}
        <div className="p-5 rounded-3xl bg-[#001c3c] text-white shadow-md border border-[#0f3460] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Arus Kas Bersih (Net Cash)</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight font-display ${
              summary.netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {summary.netCash >= 0 ? '+' : '-'}Rp {Math.abs(summary.netCash).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 border-t border-white/10 pt-2.5">
            <span className="flex items-center gap-1">
              <PieChart className="w-3.5 h-3.5 text-amber-400" />
              {summary.totalIncome > 0
                ? `Beban: ${summary.expenseRatio}% dari total omzet`
                : summary.totalExpense > 0
                ? 'Pengeluaran tanpa omzet'
                : 'Belum ada mutasi'}
            </span>
            <span className="text-amber-300 font-medium">Laba Kas</span>
          </div>
        </div>

      </div>

      {/* 3. Filter Rentang Waktu (Date Range Filter Toolbar) & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Fast Date Period Tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>Periode Buku Kas:</span>
            </label>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {activePeriod.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'TODAY', label: 'Hari Ini' },
              { id: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
              { id: 'THIS_MONTH', label: 'Bulan Ini' },
              { id: 'ALL', label: 'Semua Waktu' },
              { id: 'CUSTOM', label: 'Kustom Rentang Tanggal...' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id as DatePeriodType)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap active:scale-95 ${
                  dateFilter === tab.id
                    ? 'bg-[#001c3c] text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker (Only shown when CUSTOM is chosen) */}
        {dateFilter === 'CUSTOM' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-fade-in flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <span className="hidden sm:inline text-slate-400 font-bold mt-4">s/d</span>

            <div className="flex-1 w-full">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="w-full sm:w-auto mt-auto pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => setDateFilter('THIS_MONTH')}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Reset ke Bulan Ini
              </button>
            </div>
          </div>
        )}

        {/* Search Bar & Transaction Type Filter */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari keterangan, kategori, rekening kas, atau nominal..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Type Segmented Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  typeFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua Tipe ({summary.totalCount})
              </button>
              <button
                onClick={() => setTypeFilter('PEMASUKAN')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  typeFilter === 'PEMASUKAN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                Pemasukan ({summary.incomeCount})
              </button>
              <button
                onClick={() => setTypeFilter('PENGELUARAN')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  typeFilter === 'PENGELUARAN'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                Pengeluaran ({summary.expenseCount})
              </button>
              <button
                onClick={() => setTypeFilter('TRANSFER')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  typeFilter === 'TRANSFER'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                Transfer Kas ({summary.transferCount})
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Menampilkan {filteredTrx.length} dari {transactions.length} transaksi
            </span>
          </div>
        </div>

      </div>

      {/* 4. Transactions List Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredTrx.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Filter className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-medium">Tidak ada transaksi pada periode ini</p>
            <p className="text-xs text-slate-400 mt-1">
              Coba pilih rentang waktu lain atau klik "Tambah Transaksi" untuk mencatat mutasi baru.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTrx.map(trx => {
              const isIncome = trx.tipe === 'PEMASUKAN';
              const isTransfer = trx.tipe === 'TRANSFER';
              const account = accountMap.get(trx.akunId);
              const destAccount = trx.akunTujuanId ? accountMap.get(trx.akunTujuanId) : null;

              return (
                <div
                  key={trx.id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Badge Icon */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : isTransfer
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                    }`}>
                      {isIncome ? (
                        <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {trx.keterangan || trx.kategori}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
                          #{trx.id.slice(-6)}
                        </span>
                      </div>

                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{trx.tanggal}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{trx.kategori}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">
                          {isTransfer && destAccount
                            ? `${account?.nama || 'Kas'} → ${destAccount.nama}`
                            : account?.nama || 'Kas Utama'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right">
                      <span className={`text-sm sm:text-base font-extrabold tabular-nums tracking-tight font-display ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isTransfer
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}Rp {trx.nominal.toLocaleString('id-ID')}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                        {trx.tipe}
                      </p>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTrx(trx)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Smart Update (Edit Transaksi)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(trx.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Smart Delete (Hapus Transaksi)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Transaksi Ini?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Transaksi ini akan dihapus dari buku kas lokal dan disinkronkan via Smart Delete ke backend database Google Apps Script. Saldo akun kas akan disesuaikan kembali.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
              >
                Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
