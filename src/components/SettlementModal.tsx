import React, { useState } from 'react';
import { HutangPiutang, AkunKas } from '../types';
import { CheckCircle2, X, Wallet, ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtItem: HutangPiutang | null;
  accounts: AkunKas[];
  onConfirmSettlement: (debtId: string, recordToCashbook: boolean, akunId: string) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  debtItem,
  accounts,
  onConfirmSettlement
}) => {
  const [recordToCashbook, setRecordToCashbook] = useState<boolean>(true);
  const defaultAccId = accounts.find(a => a.isDefault)?.id || accounts[0]?.id || 'akun-tunai';
  const [selectedAkunId, setSelectedAkunId] = useState<string>(defaultAccId);

  if (!isOpen || !debtItem) return null;

  const isPiutang = debtItem.tipe === 'PIUTANG';

  const handleConfirm = () => {
    onConfirmSettlement(debtItem.id, recordToCashbook, selectedAkunId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isPiutang 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">
                Pelunasan {isPiutang ? 'Piutang Pelanggan' : 'Hutang Supplier'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Konfirmasi pelunasan smart settlement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Card Info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{isPiutang ? 'Nama Pelanggan / Pembeli:' : 'Nama Supplier / Vendor:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{debtItem.pihakTerkait}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Nominal Diselesaikan:</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums font-display">
                Rp {debtItem.nominal.toLocaleString('id-ID')}
              </span>
            </div>

            {debtItem.keterangan && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Rincian:</span> {debtItem.keterangan}
              </div>
            )}
          </div>

          {/* Option: Catat Otomatis ke Buku Kas */}
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recordToCashbook}
                onChange={e => setRecordToCashbook(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Catat otomatis ke Buku Kas sebagai {isPiutang ? 'Pemasukan Kas' : 'Pengeluaran Kas'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5 leading-relaxed">
                  {isPiutang 
                    ? 'Uang diterima dari pelanggan akan otomatis menambah saldo kas terpilih.'
                    : 'Uang pembayaran ke supplier akan otomatis mengurangi saldo kas terpilih.'}
                </span>
              </div>
            </label>

            {/* Pilihan Akun Kas */}
            {recordToCashbook && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-1.5 animate-fade-in">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {isPiutang ? 'Masuk ke Rekening / Akun Kas:' : 'Keluar dari Rekening / Akun Kas:'}
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedAkunId}
                    onChange={e => setSelectedAkunId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.nama} (Saldo: Rp {acc.saldo.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            ✅ Tandai Lunas
          </button>
        </div>

      </div>
    </div>
  );
};
