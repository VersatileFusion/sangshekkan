// Quick local helper to verify an argon2 hash against a password
// Usage: node scripts/verify-hash.js "<hash>" "<password>"
import argon2 from 'argon2';

async function main() {
  const [,, hash, pass] = process.argv;
  if (!hash || !pass) {
    console.error('Usage: node scripts/verify-hash.js "<hash>" "<password>"');
    process.exit(2);
  }
  try {
    const ok = await argon2.verify(hash, pass);
    console.log('VERIFY', ok ? 'OK' : 'FAIL');
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error('ERROR', e?.message || e);
    process.exit(3);
  }
}

main();


