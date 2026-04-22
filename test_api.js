const url = 'https://rabzfzfmkrzabxhvbwwy.supabase.co/auth/v1/health';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYnpmemZta3J6YWJ4aHZid3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjk5NzcsImV4cCI6MjA4NTgwNTk3N30.0P7vh-MU4U14iSGPK1ZOqR55y8BWLC-D2BaT6d5LHcc';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.json().catch(() => ({}));
})
.then(data => {
  console.log('Data:', data);
})
.catch(e => {
  console.error('Fetch error:', e);
});
