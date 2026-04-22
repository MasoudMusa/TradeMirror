'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Account {
  id: string;
  user_id: string;
  mt5_account_id: string | null;
  token: string | null;
  broker: string | null;
  currency: string;
  leverage: number | null;
  balance: number;
  equity: number;
  is_active: boolean;
  last_sync_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  name?: string;
  last_heartbeat_at?: string;
}

export function useRealtimeAccounts(userId?: string) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;

    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setAccounts(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel('accounts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'accounts',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('Account update:', payload);

            if (payload.eventType === 'INSERT') {
              setAccounts((current) => [payload.new as Account, ...current]);
            } else if (payload.eventType === 'UPDATE') {
              setAccounts((current) =>
                current.map((account) =>
                  account.id === payload.new.id ? (payload.new as Account) : account
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setAccounts((current) =>
                current.filter((account) => account.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe((status) => {
          console.log('Accounts realtime subscription status:', status);
        });
    };

    fetchAccounts();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  return { accounts, loading, error };
}
