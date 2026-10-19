import React, { useState, useEffect, useCallback } from 'react';
import { UMKMProfile, Transaksi, AkunKas, AuditLog } from './types';
import { gasService } from './services/gasService';
import { Navbar } from './components/Navbar';
import { MobileTabBar } from './components/MobileTabBar';
import { DashboardView } from './components/DashboardView';
import { TransaksiView } from './components/TransaksiView';
import { AkunView } from './components/AkunView';
import { LaporanView } from './components/LaporanView';
import { AuditLogView } from './components/AuditLogView';
import { AuthModal } from './components/AuthModal';
import { TransactionModal } from './components/TransactionModal';
import { ChangePinModal } from './components/ChangePinModal';
import { ProModal } from './components/ProModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [profiles, setProfiles] = useState<UMKMProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UMKMProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [accounts, setAccounts] = useState<AkunKas[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Backend connection status
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isTrxModalOpen, setIsTrxModalOpen] = useState<boolean>(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState<boolean>(false);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaksi | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Refresh backend connection
  const checkBackend = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const res = await gasService.pingEngine();
      setIsBackendConnected(res.connected);
      if (res.connected) {
        // Connected to GAS engine
      }
    } catch {
      setIsBackendConnected(false);
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  // Reload data from gasService
  const refreshLocalData = useCallback(() => {
    const loadedProfiles = gasService.getProfiles();
    setProfiles(loadedProfiles);

    const active = gasService.getActiveProfile();
    setActiveProfile(active);

    const trx = gasService.getTransactions(active?.id);
    setTransactions(trx);

    const accs = gasService.getAccounts();
    setAccounts(accs);

    const logs = gasService.getAuditLogs(active?.id);
    setAuditLogs(logs);
  }, []);

  useEffect(() => {
    refreshLocalData();
    checkBackend();
  }, [refreshLocalData, checkBackend]);

  // Profile switch & unlock
  const handleSelectAndUnlockProfile = (profile: UMKMProfile) => {
    gasService.setActiveProfileId(profile.id);
    setActiveProfile(profile);
    const trx = gasService.getTransactions(profile.id);
    setTransactions(trx);
    const logs = gasService.getAuditLogs(profile.id);
    setAuditLogs(logs);
    showToast(`Berhasil masuk ke buku kas ${profile.namaUsaha}`);
  };

  // Register new profile
  const handleRegisterProfile = (newProfileData: Omit<UMKMProfile, 'id' | 'createdAt' | 'statusLisensi' | 'lisensiExpiredAt' | 'durasiPaket'>) => {
    const created = gasService.registerNewProfile(newProfileData);
    refreshLocalData();
    showToast(`Selamat datang! Profil usaha ${created.namaUsaha} berhasil didaftarkan.`);
  };

  // Change PIN
  const handleChangePin = (profileId: string, newPin: string) => {
    const ok = gasService.updatePin(profileId, newPin);
    if (ok) {
      refreshLocalData();
      showToast('PIN kas 6-digit berhasil diperbarui dengan aman.');
    }
    return ok;
  };

  // Save Transaction (Add or Smart Update)
  const handleSaveTransaction = (trxData: Omit<Transaksi, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => {
    if (editId) {
      const ok = gasService.updateTransaction(editId, trxData);
      if (ok) {
        refreshLocalData();
        showToast('Transaksi berhasil diperbarui (Smart Update).');
        return { success: true };
      }
      return { success: false, message: 'Gagal memperbarui transaksi.' };
    } else {
      const res = gasService.addTransaction(trxData);
      if (res.success) {
        refreshLocalData();
        showToast(`Berhasil mencatat ${trxData.tipe} Rp ${trxData.nominal.toLocaleString('id-ID')}`);
        return { success: true };
      }
      return { success: false, message: res.message };
    }
  };

  // Delete Transaction (Smart Delete)
  const handleDeleteTransaction = (id: string) => {
    const ok = gasService.deleteTransaction(id);
    if (ok) {
      refreshLocalData();
      showToast('Transaksi berhasil dihapus (Smart Delete).');
    }
  };

  // Add Account
  const handleAddAccount = (acc: Omit<AkunKas, 'id'>) => {
    gasService.addAccount(acc);
    refreshLocalData();
    showToast(`Akun kas ${acc.nama} berhasil ditambahkan.`);
  };

  // Upgrade PRO with voucher
  const handleUpgradeWithVoucher = (code: string) => {
    if (!activeProfile) return { success: false, message: 'Profil usaha tidak aktif.' };
    const res = gasService.upgradeToPro(activeProfile.id, code);
    if (res.success) {
      refreshLocalData();
      showToast(res.message);
    }
    return res;
  };

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-2xl flex items-center justify-center mx-auto animate-pulse">
            U
          </div>
          <p className="text-sm font-semibold">Memuat Database Untungin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <div className="no-print">
        <Navbar
          activeProfile={activeProfile}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenProfileSelect={() => setIsAuthModalOpen(true)}
          onOpenUpgradeModal={() => setIsProModalOpen(true)}
          onOpenChangePinModal={() => setIsChangePinModalOpen(true)}
          isBackendConnected={isBackendConnected}
          isCheckingBackend={isCheckingBackend}
          onRefreshBackend={checkBackend}
        />
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            activeProfile={activeProfile}
            transactions={transactions}
            accounts={accounts}
            onOpenAddTrx={(initialType) => {
              setEditingTransaction(null);
              setIsTrxModalOpen(true);
            }}
            onNavigateToCashbook={() => setCurrentTab('transaksi')}
            onOpenUpgradeModal={() => setIsProModalOpen(true)}
          />
        )}

        {currentTab === 'transaksi' && (
          <TransaksiView
            activeProfile={activeProfile}
            transactions={transactions}
            accounts={accounts}
            onOpenAddTrx={() => {
              setEditingTransaction(null);
              setIsTrxModalOpen(true);
            }}
            onEditTrx={(trx) => {
              setEditingTransaction(trx);
              setIsTrxModalOpen(true);
            }}
            onDeleteTrx={handleDeleteTransaction}
          />
        )}

        {currentTab === 'akun' && (
          <AkunView
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onOpenTransfer={() => {
              setEditingTransaction(null);
              setIsTrxModalOpen(true);
            }}
          />
        )}

        {currentTab === 'laporan' && (
          <LaporanView
            activeProfile={activeProfile}
            transactions={transactions}
            accounts={accounts}
          />
        )}

        {currentTab === 'audit' && (
          <AuditLogView logs={auditLogs} />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="no-print">
        <MobileTabBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenAddTrx={() => {
            setEditingTransaction(null);
            setIsTrxModalOpen(true);
          }}
        />

        {/* Offline Connectivity Notification */}
        <OfflineIndicator />
      </div>

      {/* Floating Feedback Toast */}
      {toast && (
        <div className="no-print fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-slide-in text-xs font-semibold max-w-sm">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        profiles={profiles}
        activeProfile={activeProfile}
        onSelectAndUnlockProfile={handleSelectAndUnlockProfile}
        onRegisterProfile={handleRegisterProfile}
      />

      <TransactionModal
        isOpen={isTrxModalOpen}
        onClose={() => {
          setIsTrxModalOpen(false);
          setEditingTransaction(null);
        }}
        umkmId={activeProfile.id}
        accounts={accounts}
        editingTransaction={editingTransaction}
        onSave={handleSaveTransaction}
      />

      <ChangePinModal
        isOpen={isChangePinModalOpen}
        onClose={() => setIsChangePinModalOpen(false)}
        activeProfile={activeProfile}
        onChangePin={handleChangePin}
      />

      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        activeProfile={activeProfile}
        onUpgradeWithVoucher={handleUpgradeWithVoucher}
      />

    </div>
  );
}
