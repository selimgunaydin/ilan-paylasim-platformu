'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { fetchUnreadMessages } from '@/redux/slices/messageSlice';

/**
 * Mesaj bildirimlerini yönetmek için özel hook
 * 
 * @param autoRefresh - Otomatik yenileme yapılıp yapılmayacağı (varsayılan: true)
 * @param refreshInterval - Yenileme aralığı (milisaniye cinsinden, varsayılan: 30000 = 30 saniye)
 * @returns reset fonksiyonu ve isLoading durumu
 */
export const useMessageNotification = (
  autoRefresh = true,
  refreshInterval = 30000
) => {
  const dispatch = useAppDispatch();

  // İlk yükleme ve periyodik güncelleme
  useEffect(() => {
    // İlk yükleme
    const fetchData = () => {
      dispatch(fetchUnreadMessages());
    };

    // İlk çağrı
    fetchData();

    // Otomatik yenileme açıksa, interval oluştur
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchData, refreshInterval);
    }

    // Cleanup
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dispatch, autoRefresh, refreshInterval]);

  // Manuel güncelleme fonksiyonu
  const refreshUnreadMessages = () => {
    return dispatch(fetchUnreadMessages());
  };

  return {
    refreshUnreadMessages
  };
}; 