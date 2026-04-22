import { AccountMetrics, Trade } from './types';

const API_BASE_URL = ''; // Use relative paths for Next.js API

// --- Auth Helper ---
import { createClient } from './supabase/client';

async function getHeaders(): Promise<HeadersInit> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
        'Content-Type': 'application/json',
        'Authorization': session ? `Bearer ${session.access_token}` : ''
    };
}

// --- API Methods ---

export async function getStats(accountId?: string) {
    try {
        const headers = await getHeaders();
        const url = accountId 
            ? `${API_BASE_URL}/api/stats?accountId=${accountId}` 
            : `${API_BASE_URL}/api/stats`;
            
        const res = await fetch(url, { 
            headers,
            cache: 'no-store' 
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

export async function sendCommand(action: string, ticket: number = 0, params: any = {}) {
    try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE_URL}/api/trade/command`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ action, ticket, params }),
        });
        if (!res.ok) throw new Error('Failed to send command');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

export async function generateToken(name?: string) {
    try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE_URL}/api/accounts/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                name 
            }),
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to generate token');
        }
        const data = await res.json();
        return data.account.token;
    } catch (error) {
        console.error('API Error:', error);
        throw error; // Re-throw to handle in UI
    }
}

export async function getTokens() {
    try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE_URL}/api/accounts`, { 
            headers,
            cache: 'no-store' 
        });
        if (!res.ok) throw new Error('Failed to fetch tokens');
        const data = await res.json();
        return data.accounts || [];
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
}

export async function resetData() {
    try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE_URL}/reset`, { method: 'POST', headers });
        if (!res.ok) throw new Error('Failed to reset data');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}
export async function deleteAccount(accountId: string) {
    try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE_URL}/api/accounts?accountId=${accountId}`, {
            method: 'DELETE',
            headers
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to delete account');
        }
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
export async function unbindAccount(accountId: string) {
    try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE_URL}/api/accounts/unbind`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ accountId })
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to unbind terminal');
        }
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function rotateToken(accountId: string) {
    try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE_URL}/api/accounts/rotate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ accountId })
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to rotate token');
        }
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function revokeToken(accountId: string) {
    try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE_URL}/api/accounts/revoke`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ accountId })
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to revoke token');
        }
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
