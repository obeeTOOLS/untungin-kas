import React, { useState, useMemo } from 'react';
import { UMKMProfile } from '../types';
import { 
  Building2, 
  Search, 
  Lock, 
  Plus, 
  Crown, 
  ArrowLeft, 
  CheckCircle2, 
  Delete,
  Phone,
  MapPin,
  X
} from 'lucide-react';

import { CurrencyInput } from './CurrencyInput';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UMKMProfile[];
  activeProfile: UMKMProfile;
  onSelectAndUnlockProfile: (profile: UMKMProfile) => void;
  onRegisterProfile: (profileData: Omit<UMKMProfile, 'id' | 'createdAt' | 'statusLisensi' | 'lisensiExpiredAt' | 'durasiPaket'>) => void;
}

type AuthStep = 'SELECT' | 'ENTER_PIN' | 'REGISTER';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  onSelectAndUnlockProfile,
  onRegisterProfile
}) => {
  const [step, setStep] = useState<AuthStep>('SELECT');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [targetProfile, setTargetProfile] = useState<UMKMProfile>(activeProfile);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Register Form State
  const [namaUsaha, setNamaUsaha] = useState('');
  const [pemilik, setPemilik] = useState('');
  const [kategoriUsaha, setKategoriUsaha] = useState('Kuliner & Makanan');
  const [kontak, setKontak] = useState('');
  const [alamat, setAlamat] = useState('');
  const [saldoAwal, setSaldoAwal] = useState<number>(1000000);
  const [regPin, setRegPin] = useState('123456');

  const categories = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach(p => {
      const mainCat = p.kategoriUsaha.split('&')[0].trim();
      set.add(mainCat);
    });
    return Array.from(set);
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchQuery =
        p.namaUsaha.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pemilik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.alamat.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === 'ALL' ||
        p.kategoriUsaha.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchQuery && matchCat;
    });
  }, [profiles, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handlePickProfile = (p: UMKMProfile) => {
    setTargetProfile(p);
    setPin('');
    setPinError('');
    setStep('ENTER_PIN');
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setPinError('');
      if (newPin.length === 6) {
        verifyPinAndProceed(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setPinError('');
  };

  const verifyPinAndProceed = (pinToCheck: string) => {
    if (pinToCheck === targetProfile.pinKas || pinToCheck === '123456') {
      onSelectAndUnlockProfile(targetProfile);
      setStep('SELECT');
      setPin('');
      onClose();
    } else {
      setPinError('PIN kas salah. Silakan coba lagi (Default: 123456)');
    }
  };

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaUsaha.trim() || !pemilik.trim()) return;

    onRegisterProfile({
      namaUsaha: namaUsaha.trim(),
      pemilik: pemilik.trim(),
      kategoriUsaha,
      kontak: kontak.trim() || '0812-0000-0000',
      alamat: alamat.trim() || 'Alamat Usaha',
      saldoAwal: saldoAwal || 0,
      pinKas: regPin.length === 6 ? regPin : '123456'
    });

    onClose();
    setStep('SELECT');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'SELECT' && (
              <button
                onClick={() => setStep('SELECT')}
                className="p-1.5 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {step === 'SELECT' && 'Pilih Profil Usaha UMKM'}
                {step === 'ENTER_PIN' && 'Verifikasi Keamanan PIN Kas'}
                {step === 'REGISTER' && 'Daftar Profil Usaha Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'SELECT' && `${profiles.length} Usaha Terdaftar di Database Untungin`}
                {step === 'ENTER_PIN' && targetProfile.namaUsaha}
                {step === 'REGISTER' && 'Mulai pencatatan kas digital untuk usaha Anda'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: SELECT PROFILE */}
        {step === 'SELECT' && (
          <div className="flex flex-col flex-1 overflow-hidden p-6 gap-4">
            {/* Search & New Profile Action */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama usaha, pemilik, atau kota..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <button
                onClick={() => setStep('REGISTER')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm whitespace-nowrap active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Daftar Baru</span>
              </button>
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Semua ({profiles.length})
              </button>
              {categories.slice(0, 7).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* List of 67 UMKM Profiles */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm font-medium">Usaha tidak ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau daftarkan profil baru.</p>
                </div>
              ) : (
                filteredProfiles.map(p => {
                  const isCurrent = p.id === activeProfile.id;
                  const isPro = p.statusLisensi === 'PRO';

                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePickProfile(p)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isPro
                            ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-sm shadow-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {p.namaUsaha.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold truncate text-slate-900 dark:text-white">
                              {p.namaUsaha}
                            </h4>
                            {isPro ? (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                                <Crown className="w-2.5 h-2.5 fill-amber-500" /> PRO
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                Trial
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="truncate">{p.pemilik}</span>
                            <span>·</span>
                            <span className="truncate">{p.kategoriUsaha}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isCurrent && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                          </span>
                        )}
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* STEP 2: 6-DIGIT PIN ENTRY KEYPAD */}
        {step === 'ENTER_PIN' && (
          <div className="flex flex-col items-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#001c3c] to-[#0f3460] flex items-center justify-center text-amber-400 shadow-xl mb-3">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Masukkan PIN Kas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Verifikasi 6-digit untuk mengakses buku kas <strong>{targetProfile.namaUsaha}</strong>.
            </p>

            {/* PIN Dots Display */}
            <div className="flex items-center gap-3 my-6">
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    pin.length > idx
                      ? 'bg-emerald-600 dark:bg-emerald-400 scale-110 shadow-sm shadow-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs text-rose-500 font-semibold mb-4 animate-shake">
                {pinError}
              </p>
            )}

            {/* Virtual Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => handlePinDigit(num)}
                  className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-lg font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => { setPin(''); setPinError(''); }}
                className="h-14 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
              >
                Reset
              </button>
              <button
                onClick={() => handlePinDigit('0')}
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-lg font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-14 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Hint for demo & quick unlock */}
            <div className="mt-6 flex items-center justify-between w-full max-w-xs text-xs text-slate-400">
              <span>PIN Default: <strong>123456</strong></span>
              <button
                onClick={() => verifyPinAndProceed('123456')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Masuk Cepat
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REGISTER NEW UMKM */}
        {step === 'REGISTER' && (
          <form onSubmit={handleSubmitRegister} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Usaha / Toko *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Kopi Sedap Sejahtera"
                value={namaUsaha}
                onChange={e => setNamaUsaha(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pemilik Usaha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Pemilik"
                  value={pemilik}
                  onChange={e => setPemilik(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Usaha
                </label>
                <select
                  value={kategoriUsaha}
                  onChange={e => setKategoriUsaha(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Kuliner & Makanan">Kuliner & Makanan</option>
                  <option value="Fashion & Pakaian">Fashion & Pakaian</option>
                  <option value="Sembako & Kelontong">Sembako & Kelontong</option>
                  <option value="Jasa & Servis">Jasa & Servis</option>
                  <option value="Kesehatan & Apotek">Kesehatan & Apotek</option>
                  <option value="Pertanian & Peternakan">Pertanian & Peternakan</option>
                  <option value="Kerajinan & Kesenian">Kerajinan & Kesenian</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. WhatsApp / Kontak
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                    value={kontak}
                    onChange={e => setKontak(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <CurrencyInput
                value={saldoAwal}
                onChange={setSaldoAwal}
                label="Saldo Kas Awal (Rp)"
                placeholder="0"
                quickAmounts={[500000, 1000000, 2000000, 5000000]}
                showTerbilang={true}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat / Kota Usaha
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Jl. Merdeka No. 1, Kota..."
                  value={alamat}
                  onChange={e => setAlamat(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Buat PIN Kas 6-Digit
              </label>
              <input
                type="password"
                maxLength={6}
                value={regPin}
                onChange={e => setRegPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs tracking-widest text-center font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1 text-center">
                PIN digunakan setiap kali membuka buku kas usaha Anda.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 active:scale-98"
              >
                Simpan & Masuk ke Buku Kas
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
