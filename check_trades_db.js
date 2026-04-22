require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrades() {
  console.log('Checking trades in database...\n');
  
  // count trades
  const { count, error: countError } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Error counting trades:', countError);
    return;
  }
  
  console.log(`Total trades in DB: ${count}`);
  
  if (count > 0) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .limit(5);
      
    if (error) {
       console.error('Error fetching trades:', error);
    } else {
       console.log('Sample trades:', data);
    }
  } else {
      console.log('No trades found. Checking if any accounts exist...');
       const { data: accounts } = await supabase.from('accounts').select('*');
       console.log('Accounts:', accounts);
  }
}

checkTrades();
