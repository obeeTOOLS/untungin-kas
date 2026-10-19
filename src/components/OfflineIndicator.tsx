import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';
import { gasService } from '../services/gasService';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showSyncedSuccess, setShowSyncedSuccess] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(() => {
    return typeof window !== 'undefined' ? gasService.getOfflineQueueCount() : 0;
  });

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Auto-flush pending outbox queue immediately
      try {
        await gasService.flushQueue();
      } catch (err) {
        console.warn('Queue flush error:', err);
      }
      setShowSyncedSuccess(true);
      setPendingCount(0);
      const timer = setTimeout(() => {
        setShowSyncedSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowSyncedSuccess(false);
      setPendingCount(gasService.getOfflineQueueCount());
    };

    const handleQueueFlushed = () => {
      setPendingCount(gasService.getOfflineQueueCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('untungin:queue_flushed', handleQueueFlushed);

    // Periodic check for pending count when offline
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setPendingCount(gasService.getOfflineQueueCount());
      }
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('untungin:queue_flushed', handleQueueFlushed);
      clearInterval(interval);
    };
  }, []);

  // 1. Reconnected / Online Notification (Hijau Sukses)
  if (showSyncedSuccess) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className="fixed top-0 inset-x-0 z-50 bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold shadow-lg flex items-center justify-center gap-2 animate-slide-down transition-all"
      >
        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
        <span>Semua data offline berhasil disinkronkan ke Cloud!</span>
      </div>
    );
  }

  // 2. Offline Mode Active Banner (Badge Halus di Atas)
  if (!isOnline) {
    return (
      <div 
        role="alert"
        className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold shadow-md flex items-center justify-center gap-2 animate-slide-down transition-all"
      >
        <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
        <span>Mode Offline Aktif - Transaksi tetap tersimpan aman di HP Anda</span>
        {pendingCount > 0 && (
          <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-extrabold shadow-xs">
            {pendingCount} tersimpan di outbox
          </span>
        )}
      </div>
    );
  }

  return null;
};
