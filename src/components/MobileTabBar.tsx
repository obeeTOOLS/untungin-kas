import React from 'react';
import { LayoutDashboard, BookOpen, Plus, ReceiptText, Wallet } from 'lucide-react';

interface MobileTabBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddTrx: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTrx
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#001c3c]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#0f3460] md:hidden pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
        
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-medium tracking-tight">Ringkasan</span>
        </button>

        {/* Tab 2: Buku Kas */}
        <button
          onClick={() => onSelectTab('transaksi')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'transaksi'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${currentTab === 'transaksi' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-medium tracking-tight">Buku Kas</span>
        </button>

        {/* Center Quick Action: Tambah Transaksi */}
        <div className="flex items-center justify-center -mt-5">
          <button
            onClick={onOpenAddTrx}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
            aria-label="Tambah Transaksi Baru"
            title="Tambah Transaksi Baru"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Hutang & Piutang */}
        <button
          onClick={() => onSelectTab('hutang-piutang')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'hutang-piutang'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ReceiptText className={`w-5 h-5 ${currentTab === 'hutang-piutang' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-medium tracking-tight">Hutang</span>
        </button>

        {/* Tab 4: Akun Kas */}
        <button
          onClick={() => onSelectTab('akun')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'akun'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wallet className={`w-5 h-5 ${currentTab === 'akun' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-medium tracking-tight">Akun Kas</span>
        </button>

      </div>
    </nav>
  );
};
