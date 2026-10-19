import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share, PlusSquare, Sparkles } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('untungin_pwa_banner_dismissed') === 'true';
      if (dismissed) {
        setIsDismissed(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // If already installed in standalone mode or dismissed by user, hide banner
  if (isInstalled || isDismissed) {
    return null;
  }

  // Show banner if installable OR on mobile / iOS
  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('untungin_pwa_banner_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  const handleActionClick = () => {
    if (isInstallable) {
      install();
    } else {
      // Show iOS / manual install guide
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Floating PWA Install Prompt Banner */}
      <aside
        aria-label="Pasang Aplikasi Untungin"
        className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-40 bg-gradient-to-r from-[#001c3c] to-[#0f3460] text-white p-4 rounded-3xl shadow-2xl border border-amber-400/30 animate-slide-in backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-[#001c3c] flex items-center justify-center font-extrabold text-base shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
              U
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  📲 Pasang Aplikasi Untungin di Layar Utama HP
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500 text-slate-950 uppercase">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Akses cepat instan tanpa repot buka browser, hemat kuota, dan tetap bisa catat kas saat offline.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
            title="Tutup banner"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white transition"
          >
            Nanti Saja
          </button>

          <button
            onClick={handleActionClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition"
          >
            {isInstallable ? (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pasang Sekarang</span>
              </>
            ) : isIOS ? (
              <>
                <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Panduan Pasang iOS</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pasang Sekarang</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* iOS Safari Guided Install Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#001c3c] text-amber-400 font-extrabold flex items-center justify-center text-sm shadow-sm">
                  U
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display">
                    Pasang di iPhone / iPad
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Panduan Tambah ke Layar Utama Safari
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps */}
            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <p className="leading-relaxed">
                  Buka website <strong>Untungin</strong> di peramban bawaan <strong>Safari</strong> pada iPhone/iPad Anda.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <p className="leading-relaxed">
                  Ketuk ikon <strong>Bagikan (Share)</strong> <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] font-bold">⎋</span> di bilah bawah Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <p className="leading-relaxed">
                  Gulir ke bawah pada menu, lalu pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                </p>
              </div>

            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
            >
              Saya Mengerti & Siap Pasang
            </button>

          </div>
        </div>
      )}
    </>
  );
};
