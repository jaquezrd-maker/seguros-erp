require('dotenv').config();
const nodemailer = require('nodemailer');

const configurations = [
  {
    name: 'Config 1: mail.dopek.net + info',
    host: 'mail.dopek.net',
    port: 465,
    user: 'info',
  },
  {
    name: 'Config 2: mail.dopek.net + info@dopek.net',
    host: 'mail.dopek.net',
    port: 465,
    user: 'info@dopek.net',
  },
  {
    name: 'Config 3: c1351936.ferozo.com + info',
    host: 'c1351936.ferozo.com',
    port: 465,
    user: 'info',
  },
  {
    name: 'Config 4: c1351936.ferozo.com + info@dopek.net',
    host: 'c1351936.ferozo.com',
    port: 465,
    user: 'info@dopek.net',
  },
];

async function testConfig(config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${config.name}`);
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`${'='.repeat(60)}\n`);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: true,
    auth: {
      user: config.user,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1',
    },
    requireTLS: true,
    debug: false, // Menos verbose
    logger: false,
  });

  return new Promise((resolve) => {
    transporter.verify(function (error) {
      if (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        resolve(false);
      } else {
        console.log(`✅ SUCCESS! This configuration works!\n`);
        console.log('Use these settings:');
        console.log(`  SMTP_HOST="${config.host}"`);
        console.log(`  SMTP_PORT=${config.port}`);
        console.log(`  SMTP_USER="${config.user}"`);
        resolve(true);
      }
    });
  });
}

async function testAll() {
  console.log('=== Testing Multiple SMTP Configurations ===');
  console.log(`Password: ${process.env.SMTP_PASS}\n`);

  for (const config of configurations) {
    const success = await testConfig(config);
    if (success) {
      console.log('\n✅ Found working configuration! Test completed.');
      process.exit(0);
    }
  }

  console.log('\n❌ None of the configurations worked.');
  console.log('\nPossible issues:');
  console.log('1. Password may be incorrect - verify in Ferozo control panel');
  console.log('2. Account may require different authentication method');
  console.log('3. IP may be blocked - check with hosting provider');
  process.exit(1);
}

testAll();
