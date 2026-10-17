import React, { useState } from 'react';
import { Crown, Check, X, Sparkles, Tag, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UMKMProfile } from '../types';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UMKMProfile;
  onUpgradeWithVoucher: (code: string) => { success: boolean; message: string; expiredAt?: string };
}

export const ProModal: React.FC<ProModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onUpgradeWithVoucher
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  if (!isOpen) return null;

  const isPro = activeProfile.statusLisensi === 'PRO';

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    const res = onUpgradeWithVoucher(voucherCode);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // confetti fallback
      }
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleApplyPreset = (code: string) => {
    setVoucherCode(code);
    setFeedback(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-white">
        
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-[#001c3c] via-[#092c57] to-[#00142d] text-white p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 fill-amber-400" /> Untungin PRO
            </span>
            {isPro && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                Status: Aktif ({activeProfile.durasiPaket})
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-display">
            Buku Kas Tanpa Batas untuk UMKM Juara
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Tingkatkan omset & kendalikan arus kas bisnis dengan pencatatan unlimited, multi-rekening, kalkulasi pajak, dan ekspor laporan PDF resmi.
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Plan Comparison Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Trial Box */}
            <div className={`p-4 rounded-2xl border ${!isPro ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 dark:border-slate-800'} text-xs space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">Untungin Basic (Trial)</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Gratis</span>
              </div>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Maksimal 10 Transaksi
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Pencatatan Pemasukan & Pengeluaran
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  1 Akun Kas Utama
                </li>
                <li className="flex items-center gap-2 text-slate-400 line-through">
                  Ekspor Laporan PDF Lengkap
                </li>
              </ul>
            </div>

            {/* PRO Box */}
            <div className="p-4 rounded-2xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 text-xs space-y-3 shadow-md shadow-amber-500/5">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/60">
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 fill-amber-500 text-amber-500" /> Untungin PRO
                </span>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded">
                  UNLIMITED
                </span>
              </div>
              <ul className="space-y-2 text-slate-700 dark:text-slate-200 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <strong>Transaksi Unlimited (Tanpa Batas)</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Multi-Rekening Kas & QRIS / E-Wallet
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Hitung Otomatis Pajak Final UMKM 0,5%
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Cetak PDF Resmi + Ekspor Excel & CSV
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Smart Sync ke Google Apps Script Database
                </li>
              </ul>
            </div>

          </div>

          {/* Voucher Activation Section */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Aktivasi dengan Kode Voucher
              </h3>
            </div>

            <form onSubmit={handleRedeem} className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan kode voucher (contoh: PRO1THN)"
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-semibold tracking-wider uppercase focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Aktivasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {feedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {feedback.type === 'success' ? (
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <X className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Quick Test Voucher Codes from Database */}
            <div className="pt-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                Pilih voucher aktif dari database:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { code: 'PRO1THN', label: '1 Tahun PRO' },
                  { code: 'PROLIFETIME', label: 'Lifetime' },
                  { code: 'PRO6BLN', label: '6 Bulan' },
                  { code: 'UNTUNGIN2026', label: 'Promo 2026' }
                ].map(v => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => handleApplyPreset(v.code)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:border-amber-400 transition"
                  >
                    {v.code} ({v.label})
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Garansi Data Kas Terenkripsi
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> Aktivasi Instan Real-time
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
