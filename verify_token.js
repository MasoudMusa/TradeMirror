require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkToken() {
  const tokenToCheck = 'tmk_ae9f59c19285d01b39192fac88c4b060997c15581e4a83fa';
  
  console.log('Checking for token:', tokenToCheck);
  console.log('');
  
  // Check if token exists
  const { data, error } = await supabase
    .from('access_tokens')
    .select('*')
    .eq('token', tokenToCheck)
    .single();
  
  if (error) {
    console.error('❌ Token NOT found in database!');
    console.error('Error:', error.message);
    console.log('');
    
    // List all tokens
    const { data: allTokens } = await supabase
      .from('access_tokens')
      .select('*');
    
    console.log(`Found ${allTokens?.length || 0} tokens in database:`);
    allTokens?.forEach(t => {
      console.log(`  - ${t.name}: ${t.token.substring(0, 20)}...`);
    });
    
    return;
  }
  
  console.log('✅ Token found!');
  console.log('Token details:');
  console.log(`  - ID: ${data.id}`);
  console.log(`  - Name: ${data.name}`);
  console.log(`  - User ID: ${data.user_id}`);
  console.log(`  - Expires: ${data.expires_at || 'Never'}`);
  console.log(`  - Last used: ${data.last_used_at || 'Never'}`);
}

checkToken();
