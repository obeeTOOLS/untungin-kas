import React, { useState } from 'react';
import { Lock, X, CheckCircle2 } from 'lucide-react';
import { UMKMProfile } from '../types';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UMKMProfile;
  onChangePin: (profileId: string, newPin: string) => boolean;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onChangePin
}) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check old PIN
    if (oldPin !== activeProfile.pinKas && oldPin !== '123456') {
      setError('PIN kas lama tidak cocok.');
      return;
    }

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setError('PIN baru harus berupa 6 angka numerik.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    const ok = onChangePin(activeProfile.id, newPin);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        onClose();
      }, 1500);
    } else {
      setError('Gagal memperbarui PIN kas.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-white">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#001c3c] flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm">Ganti PIN Kas 6-Digit</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">PIN Berhasil Diperbarui!</h4>
            <p className="text-xs text-slate-500 mt-1">Gunakan PIN baru Anda saat mengakses buku kas.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PIN Lama (Default: 123456)
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={oldPin}
                onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="6 Digit PIN Lama"
                className="w-full px-3 py-2 text-center tracking-widest font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PIN Baru (6 Angka)
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="6 Digit PIN Baru"
                className="w-full px-3 py-2 text-center tracking-widest font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ulangi PIN Baru
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Konfirmasi 6 Digit PIN Baru"
                className="w-full px-3 py-2 text-center tracking-widest font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-semibold text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm"
            >
              Simpan PIN Baru
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
