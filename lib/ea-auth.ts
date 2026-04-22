import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');

// Create Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  accountId?: string;
}

/**
 * Validates access token and returns user_id
 * Tokens are in format: tmk_xxxxx
 * If mt5AccountId is provided, it checks if it matches the account's existing mt5_account_id.
 * If there is a mismatch, the token is REVOKED.
 */
export async function validateAccessToken(
  token: string, 
  mt5AccountId?: string
): Promise<{ account: any | null; userId: string | null; error: string | null; revoked: boolean }> {
  if (!token || !token.startsWith('tmk_')) {
    return { account: null, userId: null, error: 'Invalid token format', revoked: false };
  }

  try {
    // Check accounts table for token
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return { account: null, userId: null, error: 'Invalid token', revoked: false };
    }

    // Account Switch Detection
    if (mt5AccountId && data.mt5_account_id && String(data.mt5_account_id) !== String(mt5AccountId)) {
      console.warn(`SECURITY NOTICE: Account mismatch for token ${token}. Token belongs to MT5 ID ${data.mt5_account_id}, but request is from ${mt5AccountId}. Denying access.`);
      
      return {
        account: null,
        userId: null,
        error: `Account Mismatch: This token is linked to MT5 Account ${data.mt5_account_id}. To use it with account ${mt5AccountId}, please click "Unbind Terminal" in your TradeMirror Dashboard and then restart the EA.`,
        revoked: true
      };
    }

    // Bind MT5 ID if not already bound
    const updateData: any = { last_used_at: new Date().toISOString() };
    if (mt5AccountId && !data.mt5_account_id) {
      updateData.mt5_account_id = mt5AccountId;
    }

    // Update account record
    await supabaseAdmin
      .from('accounts')
      .update(updateData)
      .eq('id', data.id);

    return { account: data, userId: data.user_id, error: null, revoked: false };
  } catch (err) {
    console.error('Token validation error:', err);
    return { account: null, userId: null, error: 'Token validation failed', revoked: false };
  }
}

/**
 * Middleware to authenticate EA requests
 * Extracts token from Authorization header and validates it
 */
export async function authenticateEA(
  request: NextRequest, 
  mt5AccountId?: string
): Promise<{ userId: string; account: any; error: null } | { userId: null; account: null; error: NextResponse }> {
  let token = '';
  
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    token = authHeader.replace('Bearer ', '').trim();
  } else {
    // Fallback to X-Access-Token header
    const xAccessToken = request.headers.get('x-access-token');
    if (xAccessToken) {
      token = xAccessToken.trim();
    }
  }
  
  if (!token) {
    return {
      userId: null,
      account: null,
      error: NextResponse.json(
        { error: 'Missing authorization header or X-Access-Token' },
        { status: 401 }
      ),
    };
  }

  const { account, userId, error, revoked } = await validateAccessToken(token, mt5AccountId);
  
  if (error || !account || !userId) {
    return {
      userId: null,
      account: null,
      error: NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: revoked ? 403 : 401 }
      ),
    };
  }

  return { userId, account, error: null };
}

/**
 * Get or create account for user
 */
export async function getOrCreateAccount(userId: string, mt5AccountId: string, accountData?: any) {
  // Try to find existing account
  const { data: existingAccount } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('mt5_account_id', mt5AccountId)
    .single();

  if (existingAccount) {
    return { account: existingAccount, error: null };
  }

  // Create new account
  const { data: newAccount, error } = await supabaseAdmin
    .from('accounts')
    .insert({
      user_id: userId,
      mt5_account_id: mt5AccountId,
      broker: accountData?.broker || null,
      currency: accountData?.currency || 'USD',
      leverage: accountData?.leverage || null,
      balance: accountData?.balance || 0,
      equity: accountData?.equity || 0,
      is_active: true,
      last_sync_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { account: null, error: error.message };
  }

  return { account: newAccount, error: null };
}
