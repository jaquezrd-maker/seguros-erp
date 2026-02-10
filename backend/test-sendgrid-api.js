require('dotenv').config();

// Import the compiled email module
const { sendEmail, EMAIL_FROM } = require('./dist/config/email');

console.log('=== SendGrid API Test ===\n');
console.log('Configuration:');
console.log(`  API Key: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-10) : 'NOT SET'}`);
console.log(`  From: ${EMAIL_FROM}\n`);

console.log('Sending test email via SendGrid API...\n');

sendEmail({
  to: EMAIL_FROM,
  subject: 'SendGrid API Test - SeguroPro',
  html: `
    <h2>SendGrid API Configuration Test</h2>
    <p>This is a test email sent using SendGrid Web API (not SMTP).</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <p>If you received this email, your SendGrid API configuration is working correctly!</p>
    <p><strong>Benefits of API over SMTP:</strong></p>
    <ul>
      <li>Works perfectly with serverless platforms like Vercel</li>
      <li>No DNS/firewall issues</li>
      <li>Faster delivery</li>
      <li>Better error handling</li>
    </ul>
  `,
})
  .then((response) => {
    console.log('✅ Email sent successfully via SendGrid API!');
    console.log('Response status:', response[0].statusCode);
    console.log('Message ID:', response[0].headers['x-message-id']);
    console.log('\n✅ SendGrid API configuration is working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to send email:');
    console.error(error.message);
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
    }
    process.exit(1);
  });
