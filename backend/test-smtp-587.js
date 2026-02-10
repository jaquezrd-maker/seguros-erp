require('dotenv').config();
const nodemailer = require('nodemailer');

const configurations = [
  {
    name: 'Port 587 STARTTLS - c1351936.ferozo.com + info@dopek.net',
    host: 'c1351936.ferozo.com',
    port: 587,
    secure: false, // STARTTLS
    user: 'info@dopek.net',
  },
  {
    name: 'Port 587 STARTTLS - mail.dopek.net + info@dopek.net',
    host: 'mail.dopek.net',
    port: 587,
    secure: false,
    user: 'info@dopek.net',
  },
  {
    name: 'Port 25 - c1351936.ferozo.com + info@dopek.net',
    host: 'c1351936.ferozo.com',
    port: 25,
    secure: false,
    user: 'info@dopek.net',
  },
];

async function testConfig(config) {
  console.log(`\nTesting: ${config.name}`);
  console.log(`  Host: ${config.host}:${config.port}`);
  console.log(`  Secure: ${config.secure}`);
  console.log(`  User: ${config.user}`);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return new Promise((resolve) => {
    transporter.verify(function (error) {
      if (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        resolve(false);
      } else {
        console.log(`✅ SUCCESS!\n`);
        console.log('Working configuration:');
        console.log(`  SMTP_HOST="${config.host}"`);
        console.log(`  SMTP_PORT=${config.port}`);
        console.log(`  SMTP_USER="${config.user}"`);
        resolve(true);
      }
    });
  });
}

async function testAll() {
  console.log('=== Testing Alternative SMTP Configurations ===\n');

  for (const config of configurations) {
    const success = await testConfig(config);
    if (success) {
      console.log('\n✅ Found working configuration!');
      process.exit(0);
    }
  }

  console.log('\n❌ All configurations failed.');
  console.log('\n⚠️  Next steps:');
  console.log('1. Check Ferozo panel for "Enable SMTP Authentication" or similar setting');
  console.log('2. Verify your IP is not blocked (check with Ferozo support)');
  console.log('3. Try accessing from Vercel (different IP) - it may work there');
  process.exit(1);
}

testAll();
