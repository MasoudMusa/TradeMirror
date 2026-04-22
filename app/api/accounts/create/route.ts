
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Get authorization header for user validation (standard Supabase Auth)
    // We expect the frontend to call this with a user JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // Verify user JWT
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({})); // Handle empty body
    const name = body.name || 'Pending Sync...';

    // Generate unique token
    const token = 'tmk_' + randomBytes(32).toString('hex');

    // Create the account
    const { data: account, error } = await supabaseAdmin
        .from('accounts')
        .insert({
            user_id: user.id,
            name: name,
            token: token,
            is_active: true,
            // Only set basic fields, others will be populated by EA sync
        })
        .select()
        .single();

    if (error) {
        console.error('Create account error:', error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, account });
  } catch (err) {
    console.error('Account creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
