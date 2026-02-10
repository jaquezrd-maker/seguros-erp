require('dotenv').config();

console.log('=== Environment Variables Check ===\n');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS); // Mostrar completa para debug
console.log('SMTP_PASS length:', process.env.SMTP_PASS?.length);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('\nSMTP_PASS characters:');
if (process.env.SMTP_PASS) {
  process.env.SMTP_PASS.split('').forEach((char, i) => {
    console.log(`  [${i}] '${char}' (code: ${char.charCodeAt(0)})`);
  });
}
