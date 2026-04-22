'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Trade {
  id: string;
  account_id: string;
  ticket: number;
  symbol: string;
  direction: string | null;
  lot_size: number | null;
  entry_price: number | null;
  exit_price: number | null;
  current_price: number | null;
  sl: number | null;
  tp: number | null;
  status: string | null;
  open_time: string | null;
  close_time: string | null;
  pnl: number | null;
  floating_pnl: number | null;
  commission: number | null;
  swap: number | null;
  mfe: number | null;
  mae: number | null;
  result_r: number | null;
  bias: string | null;
  setup_type: string | null;
  entry_model: string | null;
  session: string | null;
  timeframe: string | null;
  created_at: string;
  updated_at: string;
  comment?: string;
}

export function useRealtimeTrades(accountId?: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const fetchTrades = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('trades')
          .select('*')
          .order('created_at', { ascending: false });

        if (accountId) {
          query = query.eq('account_id', accountId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setTrades(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching trades:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch trades');
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSubscription = () => {
      // Subscribe to changes in the trades table
      channel = supabase
        .channel('trades-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trades',
            filter: accountId ? `account_id=eq.${accountId}` : undefined,
          },
          (payload) => {
            console.log('Realtime update:', payload);

            if (payload.eventType === 'INSERT') {
              setTrades((current) => [payload.new as Trade, ...current]);
            } else if (payload.eventType === 'UPDATE') {
              setTrades((current) =>
                current.map((trade) =>
                  trade.id === payload.new.id ? (payload.new as Trade) : trade
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setTrades((current) =>
                current.filter((trade) => trade.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });
    };

    fetchTrades();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [accountId]);

  return { trades, loading, error };
}
