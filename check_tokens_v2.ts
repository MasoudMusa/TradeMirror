import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTokens() {
  console.log('Fetching tokens from accounts table...');
  const { data, error } = await supabase
    .from('accounts')
    .select('id, mt5_account_id, token')
    .limit(10);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No accounts found.');
    return;
  }

  data.forEach(account => {
    console.log(`Account ID: ${account.id}`);
    console.log(`MT5 ID: ${account.mt5_account_id}`);
    console.log(`Token: ${account.token ? (account.token.substring(0, 8) + '...') : 'NULL'}`);
    if (account.token && !account.token.startsWith('tmk_')) {
      console.warn('⚠️ WARNING: Token does NOT start with tmk_');
    } else if (account.token) {
      console.log('✅ Token format is correct (starts with tmk_)');
    }
    console.log('---');
  });
}

checkTokens();
