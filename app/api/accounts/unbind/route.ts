
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
    }

    // Verify ownership
    const { data: account, error: fetchError } = await supabaseAdmin
      .from('accounts')
      .select('id, user_id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !account) {
      return NextResponse.json({ error: 'Account not found or unauthorized' }, { status: 404 });
    }

    // Clear the binding
    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({ mt5_account_id: null })
      .eq('id', accountId);

    if (updateError) {
      console.error('Unbind account error:', updateError);
      return NextResponse.json({ error: 'Failed to unbind account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Terminal unbinded successfully' });
  } catch (err) {
    console.error('Unbind account error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
