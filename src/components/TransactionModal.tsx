import React, { useState, useEffect } from 'react';
import { Transaksi, TipeTransaksi, AkunKas } from '../types';
import { DEFAULT_CATEGORIES } from '../data/seedData';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Calendar, Wallet } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  umkmId: string;
  accounts: AkunKas[];
  editingTransaction?: Transaksi | null;
  onSave: (data: Omit<Transaksi, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => { success: boolean; message?: string };
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  umkmId,
  accounts,
  editingTransaction,
  onSave
}) => {
  const [tipe, setTipe] = useState<TipeTransaksi>('PEMASUKAN');
  const [nominal, setNominal] = useState('');
  const [kategori, setKategori] = useState('');
  const [akunId, setAkunId] = useState('');
  const [akunTujuanId, setAkunTujuanId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [customKategori, setCustomKategori] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setTipe(editingTransaction.tipe);
      setNominal(editingTransaction.nominal.toString());
      setKategori(editingTransaction.kategori);
      setAkunId(editingTransaction.akunId);
      setAkunTujuanId(editingTransaction.akunTujuanId || '');
      setTanggal(editingTransaction.tanggal);
      setKeterangan(editingTransaction.keterangan);
      setIsCustom(false);
    } else {
      setTipe('PEMASUKAN');
      setNominal('');
      setKategori(DEFAULT_CATEGORIES.pemasukan[0]);
      setAkunId(accounts[0]?.id || 'akun-tunai');
      setAkunTujuanId(accounts[1]?.id || '');
      setTanggal(new Date().toISOString().split('T')[0]);
      setKeterangan('');
      setIsCustom(false);
      setCustomKategori('');
    }
    setError('');
  }, [editingTransaction, isOpen, accounts]);

  // When type changes, adjust default category
  const handleTypeChange = (newTipe: TipeTransaksi) => {
    setTipe(newTipe);
    setIsCustom(false);
    if (newTipe === 'PEMASUKAN') {
      setKategori(DEFAULT_CATEGORIES.pemasukan[0]);
    } else if (newTipe === 'PENGELUARAN') {
      setKategori(DEFAULT_CATEGORIES.pengeluaran[0]);
    } else {
      setKategori('Transfer Kas');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(nominal);
    if (!num || num <= 0) {
      setError('Nominal harus lebih dari 0.');
      return;
    }

    const finalKategori = isCustom && customKategori.trim() ? customKategori.trim() : kategori;

    if (tipe === 'TRANSFER' && akunId === akunTujuanId) {
      setError('Akun sumber dan akun tujuan tidak boleh sama.');
      return;
    }

    const res = onSave(
      {
        umkmId,
        tipe,
        nominal: num,
        kategori: finalKategori,
        akunId,
        akunTujuanId: tipe === 'TRANSFER' ? akunTujuanId : undefined,
        tanggal,
        keterangan: keterangan.trim() || `${tipe} ${finalKategori}`
      },
      editingTransaction ? editingTransaction.id : undefined
    );

    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Gagal menyimpan transaksi.');
    }
  };

  const quickAmounts = [50000, 100000, 250000, 500000, 1000000];

  const currentCategories = tipe === 'PEMASUKAN' ? DEFAULT_CATEGORIES.pemasukan : DEFAULT_CATEGORIES.pengeluaran;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-white flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {editingTransaction ? 'Edit Transaksi (Smart Update)' : 'Catat Transaksi Buku Kas'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Tipe Transaksi Segmented Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('PEMASUKAN')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tipe === 'PEMASUKAN'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('PENGELUARAN')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tipe === 'PENGELUARAN'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Keluar</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('TRANSFER')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tipe === 'TRANSFER'
                  ? 'bg-[#001c3c] text-amber-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Nominal Input with Big Touch Format */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nominal Transaksi (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                Rp
              </span>
              <input
                type="number"
                min="1"
                step="1000"
                required
                autoFocus
                placeholder="0"
                value={nominal}
                onChange={e => setNominal(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setNominal(amt.toString())}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 tabular-nums transition"
                >
                  +{amt.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
          </div>

          {/* Tanggal & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {tipe !== 'TRANSFER' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori
                </label>
                <select
                  value={isCustom ? 'CUSTOM' : kategori}
                  onChange={e => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustom(true);
                    } else {
                      setIsCustom(false);
                      setKategori(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {currentCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="CUSTOM">+ Kategori Kustom...</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  disabled
                  value="Transfer Antar-Akun Kas"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500"
                />
              </div>
            )}
          </div>

          {/* Custom Category Input */}
          {isCustom && tipe !== 'TRANSFER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tulis Nama Kategori Kustom
              </label>
              <input
                type="text"
                placeholder="Contoh: Titipan Konsinyasi, Kas Bon, dll"
                value={customKategori}
                onChange={e => setCustomKategori(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Account Selection */}
          {tipe !== 'TRANSFER' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {tipe === 'PEMASUKAN' ? 'Masuk ke Rekening / Kas' : 'Dibayar dari Rekening / Kas'}
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={akunId}
                  onChange={e => setAkunId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.nama} (Saldo: Rp {acc.saldo.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dari Akun Sumber
                </label>
                <select
                  value={akunId}
                  onChange={e => setAkunId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ke Akun Tujuan
                </label>
                <select
                  value={akunTujuanId}
                  onChange={e => setAkunTujuanId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Keterangan / Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan / Catatan Transaksi
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan (opsional)..."
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-bold text-xs text-white shadow-lg transition-all active:scale-98 ${
                tipe === 'PEMASUKAN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : tipe === 'PENGELUARAN'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-[#001c3c] hover:bg-[#092c57] text-amber-300 shadow-slate-900/30'
              }`}
            >
              {editingTransaction ? 'Simpan Perubahan (Smart Update)' : `Catat ${tipe}`}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
