
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking table structures...\n');

  // Check accounts table columns by selecting one row (if exists) or using error message to infer?
  // Easier to just "select *" limit 1 and print keys
  
  const { data: accounts, error: accountError } = await supabase.from('accounts').select('*').limit(1);
  if (accountError) console.error('Accounts error:', accountError);
  else if (accounts.length > 0) console.log('Accounts Keys:', Object.keys(accounts[0]));
  else console.log('Accounts table empty, cannot infer keys easily via JS client');

  const { data: tokens, error: tokenError } = await supabase.from('access_tokens').select('*').limit(1);
   if (tokenError) console.error('Tokens error:', tokenError);
  else if (tokens.length > 0) console.log('Access Tokens Keys:', Object.keys(tokens[0]));
  else console.log('Access Tokens table empty');
}

checkSchema();
