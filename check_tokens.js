const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rabzfzfmkrzabxhvbwwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYnpmenpta3J6YWJ4aHZid3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY5NDczMywiZXhwIjoyMDU0MjcwNzMzfQ.Ks1Ky8YGYVPjWGwWPRKwJjOjCNDMqhPqpQqMQNBVJfY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTokens() {
  const { data, error } = await supabase
    .from('access_tokens')
    .select('*');
  
  if (error) {
    console.error('Error fetching tokens:', error);
    return;
  }
  
  console.log('Access Tokens found:', data.length);
  data.forEach(t => {
    console.log(`- Name: ${t.name}, Token: ${t.token}, Expires: ${t.expires_at}`);
  });
}

checkTokens();
