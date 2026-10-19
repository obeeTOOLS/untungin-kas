import React from 'react';
import { UMKMProfile } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  Building2, 
  Crown, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface NavbarProps {
  activeProfile: UMKMProfile;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenProfileSelect: () => void;
  onOpenUpgradeModal: () => void;
  onOpenChangePinModal: () => void;
  isBackendConnected: boolean;
  isCheckingBackend: boolean;
  onRefreshBackend: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeProfile,
  currentTab,
  onSelectTab,
  onOpenProfileSelect,
  onOpenUpgradeModal,
  onOpenChangePinModal,
  isBackendConnected,
  isCheckingBackend,
  onRefreshBackend,
}) => {
  const isPro = activeProfile.statusLisensi === 'PRO';

  return (
    <header className="sticky top-0 z-40 bg-[#001c3c] text-white border-b border-[#0f3460] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-[#001c3c] text-lg tracking-tighter">U</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-white font-display">UNTUNGIN</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PWA
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 hidden sm:inline">Buku Kas & Keuangan UMKM</span>
              </div>
            </button>
          </div>

          {/* Zone 2: Desktop Navigation Links (Clean single line) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {[
              { id: 'dashboard', label: 'Ringkasan' },
              { id: 'transaksi', label: 'Buku Kas' },
              { id: 'hutang-piutang', label: 'Hutang & Piutang' },
              { id: 'akun', label: 'Akun Kas' },
              { id: 'laporan', label: 'Laporan & Pajak' },
              { id: 'audit', label: 'Log Audit' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  currentTab === item.id
                    ? 'bg-white/15 text-white shadow-inner font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Actions & Active Profile Info */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Backend Connectivity Status Indicator */}
            <button
              onClick={onRefreshBackend}
              disabled={isCheckingBackend}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/25 text-[11px] text-slate-300 hover:text-white border border-white/10 transition"
              title="Status koneksi ke Google Apps Script Web App Engine"
            >
              {isCheckingBackend ? (
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
              ) : isBackendConnected ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="whitespace-nowrap">
                {isCheckingBackend ? 'Mengecek...' : isBackendConnected ? 'GAS Live' : 'Offline'}
              </span>
            </button>

            {/* PWA In-App Install Prompt */}
            <PWAInstallButton />

            {/* License Tier Badge */}
            {isPro ? (
              <button
                onClick={onOpenUpgradeModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-400/40 text-amber-300 text-xs font-bold whitespace-nowrap hover:bg-amber-500/30 transition"
                title="Akun Untungin PRO Aktif"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="hidden sm:inline">UNTUNGIN PRO</span>
                <span className="sm:hidden">PRO</span>
              </button>
            ) : (
              <button
                onClick={onOpenUpgradeModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition whitespace-nowrap"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade PRO</span>
              </button>
            )}

            {/* Active Business Switcher & PIN Quick Lock */}
            <div className="flex items-center rounded-lg bg-white/10 border border-white/15 p-0.5">
              <button
                onClick={onOpenProfileSelect}
                className="flex items-center gap-2 px-2.5 py-1 text-xs text-white hover:bg-white/10 rounded-md transition text-left max-w-[140px] sm:max-w-[200px]"
                title="Klik untuk ganti profil usaha UMKM"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate font-semibold">{activeProfile.namaUsaha}</span>
              </button>
              <button
                onClick={onOpenChangePinModal}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition"
                title="Ubah PIN Kas 6-Digit"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
