const jwt = process.argv[2];
if (!jwt) {
  console.error('No JWT provided');
  process.exit(1);
}
const parts = jwt.split('.');
if (parts.length !== 3) {
  console.error('Invalid JWT format');
  process.exit(1);
}
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
console.log(JSON.stringify(payload, null, 2));
