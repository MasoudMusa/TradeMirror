'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Account {
  id: string;
  name: string;
  broker: string | null;
  mt5_account_id: number | null;
  is_active: boolean;
  updated_at?: string;
  last_sync_at?: string | null;
}

interface AccountContextType {
  accountId: string | null;
  selectedAccount: Account | null;
  setAccountId: (id: string | null) => void;
  loading: boolean;
  refreshAccount: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to update account ID and persist it
  const setAccountId = (id: string | null) => {
    setAccountIdState(id);
    if (id) {
      localStorage.setItem('selectedAccountId', id);
    } else {
      localStorage.removeItem('selectedAccountId');
    }
  };

  const fetchAccountDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();
        
      if (!error && data) {
        setSelectedAccount(data);
      } else {
        setSelectedAccount(null);
        // If account doesn't exist anymore, clear it
        if (error?.code === 'PGRST116') {
             setAccountId(null);
        }
      }
    } catch (err) {
      console.error('Error fetching account details:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial Load: URL -> LocalStorage -> Null
  useEffect(() => {
    const urlId = searchParams.get('accountId');
    const storedId = localStorage.getItem('selectedAccountId');
    
    if (urlId) {
      setAccountIdState(urlId);
    } else if (storedId) {
      setAccountIdState(storedId);
    }
    setLoading(false);
  }, []);

  // 2. Sync account details when accountId changes
  useEffect(() => {
    let channel: any = null;

    if (accountId) {
      fetchAccountDetails(accountId);

      // Setup realtime subscription for this specific account
      channel = supabase
        .channel(`account-detail-${accountId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'accounts',
            filter: `id=eq.${accountId}`,
          },
          (payload) => {
            console.log('Account Detail Realtime Update:', payload);
            setSelectedAccount(payload.new as Account);
          }
        )
        .subscribe();
    } else {
      setSelectedAccount(null);
      setLoading(false);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [accountId]);

  // 3. Keep URL in sync with context (optional but recommended for shared links)
  // We only update if the URL is DIFFERENT from state and we're in the dashboard
  useEffect(() => {
    if (pathname.startsWith('/dashboard')) {
        const urlId = searchParams.get('accountId');
        if (accountId && urlId !== accountId) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('accountId', accountId);
            router.replace(`${pathname}?${params.toString()}`);
        } else if (!accountId && urlId) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('accountId');
            router.replace(`${pathname}?${params.toString()}`);
        }
    }
  }, [accountId, pathname, searchParams, router]);

  return (
    <AccountContext.Provider 
      value={{ 
        accountId, 
        selectedAccount, 
        setAccountId, 
        loading,
        refreshAccount: () => accountId ? fetchAccountDetails(accountId) : Promise.resolve()
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
