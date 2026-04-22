const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rabzfzfmkrzabxhvbwwy:6JmKx%21mT%21dkYebx@54.247.26.119:6543/postgres?pgbouncer=true';

async function checkTokens() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');
    
    const res = await client.query('SELECT * FROM access_tokens');
    console.log('Access Tokens found:', res.rows.length);
    res.rows.forEach(t => {
      console.log(`- ID: ${t.id}, Name: ${t.name}, Token: ${t.token}, Expires: ${t.expires_at}`);
    });
  } catch (err) {
    console.error('Database Error:', err);
  } finally {
    await client.end();
  }
}

checkTokens();
