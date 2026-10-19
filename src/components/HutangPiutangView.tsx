import React, { useState, useMemo } from 'react';
import { HutangPiutang, UMKMProfile, AkunKas, TipeHutangPiutang, StatusHutangPiutang } from '../types';
import { 
  Plus, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Edit3, 
  Trash2, 
  Calendar, 
  Phone, 
  Filter, 
  X,
  Send,
  AlertCircle,
  Building2,
  DollarSign
} from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';
import { HutangPiutangModal } from './HutangPiutangModal';
import { SettlementModal } from './SettlementModal';

interface HutangPiutangViewProps {
  activeProfile: UMKMProfile;
  accounts: AkunKas[];
  records: HutangPiutang[];
  onAddRecord: (data: Omit<HutangPiutang, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateRecord: (id: string, data: Partial<HutangPiutang>) => void;
  onDeleteRecord: (id: string) => void;
  onSettleRecord: (id: string, options?: { recordToCashbook: boolean; akunId?: string }) => void;
}

export const HutangPiutangView: React.FC<HutangPiutangViewProps> = ({
  activeProfile,
  accounts,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onSettleRecord
}) => {
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);

  // Sub-Tab: 'PIUTANG' (Piutang Saya / Bon Pelanggan) vs 'HUTANG' (Hutang Saya / Supplier)
  const [activeSubTab, setActiveSubTab] = useState<TipeHutangPiutang>('PIUTANG');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StatusHutangPiutang>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HutangPiutang | null>(null);
  const [settlingItem, setSettlingItem] = useState<HutangPiutang | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Compute 3 Credit Health Indicators across all records
  const healthStats = useMemo(() => {
    let totalPiutangBelumLunas = 0;
    let piutangBelumLunasCount = 0;
    let totalHutangBelumLunas = 0;
    let hutangBelumLunasCount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;

    records.forEach(r => {
      if (r.status === 'BELUM_LUNAS') {
        if (r.tipe === 'PIUTANG') {
          totalPiutangBelumLunas += r.nominal;
          piutangBelumLunasCount++;
        } else {
          totalHutangBelumLunas += r.nominal;
          hutangBelumLunasCount++;
        }

        // Check due dates
        if (r.jatuhTempo < todayStr) {
          overdueCount++;
        } else if (r.jatuhTempo === todayStr) {
          dueTodayCount++;
        }
      }
    });

    return {
      totalPiutangBelumLunas,
      piutangBelumLunasCount,
      totalHutangBelumLunas,
      hutangBelumLunasCount,
      dueTodayCount,
      overdueCount,
      totalAttentionCount: dueTodayCount + overdueCount
    };
  }, [records, todayStr]);

  // Filter records by active sub-tab, status, and search query
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Sub-Tab filter
      if (r.tipe !== activeSubTab) return false;

      // 2. Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.pihakTerkait.toLowerCase().includes(q);
        const matchNote = r.keterangan?.toLowerCase().includes(q);
        const matchNominal = r.nominal.toString().includes(q);
        const matchContact = r.kontakWa?.includes(q);
        if (!matchName && !matchNote && !matchNominal && !matchContact) return false;
      }

      return true;
    });
  }, [records, activeSubTab, statusFilter, searchQuery]);

  // WhatsApp Reminder message builder
  const buildWaUrl = (item: HutangPiutang) => {
    const isOverdue = item.jatuhTempo < todayStr;
    const isDueToday = item.jatuhTempo === todayStr;

    let dueStatusText = `Jatuh tempo: ${item.jatuhTempo}`;
    if (isOverdue) {
      dueStatusText = `⚠️ Sudah lewat jatuh tempo (${item.jatuhTempo})`;
    } else if (isDueToday) {
      dueStatusText = `⏰ Jatuh tempo hari ini (${item.jatuhTempo})`;
    }

    let message = '';
    if (item.tipe === 'PIUTANG') {
      message = 
`Halo Kak *${item.pihakTerkait}*, semoga harinya menyenangkan dan usahanya berkah selalu 🙏

Kami dari *${activeProfile.namaUsaha}* menginfokan pengingat ramah (*friendly reminder*) untuk catatan bon penjualan:
━━━━━━━━━━━━━━━━━━━━━━
📋 *Rincian*: ${item.keterangan || 'Pesanan/Bon Penjualan'}
📅 *Tanggal Transaksi*: ${item.tanggal}
⏳ *Batas Tempo*: ${dueStatusText}
💰 *Total Tagihan*: Rp ${item.nominal.toLocaleString('id-ID')}
━━━━━━━━━━━━━━━━━━━━━━
Mohon konfirmasinya ya Kak bila sudah ditransfer atau ingin diselesaikan. Terima kasih banyak atas kerjasamanya! 🙏✨

_Dicatat via UNTUNGIN PWA_`;
    } else {
      message = 
`Halo *${item.pihakTerkait}*, 

Berikut konfirmasi pencatatan faktur/kewajiban dari *${activeProfile.namaUsaha}*:
━━━━━━━━━━━━━━━━━━━━━━
📋 *Faktur/Barang*: ${item.keterangan || 'Pengadaan barang'}
📅 *Tanggal Belanja*: ${item.tanggal}
⏳ *Rencana Pelunasan*: ${dueStatusText}
💰 *Total Tagihan*: Rp ${item.nominal.toLocaleString('id-ID')}
━━━━━━━━━━━━━━━━━━━━━━
Pencatatan telah tersimpan resmi pada sistem pembukuan UNTUNGIN. Terima kasih! 🙏`;
    }

    const cleanPhone = item.kontakWa ? item.kontakWa.replace(/[^0-9]/g, '') : '';
    // Format nomor Indonesia (jika diawali 08 -> ganti ke 628)
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    if (formattedPhone) {
      return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: HutangPiutang) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    onDeleteRecord(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            Buku Catatan Hutang & Piutang
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola bon pelanggan, tagihan tempo supplier, pengingat WhatsApp, dan pelunasan otomatis {activeProfile.namaUsaha}.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{activeSubTab === 'PIUTANG' ? 'Catat Piutang Pelanggan' : 'Catat Hutang Supplier'}</span>
        </button>
      </div>

      {/* 2. Kartu Indikator Ringkasan (Credit Health Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Total Piutang Belum Lunas (Biru / Cyan) */}
        <div 
          onClick={() => setActiveSubTab('PIUTANG')}
          className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            activeSubTab === 'PIUTANG' 
              ? 'border-cyan-500 shadow-md ring-2 ring-cyan-500/20' 
              : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Piutang Pelanggan (Bon)</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums tracking-tight font-display">
              Rp {healthStats.totalPiutangBelumLunas.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span>{healthStats.piutangBelumLunasCount} Bon Belum Lunas</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Uang Kita di Luar</span>
          </div>
        </div>

        {/* Card 2: Total Hutang Belum Lunas (Merah / Amber) */}
        <div 
          onClick={() => setActiveSubTab('HUTANG')}
          className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            activeSubTab === 'HUTANG' 
              ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20' 
              : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Hutang Supplier (Kewajiban)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight font-display">
              Rp {healthStats.totalHutangBelumLunas.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span>{healthStats.hutangBelumLunasCount} Tagihan Tempo</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Kewajiban Usaha</span>
          </div>
        </div>

        {/* Card 3: Peringatan Jatuh Tempo (Status Warning Card) */}
        <div className={`p-5 rounded-3xl border transition-all ${
          healthStats.overdueCount > 0
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 shadow-sm'
            : healthStats.dueTodayCount > 0
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-600 dark:text-slate-400">
              Peringatan Jatuh Tempo
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              healthStats.overdueCount > 0
                ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight font-display ${
              healthStats.overdueCount > 0 
                ? 'text-rose-600 dark:text-rose-400' 
                : healthStats.dueTodayCount > 0 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-slate-900 dark:text-white'
            }`}>
              {healthStats.totalAttentionCount} Catatan
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/50 dark:border-slate-800 pt-2.5">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {healthStats.overdueCount} Lewat Tempo (Overdue)
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {healthStats.dueTodayCount} Hari Ini
            </span>
          </div>
        </div>

      </div>

      {/* 3. Sub-Tabs & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Sub-Tab Navigation: Piutang Saya vs Hutang Saya */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('PIUTANG')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'PIUTANG'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-cyan-600'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Piutang Saya (Bon Pelanggan)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('HUTANG')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'HUTANG'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Hutang Saya (Supplier)</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {activeSubTab === 'PIUTANG' ? 'Tagihan pelanggan ke usaha kita' : 'Kewajiban bayar usaha ke pihak lain'}
          </span>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeSubTab === 'PIUTANG' ? 'Cari nama pelanggan, nomor WA, nota, atau nominal...' : 'Cari nama supplier, nota, atau nominal...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Segmented */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('BELUM_LUNAS')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'BELUM_LUNAS'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Belum Lunas
            </button>
            <button
              onClick={() => setStatusFilter('LUNAS')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'LUNAS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Sudah Lunas
            </button>
          </div>
        </div>

      </div>

      {/* 4. List of Debt & Credit Records */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-medium">
              Tidak ada catatan {activeSubTab === 'PIUTANG' ? 'piutang pelanggan' : 'hutang supplier'} ditemukan.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol "Catat {activeSubTab === 'PIUTANG' ? 'Piutang' : 'Hutang'}" di atas untuk menambahkan catatan baru.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRecords.map(item => {
              const isLunas = item.status === 'LUNAS';
              const isOverdue = !isLunas && item.jatuhTempo < todayStr;
              const isDueToday = !isLunas && item.jatuhTempo === todayStr;

              // Calculate days diff
              let dueBadgeText = item.jatuhTempo;
              let dueBadgeClass = 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';

              if (isLunas) {
                dueBadgeText = `Lunas pada ${item.tanggalLunas || item.updatedAt.split('T')[0]}`;
                dueBadgeClass = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 font-bold';
              } else if (isOverdue) {
                const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(item.jatuhTempo).getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                dueBadgeText = `⚠️ Lewat ${diffDays} Hari (${item.jatuhTempo})`;
                dueBadgeClass = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 font-bold animate-pulse';
              } else if (isDueToday) {
                dueBadgeText = '⏰ Jatuh Tempo Hari Ini';
                dueBadgeClass = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 font-bold';
              } else {
                dueBadgeText = `Tempo: ${item.jatuhTempo}`;
                dueBadgeClass = 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
              }

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                >
                  {/* Left: Info Pihak & Detail */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isLunas
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : isOverdue
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                        : item.tipe === 'PIUTANG'
                        ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                    }`}>
                      {isLunas ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isOverdue ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : item.tipe === 'PIUTANG' ? (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.pihakTerkait}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${dueBadgeClass}`}>
                          {dueBadgeText}
                        </span>
                      </div>

                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span>Tgl: {item.tanggal}</span>
                        {item.kontakWa && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {item.kontakWa}
                            </span>
                          </>
                        )}
                        {item.keterangan && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-xs">{item.keterangan}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Nominal & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className={`text-base sm:text-lg font-extrabold tabular-nums tracking-tight font-display ${
                        isLunas 
                          ? 'text-slate-400 line-through' 
                          : item.tipe === 'PIUTANG'
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        Rp {item.nominal.toLocaleString('id-ID')}
                      </span>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                        {isLunas ? 'Lunas' : item.tipe === 'PIUTANG' ? 'Piutang Bon' : 'Hutang Tempo'}
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      
                      {/* [🔔 Tagih via WA] */}
                      {!isLunas && (
                        <a
                          href={buildWaUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold shadow-xs active:scale-95 transition"
                          title="Kirim pesan tagihan / reminder sopan via WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Tagih WA</span>
                        </a>
                      )}

                      {/* [✅ Tandai Lunas] */}
                      {!isLunas ? (
                        <button
                          onClick={() => setSettlingItem(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
                          title="Tandai lunas dan tawarkan pencatatan ke Buku Kas"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Lunas</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateRecord(item.id, { status: 'BELUM_LUNAS', tanggalLunas: undefined })}
                          className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-semibold transition"
                          title="Buka kembali catatan ini menjadi Belum Lunas"
                        >
                          Batal Lunas
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Catatan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal (Add / Edit) */}
      <HutangPiutangModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        umkmId={activeProfile.id}
        namaUsaha={activeProfile.namaUsaha}
        editingItem={editingItem}
        initialType={activeSubTab}
        onSave={(data, editId) => {
          if (editId) {
            onUpdateRecord(editId, data);
            return { success: true };
          } else {
            onAddRecord(data);
            return { success: true };
          }
        }}
      />

      {/* Smart Settlement Modal */}
      <SettlementModal
        isOpen={!!settlingItem}
        onClose={() => setSettlingItem(null)}
        debtItem={settlingItem}
        accounts={accounts}
        onConfirmSettlement={(debtId, recordToCashbook, akunId) => {
          onSettleRecord(debtId, { recordToCashbook, akunId });
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Catatan Ini?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Catatan hutang/piutang ini akan dihapus secara permanen dari perangkat dan disinkronkan ke Google Spreadsheet Vault.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
              >
                Hapus Catatan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
