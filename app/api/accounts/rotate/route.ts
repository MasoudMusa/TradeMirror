import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
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

    const { accountId } = await request.json();
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
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Generate new token
    const newToken = 'tmk_' + randomBytes(32).toString('hex');

    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({ token: newToken })
      .eq('id', accountId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to rotate token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, token: newToken });
  } catch (err) {
    console.error('Rotate token error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
