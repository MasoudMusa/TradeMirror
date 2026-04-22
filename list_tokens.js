require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTokens() {
  console.log('Fetching all tokens from database...\n');
  
  const { data, error } = await supabase
    .from('access_tokens')
    .select('*');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log(`Found ${data.length} token(s):\n`);
  
  data.forEach((token, index) => {
    console.log(`Token #${index + 1}:`);
    console.log(`  Name: ${token.name}`);
    console.log(`  Token: ${token.token}`);
    console.log(`  User ID: ${token.user_id}`);
    console.log(`  Created: ${token.created_at}`);
    console.log(`  Expires: ${token.expires_at || 'Never'}`);
    console.log(`  Last used: ${token.last_used_at || 'Never'}`);
    console.log('');
  });
  
  console.log('\n=== EA Configuration ===');
  console.log('EA is configured with token: tmk_ae9f59c19285d01b39192fac88c4b060997c15581e4a83fa');
  console.log('\nDoes it match? Check the token values above.');
}

listAllTokens();
