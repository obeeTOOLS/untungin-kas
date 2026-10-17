import React, { useState } from 'react';
import { AkunKas, TipeAkun } from '../types';
import { Wallet, Plus, ArrowLeftRight, Landmark, QrCode, Banknote, X, Check } from 'lucide-react';

interface AkunViewProps {
  accounts: AkunKas[];
  onAddAccount: (acc: Omit<AkunKas, 'id'>) => void;
  onOpenTransfer: () => void;
}

export const AkunView: React.FC<AkunViewProps> = ({
  accounts,
  onAddAccount,
  onOpenTransfer
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<TipeAkun>('BANK');
  const [nomorRekening, setNomorRekening] = useState('');
  const [atasNama, setAtasNama] = useState('');
  const [saldo, setSaldo] = useState('0');

  const totalSaldo = accounts.reduce((acc, a) => acc + a.saldo, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    onAddAccount({
      umkmId: 'all',
      nama: nama.trim(),
      tipe,
      nomorRekening: nomorRekening.trim(),
      atasNama: atasNama.trim(),
      saldo: Number(saldo) || 0,
      warna: tipe === 'BANK' ? '#0066b2' : tipe === 'QRIS' ? '#f59e0b' : '#10b981'
    });

    setShowAddModal(false);
    setNama('');
    setNomorRekening('');
    setAtasNama('');
    setSaldo('0');
  };

  const getAccountIcon = (tipe: TipeAkun) => {
    switch (tipe) {
      case 'BANK': return <Landmark className="w-5 h-5 text-blue-500" />;
      case 'QRIS': return <QrCode className="w-5 h-5 text-amber-500" />;
      case 'EWALLET': return <Wallet className="w-5 h-5 text-purple-500" />;
      default: return <Banknote className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            Rekening Kas & Dompet Digital
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola kas fisik toko, rekening bank operasional, dan saldo QRIS merchant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-500" />
            <span>Transfer Kas</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rekening</span>
          </button>
        </div>
      </div>

      {/* Total Liquidity Banner */}
      <div className="p-6 rounded-3xl bg-[#001c3c] text-white shadow-lg border border-[#0f3460] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Total Likuiditas Kas</span>
          <div className="text-3xl font-extrabold tabular-nums tracking-tight font-display mt-1 text-white">
            Rp {totalSaldo.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-emerald-400 mt-1">
            Tersebar di {accounts.length} rekening aktif
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/10 p-3 rounded-2xl">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Setiap mutasi otomatis memperbarui saldo buku kas secara real-time.</span>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div
            key={acc.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                  {getAccountIcon(acc.tipe)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {acc.nama}
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {acc.tipe}
                  </span>
                </div>
              </div>
            </div>

            <div className="my-4">
              <span className="text-xs text-slate-400 block mb-0.5">Saldo Tersedia:</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight font-display">
                Rp {acc.saldo.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="truncate">{acc.nomorRekening || 'Kas Fisik Toko'}</span>
              <span>{acc.atasNama || 'Usaha'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm">Tambah Akun / Rekening Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Akun / Bank *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bank Mandiri Operasional"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Akun
                </label>
                <select
                  value={tipe}
                  onChange={e => setTipe(e.target.value as TipeAkun)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="BANK">Rekening Bank</option>
                  <option value="TUNAI">Kas Fisik / Tunai</option>
                  <option value="QRIS">QRIS / Merchant</option>
                  <option value="EWALLET">E-Wallet (OVO/Dana/ShopeePay)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Rekening / ID Merchant
                </label>
                <input
                  type="text"
                  placeholder="Nomor rekening (opsional)"
                  value={nomorRekening}
                  onChange={e => setNomorRekening(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={saldo}
                  onChange={e => setSaldo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm"
              >
                Simpan Akun
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
