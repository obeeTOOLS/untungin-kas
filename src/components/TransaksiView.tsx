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
  SlidersHorizontal,
  Calendar,
  Wallet
} from 'lucide-react';
import { exportTransactionsToCSV, exportTransactionsToPDF } from '../utils/exportUtils';

interface TransaksiViewProps {
  activeProfile: UMKMProfile;
  transactions: Transaksi[];
  accounts: AkunKas[];
  onOpenAddTrx: () => void;
  onEditTrx: (trx: Transaksi) => void;
  onDeleteTrx: (id: string) => void;
}

export const TransaksiView: React.FC<TransaksiViewProps> = ({
  activeProfile,
  transactions,
  accounts,
  onOpenAddTrx,
  onEditTrx,
  onDeleteTrx
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TipeTransaksi>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const accountMap = useMemo(() => {
    return new Map(accounts.map(a => [a.id, a]));
  }, [accounts]);

  // Extract available months from transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.tanggal) {
        set.add(t.tanggal.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Filtered transactions
  const filteredTrx = useMemo(() => {
    return transactions.filter(t => {
      const matchQuery =
        t.keterangan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.nominal.toString().includes(searchQuery);

      const matchType = typeFilter === 'ALL' || t.tipe === typeFilter;
      const matchMonth = selectedMonth === 'ALL' || t.tanggal.startsWith(selectedMonth);

      return matchQuery && matchType && matchMonth;
    });
  }, [transactions, searchQuery, typeFilter, selectedMonth]);

  // Totals for filtered list
  const summary = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;
    filteredTrx.forEach(t => {
      if (t.tipe === 'PEMASUKAN') inTotal += t.nominal;
      else if (t.tipe === 'PENGELUARAN') outTotal += t.nominal;
    });
    return {
      inTotal,
      outTotal,
      diff: inTotal - outTotal,
      count: filteredTrx.length
    };
  }, [filteredTrx]);

  const handleDelete = (id: string) => {
    onDeleteTrx(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      
      {/* Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            Buku Kas & Riwayat Transaksi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pencatatan mutasi kas, pengeluaran operasional, dan transfer antar-rekening.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportTransactionsToCSV(filteredTrx, accounts, activeProfile)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            title="Ekspor ke Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">CSV / Excel</span>
          </button>

          <button
            onClick={() => exportTransactionsToPDF(filteredTrx, accounts, activeProfile, selectedMonth === 'ALL' ? 'Semua Periode' : selectedMonth)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            title="Cetak Laporan PDF Resmi"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF Laporan</span>
          </button>

          <button
            onClick={onOpenAddTrx}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan, kategori, atau nominal..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full sm:w-44 pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Bulan</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Type Segmented Tabs */}
        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                typeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({transactions.length})
            </button>
            <button
              onClick={() => setTypeFilter('PEMASUKAN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                typeFilter === 'PEMASUKAN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setTypeFilter('PENGELUARAN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                typeFilter === 'PENGELUARAN'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setTypeFilter('TRANSFER')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                typeFilter === 'TRANSFER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              Transfer Kas
            </button>
          </div>

          {/* Quick Metrics of filtered view */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Masuk: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">Rp {summary.inTotal.toLocaleString('id-ID')}</strong></span>
            <span>Keluar: <strong className="text-rose-600 dark:text-rose-400 tabular-nums">Rp {summary.outTotal.toLocaleString('id-ID')}</strong></span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredTrx.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Filter className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-medium">Tidak ada transaksi yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter atau tambahkan transaksi baru.</p>
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
                      {isIncome ? <ArrowDownRight className="w-5 h-5 stroke-[2.5]" /> : isTransfer ? <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {trx.keterangan || trx.kategori}
                        </h4>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
