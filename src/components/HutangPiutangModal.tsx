import React, { useState, useEffect } from 'react';
import { HutangPiutang, TipeHutangPiutang, StatusHutangPiutang } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { X, Calendar, User, Phone, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

interface HutangPiutangModalProps {
  isOpen: boolean;
  onClose: () => void;
  umkmId: string;
  namaUsaha: string;
  editingItem: HutangPiutang | null;
  initialType?: TipeHutangPiutang;
  onSave: (
    data: Omit<HutangPiutang, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => { success: boolean; message?: string };
}

export const HutangPiutangModal: React.FC<HutangPiutangModalProps> = ({
  isOpen,
  onClose,
  umkmId,
  namaUsaha,
  editingItem,
  initialType = 'PIUTANG',
  onSave
}) => {
  const todayStr = getLocalDateString(new Date());

  const [tipe, setTipe] = useState<TipeHutangPiutang>(initialType);
  const [pihakTerkait, setPihakTerkait] = useState('');
  const [kontakWa, setKontakWa] = useState('');
  const [nominal, setNominal] = useState<number>(0);
  const [tanggal, setTanggal] = useState(todayStr);
  const [jatuhTempo, setJatuhTempo] = useState(() => {
    // Default +7 hari ke depan
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return getLocalDateString(d);
  });
  const [status, setStatus] = useState<StatusHutangPiutang>('BELUM_LUNAS');
  const [keterangan, setKeterangan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when modal opens or editingItem changes
  useEffect(() => {
    if (editingItem) {
      setTipe(editingItem.tipe);
      setPihakTerkait(editingItem.pihakTerkait);
      setKontakWa(editingItem.kontakWa || '');
      setNominal(editingItem.nominal);
      setTanggal(editingItem.tanggal);
      setJatuhTempo(editingItem.jatuhTempo);
      setStatus(editingItem.status);
      setKeterangan(editingItem.keterangan || '');
    } else {
      setTipe(initialType);
      setPihakTerkait('');
      setKontakWa('');
      setNominal(0);
      setTanggal(todayStr);
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setJatuhTempo(getLocalDateString(d));
      setStatus('BELUM_LUNAS');
      setKeterangan('');
    }
    setErrorMsg('');
  }, [editingItem, initialType, isOpen, todayStr]);

  if (!isOpen) return null;

  const handleQuickDueDays = (days: number) => {
    const base = tanggal ? new Date(tanggal) : new Date();
    base.setDate(base.getDate() + days);
    setJatuhTempo(getLocalDateString(base));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pihakTerkait.trim()) {
      setErrorMsg('Nama pihak terkait (pelanggan / supplier) wajib diisi.');
      return;
    }
    if (nominal <= 0) {
      setErrorMsg('Nominal harus lebih besar dari 0.');
      return;
    }
    if (!tanggal) {
      setErrorMsg('Tanggal pencatatan wajib diisi.');
      return;
    }
    if (!jatuhTempo) {
      setErrorMsg('Tanggal jatuh tempo wajib diisi.');
      return;
    }

    const res = onSave(
      {
        umkmId,
        namaUsaha,
        tipe,
        pihakTerkait: pihakTerkait.trim(),
        kontakWa: kontakWa.trim(),
        nominal,
        tanggal,
        jatuhTempo,
        status,
        keterangan: keterangan.trim()
      },
      editingItem?.id
    );

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Gagal menyimpan catatan hutang/piutang.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white my-8 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold font-display">
              {editingItem ? 'Edit Catatan Hutang/Piutang' : 'Catat Hutang / Piutang Baru'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tipe === 'PIUTANG' 
                ? 'Catat uang usaha yang masih dibawa pelanggan (Bon Penjualan)'
                : 'Catat kewajiban tagihan belanja usaha ke supplier bahan baku'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* 1. Tipe Selector (Piutang vs Hutang) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipe Transaksi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setTipe('PIUTANG')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                  tipe === 'PIUTANG'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-cyan-600'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Piutang Pelanggan</span>
              </button>

              <button
                type="button"
                onClick={() => setTipe('HUTANG')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                  tipe === 'HUTANG'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Hutang Supplier</span>
              </button>
            </div>
          </div>

          {/* 2. Nama Pihak Terkait */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {tipe === 'PIUTANG' ? 'Nama Pelanggan / Pembeli' : 'Nama Toko / Supplier / Vendor'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder={tipe === 'PIUTANG' ? 'Contoh: Bu Siti / Mas Budi (Kantor Camat)' : 'Contoh: CV Sumber Beras / Toko Plastik Berkah'}
                value={pihakTerkait}
                onChange={e => setPihakTerkait(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 3. Kontak WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor WhatsApp / HP (Opsional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="081234567890 (digunakan untuk fitur tagih via WA)"
                value={kontakWa}
                onChange={e => setKontakWa(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 4. Nominal Uang dengan CurrencyInput (Auto Separator & Terbilang) */}
          <div>
            <CurrencyInput
              label="Nominal Transaksi (Rp)"
              required
              value={nominal}
              onChange={setNominal}
              placeholder="0"
              quickAmounts={[50000, 100000, 250000, 500000, 1000000]}
              showTerbilang={true}
            />
          </div>

          {/* 5. Tanggal Transaksi & Jatuh Tempo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Transaksi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Jatuh Tempo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500" />
                <input
                  type="date"
                  required
                  value={jatuhTempo}
                  onChange={e => setJatuhTempo(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Due Date Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-semibold">Atur Cepat:</span>
            {[
              { label: '+3 Hari', days: 3 },
              { label: '+7 Hari', days: 7 },
              { label: '+14 Hari', days: 14 },
              { label: '+30 Hari (1 Bulan)', days: 30 }
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleQuickDueDays(item.days)}
                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 6. Keterangan / Rincian Barang / Nota */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan / Rincian Nota / Barang
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <textarea
                rows={2}
                placeholder="Rincian nota bon penjualan, nomor faktur, atau catatan tempo..."
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
            >
              {editingItem ? 'Simpan Perubahan' : 'Catat ke Buku'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
