require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('=== SMTP Configuration Test ===\n');

// Mostrar configuración (sin mostrar la contraseña completa)
console.log('Configuration:');
console.log(`  Host: ${process.env.SMTP_HOST}`);
console.log(`  Port: ${process.env.SMTP_PORT}`);
console.log(`  User: ${process.env.SMTP_USER}`);
console.log(`  Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'}`);
console.log(`  From: ${process.env.EMAIL_FROM}\n`);

// Crear transporter con la misma configuración que el proyecto
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1',
  },
  requireTLS: true,
  debug: true, // Mostrar logs detallados
  logger: true, // Logger habilitado
});

console.log('Testing SMTP connection...\n');

// Verificar la conexión
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } else {
    console.log('✅ Server is ready to take our messages\n');

    // Intentar enviar un email de prueba
    console.log('Sending test email...\n');

    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_FROM, // Enviar a la misma dirección
      subject: 'SMTP Test - SeguroPro',
      html: `
        <h2>SMTP Configuration Test</h2>
        <p>This is a test email sent from SeguroPro backend.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, your SMTP configuration is working correctly!</p>
      `,
    }, (error, info) => {
      if (error) {
        console.error('❌ Failed to send email:');
        console.error(error.message);
        console.error('\nFull error:', error);
        process.exit(1);
      } else {
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        console.log('\n✅ SMTP configuration is working correctly!');
        process.exit(0);
      }
    });
  }
});
