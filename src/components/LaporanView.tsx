import React, { useState, useMemo } from 'react';
import { Transaksi, UMKMProfile, AkunKas } from '../types';
import { 
  FileText, 
  Printer, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Info,
  Calendar
} from 'lucide-react';
import { exportTransactionsToPDF } from '../utils/exportUtils';

interface LaporanViewProps {
  activeProfile: UMKMProfile;
  transactions: Transaksi[];
  accounts: AkunKas[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  activeProfile,
  transactions,
  accounts
}) => {
  const [periodType, setPeriodType] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [isWPOP, setIsWPOP] = useState(true); // Wajib Pajak Orang Pribadi (fasilitas PTKP 500jt PP 55)

  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonth}`);
  const [selectedYear, setSelectedYear] = useState(`${currentYear}`);

  // Filter transactions based on selection
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (periodType === 'MONTH') {
        return t.tanggal.startsWith(selectedMonth);
      }
      return t.tanggal.startsWith(selectedYear);
    });
  }, [transactions, periodType, selectedMonth, selectedYear]);

  // Breakdown income & expenses
  const breakdown = useMemo(() => {
    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    filtered.forEach(t => {
      if (t.tipe === 'PEMASUKAN') {
        incomeMap[t.kategori] = (incomeMap[t.kategori] || 0) + t.nominal;
        totalIncome += t.nominal;
      } else if (t.tipe === 'PENGELUARAN') {
        expenseMap[t.kategori] = (expenseMap[t.kategori] || 0) + t.nominal;
        totalExpense += t.nominal;
      }
    });

    const netProfit = totalIncome - totalExpense;

    // Perhitungan Pajak PP 55 / PP 23
    // Jika WP OP: omset di bawah 500jt per tahun bebas pajak
    let taxableOmset = totalIncome;
    if (isWPOP && periodType === 'YEAR') {
      taxableOmset = Math.max(0, totalIncome - 500000000);
    }
    const pajak05 = Math.round(taxableOmset * 0.005);

    return {
      incomeItems: Object.entries(incomeMap),
      expenseItems: Object.entries(expenseMap),
      totalIncome,
      totalExpense,
      netProfit,
      taxableOmset,
      pajak05
    };
  }, [filtered, isWPOP, periodType]);

  const handlePrint = () => {
    exportTransactionsToPDF(
      filtered,
      accounts,
      activeProfile,
      periodType === 'MONTH' ? `Bulan ${selectedMonth}` : `Tahun ${selectedYear}`
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            Laporan Keuangan & Pajak UMKM
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Laporan Laba Rugi (Profit & Loss) dan kalkulator PPh Final 0,5% PP 55/PP 23.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Mode */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setPeriodType('MONTH')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                periodType === 'MONTH'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setPeriodType('YEAR')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                periodType === 'YEAR'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tahunan
            </button>
          </div>

          {/* Month or Year Input */}
          {periodType === 'MONTH' ? (
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-slate-200 dark:border-slate-700 outline-none"
            />
          ) : (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-slate-200 dark:border-slate-700 outline-none"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* Laba Rugi (P&L) Statement Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        
        {/* Letterhead */}
        <div className="pb-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              LAPORAN LABA RUGI (INCOME STATEMENT)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Usaha: <strong>{activeProfile.namaUsaha}</strong> · Penanggung Jawab: {activeProfile.pemilik}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-400">
            <span>Periode: {periodType === 'MONTH' ? selectedMonth : `Tahun ${selectedYear}`}</span>
          </div>
        </div>

        {/* P&L Table */}
        <div className="mt-6 space-y-6">
          
          {/* Section 1: Pendapatan Usaha */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span className="uppercase tracking-wider">1. PENDAPATAN USAHA (REVENUE)</span>
              <span>Nominal (Rp)</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {breakdown.incomeItems.length === 0 ? (
                <div className="py-2.5 text-slate-400 italic">Tidak ada catatan pemasukan pada periode ini.</div>
              ) : (
                breakdown.incomeItems.map(([cat, val]) => (
                  <div key={cat} className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                    <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      Rp {val.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
              <span>TOTAL PENDAPATAN KOTOR:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold tabular-nums">
                Rp {breakdown.totalIncome.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Section 2: Beban & Pengeluaran */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-700 dark:text-rose-400">
              <span className="uppercase tracking-wider">2. BEBAN OPERASIONAL & BIAYA (EXPENSES)</span>
              <span>Nominal (Rp)</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {breakdown.expenseItems.length === 0 ? (
                <div className="py-2.5 text-slate-400 italic">Tidak ada catatan pengeluaran pada periode ini.</div>
              ) : (
                breakdown.expenseItems.map(([cat, val]) => (
                  <div key={cat} className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                    <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                      Rp {val.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
              <span>TOTAL BEBAN OPERASIONAL:</span>
              <span className="text-rose-600 dark:text-rose-400 font-extrabold tabular-nums">
                Rp {breakdown.totalExpense.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Section 3: Net Profit Final */}
          <div className={`p-4 rounded-2xl flex items-center justify-between text-sm font-bold border ${
            breakdown.netProfit >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div>
              <span className="block text-xs uppercase tracking-wider font-extrabold">
                LABA BERSIH (NET PROFIT)
              </span>
              <span className="text-[11px] font-normal opacity-80">
                (Total Pendapatan dikurangi Total Beban)
              </span>
            </div>
            <span className="text-xl font-extrabold tabular-nums tracking-tight font-display">
              {breakdown.netProfit >= 0 ? '+' : '-'}Rp {Math.abs(breakdown.netProfit).toLocaleString('id-ID')}
            </span>
          </div>

        </div>

      </div>

      {/* Tax Calculation Section PP 55 / PP 23 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Simulasi Pajak Penghasilan (PPh) Final UMKM 0,5%
              </h3>
              <p className="text-[11px] text-slate-400">Aturan Resmi PP 55 Tahun 2022 & PP 23 Tahun 2018</p>
            </div>
          </div>

          {/* Taxpayer Entity Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tipe Wajib Pajak:</span>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setIsWPOP(true)}
                className={`px-3 py-1 font-semibold rounded-lg transition ${
                  isWPOP
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Orang Pribadi (WP OP)
              </button>
              <button
                onClick={() => setIsWPOP(false)}
                className={`px-3 py-1 font-semibold rounded-lg transition ${
                  !isWPOP
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Badan Usaha (CV/PT)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500">Total Omset Bruto:</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              Rp {breakdown.totalIncome.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Dasar Pengenaan Pajak (DPP)</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500">Omset Dikenakan Pajak:</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              Rp {breakdown.taxableOmset.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isWPOP && periodType === 'YEAR' ? 'Setelah PTKP Rp 500 Juta' : 'Tarif penuh 0,5%'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Estimasi Setor PPh Final (0,5%):</span>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
              Rp {breakdown.pajak05.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1">Disetor setiap tanggal 15 bulan berikutnya</p>
          </div>

        </div>

        <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Berdasarkan Undang-Undang Harmonisasi Peraturan Perpajakan (UU HPP) & PP 55/2022, peredaran bruto s.d Rp 500 juta dalam satu tahun pajak untuk Wajib Pajak Orang Pribadi tidak dikenai PPh. Jika omset melebihi Rp 500 juta, pajak 0,5% hanya dihitung dari selisih kelebihannya.
          </span>
        </div>
      </div>

    </div>
  );
};
