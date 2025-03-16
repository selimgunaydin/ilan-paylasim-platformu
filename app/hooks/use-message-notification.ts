'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { fetchUnreadMessages } from '@/redux/slices/messageSlice';

/**
 * Mesaj bildirimlerini yönetmek için özel hook
 * 
 * @param autoRefresh - Otomatik yenileme yapılıp yapılmayacağı (varsayılan: true)
 * @returns reset fonksiyonu ve isLoading durumu
 */
export const useMessageNotification = (
  autoRefresh = true,
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
  }, [dispatch, autoRefresh]);

  // Manuel güncelleme fonksiyonu
  const refreshUnreadMessages = () => {
    return dispatch(fetchUnreadMessages());
  };

  return {
    refreshUnreadMessages
  };
}; 