import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: accounts, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch accounts error:', error);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    return NextResponse.json({ success: true, accounts });
  } catch (err) {
    console.error('Fetch accounts error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
    }

    // Verify ownership
    const { data: account, error: fetchError } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !account) {
      return NextResponse.json({ error: 'Account not found or unauthorized' }, { status: 404 });
    }

    // Deletion should cascade to trades. 
    // We also manually delete trade_events just in case the FK cascade isn't robust or to be thorough.
    
    // 1. Get all trade IDs for this account to clean up events
    const { data: trades } = await supabaseAdmin
      .from('trades')
      .select('id')
      .eq('account_id', accountId);

    const tradeIds = trades?.map(t => t.id) || [];

    if (tradeIds.length > 0) {
      await supabaseAdmin
        .from('trade_events')
        .delete()
        .in('trade_id', tradeIds);
    }

    // 2. Delete the account (trades will cascade if FK is set)
    const { error: deleteError } = await supabaseAdmin
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (deleteError) {
      console.error('Delete account error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account and associated data deleted' });
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
