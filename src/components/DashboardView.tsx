import React, { useState, useMemo } from 'react';
import { UMKMProfile, Transaksi, AkunKas, HutangPiutang } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  Calculator, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight,
  Eye, 
  EyeOff, 
  Info,
  Calendar,
  ReceiptText,
  AlertTriangle,
  ArrowDownLeft
} from 'lucide-react';

interface DashboardViewProps {
  activeProfile: UMKMProfile;
  transactions: Transaksi[];
  accounts: AkunKas[];
  debts?: HutangPiutang[];
  onOpenAddTrx: (initialType?: 'PEMASUKAN' | 'PENGELUARAN' | 'TRANSFER') => void;
  onNavigateToCashbook: () => void;
  onNavigateToDebts?: () => void;
  onOpenUpgradeModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeProfile,
  transactions,
  accounts,
  debts = [],
  onOpenAddTrx,
  onNavigateToCashbook,
  onNavigateToDebts,
  onOpenUpgradeModal
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'MONTH' | 'ALL'>('MONTH');

  // Filter transactions
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }, []);

  const filteredTrx = useMemo(() => {
    if (timeFilter === 'ALL') return transactions;
    return transactions.filter(t => t.tanggal.startsWith(currentMonthStr));
  }, [transactions, timeFilter, currentMonthStr]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let pemasukan = 0;
    let pengeluaran = 0;

    filteredTrx.forEach(t => {
      if (t.tipe === 'PEMASUKAN') pemasukan += t.nominal;
      else if (t.tipe === 'PENGELUARAN') pengeluaran += t.nominal;
    });

    const totalSaldo = accounts.reduce((sum, a) => sum + a.saldo, 0);
    const labaBersih = pemasukan - pengeluaran;

    // Estimasi Pajak PP 55/PP 23 (0.5% dari Pemasukan/Omset)
    const estimasiPajak = Math.round(pemasukan * 0.005);

    return {
      totalSaldo,
      pemasukan,
      pengeluaran,
      labaBersih,
      estimasiPajak,
      count: filteredTrx.length
    };
  }, [filteredTrx, accounts]);

  // Category breakdown for expenses
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTrx
      .filter(t => t.tipe === 'PENGELUARAN')
      .forEach(t => {
        map[t.kategori] = (map[t.kategori] || 0) + t.nominal;
      });

    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const totalExp = metrics.pengeluaran || 1;

    return entries.map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: Math.round((amount / totalExp) * 100)
    }));
  }, [filteredTrx, metrics.pengeluaran]);

  const isPro = activeProfile.statusLisensi === 'PRO';
  const trialTrxCount = transactions.length;

  const debtStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let totalPiutang = 0;
    let totalHutang = 0;
    let overdueCount = 0;
    let dueTodayCount = 0;

    debts.forEach(d => {
      if (d.status === 'BELUM_LUNAS') {
        if (d.tipe === 'PIUTANG') totalPiutang += d.nominal;
        else totalHutang += d.nominal;

        if (d.jatuhTempo < today) overdueCount++;
        else if (d.jatuhTempo === today) dueTodayCount++;
      }
    });

    return { totalPiutang, totalHutang, overdueCount, dueTodayCount, totalAttention: overdueCount + dueTodayCount };
  }, [debts]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Top Banner / Welcome & Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
              {activeProfile.namaUsaha}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pemilik: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeProfile.pemilik}</span> · {activeProfile.kategoriUsaha}
          </p>
        </div>

        {/* Timeframe Selector & Balance Eye */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium transition"
            title={showBalance ? 'Sembunyikan Saldo' : 'Tampilkan Saldo'}
          >
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showBalance ? 'Sembunyikan' : 'Lihat Saldo'}</span>
          </button>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setTimeFilter('MONTH')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                timeFilter === 'MONTH'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setTimeFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                timeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
          </div>
        </div>
      </div>

      {/* Trial Reminder Warning if near or at limit */}
      {!isPro && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">
                Status Akun: Trial ({trialTrxCount} dari 10 Transaksi Terpakai)
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Upgrade ke Untungin PRO dengan kode voucher untuk mencatat transaksi tanpa batas.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenUpgradeModal}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition whitespace-nowrap active:scale-95 shrink-0 ml-2"
          >
            Upgrade Sekarang
          </button>
        </div>
      )}

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo Kas Berjalan */}
        <div className="p-5 rounded-3xl bg-[#001c3c] text-white shadow-md border border-[#0f3460] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Saldo Berjalan</span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight font-display">
              {showBalance ? `Rp ${metrics.totalSaldo.toLocaleString('id-ID')}` : 'Rp ••••••••'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2.5">
            <span>{accounts.length} Akun Terhubung</span>
            <span className="text-emerald-400 font-medium">Kas & Bank Aktif</span>
          </div>
        </div>

        {/* Card 2: Total Pemasukan */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pemasukan ({timeFilter === 'MONTH' ? 'Bulan Ini' : 'Semua'})</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight font-display">
              {showBalance ? `Rp ${metrics.pemasukan.toLocaleString('id-ID')}` : 'Rp ••••••••'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span>Arus Kas Masuk</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              +{filteredTrx.filter(t => t.tipe === 'PEMASUKAN').length} Mutasi
            </span>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pengeluaran ({timeFilter === 'MONTH' ? 'Bulan Ini' : 'Semua'})</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight font-display">
              {showBalance ? `Rp ${metrics.pengeluaran.toLocaleString('id-ID')}` : 'Rp ••••••••'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span>Beban & Biaya</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              -{filteredTrx.filter(t => t.tipe === 'PENGELUARAN').length} Mutasi
            </span>
          </div>
        </div>

        {/* Card 4: Net Profit (Laba Bersih) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Laba Bersih (Net Profit)</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              metrics.labaBersih >= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <span className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight font-display ${
              metrics.labaBersih >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {showBalance
                ? `${metrics.labaBersih >= 0 ? '+' : '-'}Rp ${Math.abs(metrics.labaBersih).toLocaleString('id-ID')}`
                : 'Rp ••••••••'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span>Margin Operasional</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {metrics.pemasukan > 0
                ? `${Math.round((metrics.labaBersih / metrics.pemasukan) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

      </div>

      {/* Quick Action Strip */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onOpenAddTrx('PEMASUKAN')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/15 active:scale-98 transition"
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>+ Catat Pemasukan</span>
        </button>

        <button
          onClick={() => onOpenAddTrx('PENGELUARAN')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/15 active:scale-98 transition"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>- Catat Pengeluaran</span>
        </button>

        <button
          onClick={() => onOpenAddTrx('TRANSFER')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#001c3c] hover:bg-[#0f3460] text-amber-300 font-bold text-xs shadow-md shadow-slate-900/10 active:scale-98 transition"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Transfer Antar-Akun</span>
        </button>
      </div>

      {/* Credit Health Quick Overview Strip (Hutang & Piutang) */}
      {debts.length > 0 && onNavigateToDebts && (
        <div 
          onClick={onNavigateToDebts}
          className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Buku Catatan Hutang & Piutang
                </h4>
                {debtStats.totalAttention > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{debtStats.totalAttention} Jatuh Tempo</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Piutang Bon Pelanggan: <strong className="text-cyan-600 dark:text-cyan-400">Rp {debtStats.totalPiutang.toLocaleString('id-ID')}</strong> · Hutang Supplier: <strong className="text-amber-600 dark:text-amber-400">Rp {debtStats.totalHutang.toLocaleString('id-ID')}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end text-xs font-bold text-cyan-600 dark:text-cyan-400 gap-1 shrink-0">
            <span>Kelola Bon & Kewajiban</span>
            <span>→</span>
          </div>
        </div>
      )}

      {/* Middle Grid: Cashflow Visualizer & Estimasi Pajak PP 55/PP 23 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow Graphic & Expense Breakdown (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Visual Cash Flow Bars */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Komposisi Arus Kas {timeFilter === 'MONTH' ? 'Bulan Ini' : 'Keseluruhan'}
              </h3>
              <span className="text-xs text-slate-400">Total {filteredTrx.length} Transaksi</span>
            </div>

            <div className="mt-5 space-y-4">
              {/* Pemasukan Progress */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Pemasukan (Inflow)
                  </span>
                  <span className="tabular-nums text-slate-900 dark:text-white">
                    Rp {metrics.pemasukan.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${metrics.pemasukan > 0 ? Math.min(100, Math.round((metrics.pemasukan / (metrics.pemasukan + metrics.pengeluaran || 1)) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              {/* Pengeluaran Progress */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Pengeluaran (Outflow)
                  </span>
                  <span className="tabular-nums text-slate-900 dark:text-white">
                    Rp {metrics.pengeluaran.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${metrics.pengeluaran > 0 ? Math.min(100, Math.round((metrics.pengeluaran / (metrics.pemasukan + metrics.pengeluaran || 1)) * 100)) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Breakdown Pengeluaran Terbesar */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Kategori Beban Terbesar
              </h4>
              {expenseBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada catatan pengeluaran pada periode ini.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {expenseBreakdown.slice(0, 4).map(item => (
                    <div key={item.category} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.category}</span>
                        <span className="text-slate-500 font-bold">{item.percentage}%</span>
                      </div>
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        Rp {item.amount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Estimasi Perhitungan Pajak UMKM 0,5% (PP 23 / PP 55) (1 Col) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pajak Final UMKM 0,5%</h3>
                <span className="text-[10px] text-slate-400">Berdasarkan PP 55/2022 & PP 23</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Tarif Pajak Penghasilan (PPh) Final UMKM berlaku sebesar <strong>0,5%</strong> dari total omset kotor bulanan usaha Anda.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Omset Bruto ({timeFilter === 'MONTH' ? 'Bulan Ini' : 'Periode'}):</span>
                <span className="font-bold tabular-nums">Rp {metrics.pemasukan.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tarif PP 55 / PP 23:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">0,5%</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Estimasi Setor PPh:</span>
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  Rp {metrics.estimasiPajak.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p>💡 <em>Catatan:</em> Untuk Wajib Pajak Orang Pribadi (WP OP), omset tahunan s.d Rp 500.000.000 bebas pajak sesuai UU HPP / PP 55.</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onNavigateToCashbook}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition text-center"
            >
              Lihat Rincian Laporan Lengkap →
            </button>
          </div>
        </div>

      </div>

      {/* Recent Transactions List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Transaksi Terakhir</h3>
            <p className="text-xs text-slate-400">5 mutasi arus kas terbaru</p>
          </div>
          <button
            onClick={onNavigateToCashbook}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Buka Buku Kas Lengkap
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.slice(0, 5).map(trx => {
            const isIncome = trx.tipe === 'PEMASUKAN';
            const isTransfer = trx.tipe === 'TRANSFER';
            const accountObj = accounts.find(a => a.id === trx.akunId);

            return (
              <div key={trx.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors rounded-xl px-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : isTransfer
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                  }`}>
                    {isIncome ? <ArrowDownRight className="w-4 h-4" /> : isTransfer ? <ArrowLeftRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {trx.keterangan || trx.kategori}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{trx.tanggal}</span>
                      <span>·</span>
                      <span className="truncate">{accountObj?.nama || 'Kas'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className={`text-xs font-extrabold tabular-nums ${
                    isIncome
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isTransfer
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}Rp {trx.nominal.toLocaleString('id-ID')}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{trx.kategori}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
