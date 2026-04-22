import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Revoke by clearing the token or setting it to a special value
    // For now, we'll clear it and set is_active to false
    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({ 
        token: null,
        is_active: false 
      })
      .eq('id', accountId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Token revoked successfully' });
  } catch (err) {
    console.error('Revoke token error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
