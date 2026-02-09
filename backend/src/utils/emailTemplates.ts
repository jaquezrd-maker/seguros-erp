import { formatCurrency, formatDate } from './pdf'

interface EmailTemplate {
  subject: string
  html: string
}

// Base HTML structure with company branding
function createEmailTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #0d9488;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .info-box {
      background-color: #f1f5f9;
      border-left: 4px solid #0d9488;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #0d9488;
    }
    .alert-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .alert-box.danger {
      background-color: #fee2e2;
      border-left-color: #ef4444;
    }
    .alert-box.success {
      background-color: #d1fae5;
      border-left-color: #10b981;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0d9488;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 15px 0;
    }
    .button:hover {
      background-color: #0f766e;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #0d9488;
      text-decoration: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    table th {
      background-color: #0d9488;
      color: #ffffff;
      padding: 10px;
      text-align: left;
      font-size: 14px;
    }
    table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    table tr:last-child td {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SeguroPro</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>
        <strong>SeguroPro - Corredora de Seguros</strong><br>
        Santo Domingo, República Dominicana<br>
        Este es un correo automático, por favor no responder.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Policy Expired Reminder
export function policyExpiredEmail(data: {
  clientName: string
  policyNumber: string
  endDate: string
  insurerName: string
  insuranceType: string
  premium: number
}): EmailTemplate {
  const content = `
    <h2>⚠️ Póliza Vencida</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Le informamos que su póliza ha vencido y requiere renovación inmediata para mantener su cobertura.</p>

    <div class="alert-box danger">
      <strong>⚠️ Atención:</strong> Su póliza está actualmente vencida. No cuenta con cobertura en este momento.
    </div>

    <div class="info-box">
      <table>
        <tr>
          <td><strong>Número de Póliza:</strong></td>
          <td>${data.policyNumber}</td>
        </tr>
        <tr>
          <td><strong>Aseguradora:</strong></td>
          <td>${data.insurerName}</td>
        </tr>
        <tr>
          <td><strong>Tipo de Seguro:</strong></td>
          <td>${data.insuranceType}</td>
        </tr>
        <tr>
          <td><strong>Fecha de Vencimiento:</strong></td>
          <td>${formatDate(data.endDate)}</td>
        </tr>
        <tr>
          <td><strong>Prima:</strong></td>
          <td>${formatCurrency(data.premium)}</td>
        </tr>
      </table>
    </div>

    <p>Para renovar su póliza y restablecer su cobertura, por favor contacte con nosotros a la mayor brevedad posible.</p>

    <p>Si desea discutir opciones de renovación o tiene alguna pregunta, no dude en comunicarse con nosotros.</p>

    <p>Saludos cordiales,<br><strong>Equipo SeguroPro</strong></p>
  `

  return {
    subject: `⚠️ Póliza Vencida - ${data.policyNumber}`,
    html: createEmailTemplate('Póliza Vencida', content),
  }
}

// Policy Expiring Soon Reminder
export function policyExpiringSoonEmail(data: {
  clientName: string
  policyNumber: string
  endDate: string
  daysLeft: number
  insurerName: string
  insuranceType: string
  premium: number
}): EmailTemplate {
  const content = `
    <h2>⏰ Póliza Próxima a Vencer</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Le recordamos que su póliza está próxima a vencer en <strong>${data.daysLeft} días</strong>.</p>

    <div class="alert-box">
      <strong>📅 Recordatorio:</strong> Su póliza vence el ${formatDate(data.endDate)}. Le recomendamos renovar con anticipación para evitar interrupciones en su cobertura.
    </div>

    <div class="info-box">
      <table>
        <tr>
          <td><strong>Número de Póliza:</strong></td>
          <td>${data.policyNumber}</td>
        </tr>
        <tr>
          <td><strong>Aseguradora:</strong></td>
          <td>${data.insurerName}</td>
        </tr>
        <tr>
          <td><strong>Tipo de Seguro:</strong></td>
          <td>${data.insuranceType}</td>
        </tr>
        <tr>
          <td><strong>Fecha de Vencimiento:</strong></td>
          <td>${formatDate(data.endDate)}</td>
        </tr>
        <tr>
          <td><strong>Prima Actual:</strong></td>
          <td>${formatCurrency(data.premium)}</td>
        </tr>
      </table>
    </div>

    <p>Para proceder con la renovación de su póliza, por favor contacte con nosotros. Estaremos encantados de ayudarle a mantener su cobertura sin interrupciones.</p>

    <p>Saludos cordiales,<br><strong>Equipo SeguroPro</strong></p>
  `

  return {
    subject: `⏰ Póliza Próxima a Vencer - ${data.policyNumber} (${data.daysLeft} días)`,
    html: createEmailTemplate('Póliza Próxima a Vencer', content),
  }
}

// Payment Confirmation
export function paymentConfirmationEmail(data: {
  clientName: string
  policyNumber: string
  amount: number
  paymentDate: string
  paymentMethod: string
  receiptNumber?: string
  remainingBalance?: number
}): EmailTemplate {
  const content = `
    <h2>✅ Confirmación de Pago Recibido</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Hemos recibido su pago correspondiente a la póliza <strong>${data.policyNumber}</strong>.</p>

    <div class="alert-box success">
      <strong>✅ Pago Confirmado:</strong> Su pago ha sido procesado exitosamente.
    </div>

    <div class="info-box">
      <table>
        <tr>
          <td><strong>Número de Póliza:</strong></td>
          <td>${data.policyNumber}</td>
        </tr>
        <tr>
          <td><strong>Monto Pagado:</strong></td>
          <td>${formatCurrency(data.amount)}</td>
        </tr>
        <tr>
          <td><strong>Fecha de Pago:</strong></td>
          <td>${formatDate(data.paymentDate)}</td>
        </tr>
        <tr>
          <td><strong>Método de Pago:</strong></td>
          <td>${data.paymentMethod}</td>
        </tr>
        ${data.receiptNumber ? `
        <tr>
          <td><strong>Número de Recibo:</strong></td>
          <td>${data.receiptNumber}</td>
        </tr>
        ` : ''}
        ${data.remainingBalance !== undefined && data.remainingBalance > 0 ? `
        <tr>
          <td><strong>Saldo Pendiente:</strong></td>
          <td>${formatCurrency(data.remainingBalance)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${data.remainingBalance !== undefined && data.remainingBalance > 0 ? `
    <p><strong>Nota:</strong> Aún tiene un saldo pendiente de ${formatCurrency(data.remainingBalance)} en esta póliza.</p>
    ` : '<p>Su póliza está al día. Gracias por su puntualidad.</p>'}

    <p>Si tiene alguna pregunta sobre este pago o necesita una copia de su recibo, no dude en contactarnos.</p>

    <p>Saludos cordiales,<br><strong>Equipo SeguroPro</strong></p>
  `

  return {
    subject: `✅ Pago Recibido - ${data.policyNumber} - ${formatCurrency(data.amount)}`,
    html: createEmailTemplate('Confirmación de Pago', content),
  }
}

// Payment Reminder
export function paymentReminderEmail(data: {
  clientName: string
  policyNumber: string
  amount: number
  dueDate: string
  daysOverdue: number
  policyStatus: string
}): EmailTemplate {
  const isOverdue = data.daysOverdue > 0

  const content = `
    <h2>${isOverdue ? '⚠️ Pago Vencido' : '📅 Recordatorio de Pago'}</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>${
      isOverdue
        ? `Le informamos que tiene un pago vencido hace <strong>${data.daysOverdue} días</strong> correspondiente a su póliza.`
        : 'Le recordamos que tiene un pago pendiente próximo a vencer.'
    }</p>

    <div class="alert-box ${isOverdue ? 'danger' : ''}">
      <strong>${isOverdue ? '⚠️ Pago Vencido:' : '📅 Pago Pendiente:'}</strong> ${
    isOverdue
      ? `Su pago venció el ${formatDate(data.dueDate)}.`
      : `Su pago vence el ${formatDate(data.dueDate)}.`
  }
    </div>

    <div class="info-box">
      <table>
        <tr>
          <td><strong>Número de Póliza:</strong></td>
          <td>${data.policyNumber}</td>
        </tr>
        <tr>
          <td><strong>Monto a Pagar:</strong></td>
          <td>${formatCurrency(data.amount)}</td>
        </tr>
        <tr>
          <td><strong>Fecha de Vencimiento:</strong></td>
          <td>${formatDate(data.dueDate)}</td>
        </tr>
        ${
          isOverdue
            ? `
        <tr>
          <td><strong>Días de Atraso:</strong></td>
          <td>${data.daysOverdue} días</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    ${
      isOverdue
        ? '<p><strong>Importante:</strong> El retraso en sus pagos puede afectar su cobertura. Le solicitamos regularizar su situación a la mayor brevedad.</p>'
        : '<p>Para mantener su póliza al día y evitar interrupciones en su cobertura, le recomendamos realizar el pago antes de la fecha de vencimiento.</p>'
    }

    <p>Si ya realizó el pago, por favor ignore este mensaje. Si tiene alguna dificultad para realizar el pago o necesita un plan de pago, contacte con nosotros.</p>

    <p>Saludos cordiales,<br><strong>Equipo SeguroPro</strong></p>
  `

  return {
    subject: `${isOverdue ? '⚠️ Pago Vencido' : '📅 Recordatorio de Pago'} - ${data.policyNumber}`,
    html: createEmailTemplate(isOverdue ? 'Pago Vencido' : 'Recordatorio de Pago', content),
  }
}

// Claim Update
export function claimUpdateEmail(data: {
  clientName: string
  claimNumber: string
  policyNumber: string
  status: string
  estimatedAmount?: number
  approvedAmount?: number
  message?: string
}): EmailTemplate {
  const statusMap: Record<string, string> = {
    PENDIENTE: '🕐 Pendiente',
    EN_PROCESO: '⚙️ En Proceso',
    EN_REVISION: '🔍 En Revisión',
    APROBADO: '✅ Aprobado',
    RECHAZADO: '❌ Rechazado',
    PAGADO: '💰 Pagado',
  }

  const content = `
    <h2>📋 Actualización de Siniestro</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Tenemos una actualización sobre su siniestro.</p>

    <div class="info-box">
      <table>
        <tr>
          <td><strong>Número de Siniestro:</strong></td>
          <td>${data.claimNumber}</td>
        </tr>
        <tr>
          <td><strong>Número de Póliza:</strong></td>
          <td>${data.policyNumber}</td>
        </tr>
        <tr>
          <td><strong>Estado:</strong></td>
          <td>${statusMap[data.status] || data.status}</td>
        </tr>
        ${
          data.estimatedAmount
            ? `
        <tr>
          <td><strong>Monto Estimado:</strong></td>
          <td>${formatCurrency(data.estimatedAmount)}</td>
        </tr>
        `
            : ''
        }
        ${
          data.approvedAmount
            ? `
        <tr>
          <td><strong>Monto Aprobado:</strong></td>
          <td>${formatCurrency(data.approvedAmount)}</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    ${data.message ? `<p>${data.message}</p>` : ''}

    <p>Si tiene alguna pregunta sobre el estado de su siniestro, no dude en contactarnos.</p>

    <p>Saludos cordiales,<br><strong>Equipo SeguroPro</strong></p>
  `

  return {
    subject: `📋 Actualización de Siniestro - ${data.claimNumber} - ${statusMap[data.status] || data.status}`,
    html: createEmailTemplate('Actualización de Siniestro', content),
  }
}

// Renewal Notice
export function renewalNoticeEmail(data: {
  clientName: string
  policyNumber: string
  originalEndDate: string
  newEndDate?: string
  newPremium?: number
  currentPremium: number
  insurerName: string
  insuranceType: string
  status: string
}): EmailTemplate {
  const statusMap: Record<string, string> = {
    PENDIENTE: '⏳ Pendiente de Procesamiento',
    PROCESADA: '✅ Renovación Procesada',
    RECHAZADA: '❌ Renovación Rechazada',
    VENCIDA: '⚠️ Renovación Vencida',
  }

  const isProcessed = data.status === 'PROCESADA'

  const content = `
    <h2>${isProcessed ? '✅' : '📋'} Aviso de Renovación de Póliza</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>${
      isProcessed
        ? 'Su póliza ha sido renovada exitosamente.'
        : 'Le informamos sobre el proceso de renovación de su póliza.'
    }</p>

    <div class="alert-box ${isProcessed ? 'success' : ''}">
      <strong>${statusMap[data.status] || data.status}</strong>
    </div>

    <div class="info-box">
      <table>
        <tr>
          <td><strong>Número de Póliza:</strong></td>
          <td>${data.policyNumber}</td>
        </tr>
        <tr>
          <td><strong>Aseguradora:</strong></td>
          <td>${data.insurerName}</td>
        </tr>
        <tr>
          <td><strong>Tipo de Seguro:</strong></td>
          <td>${data.insuranceType}</td>
        </tr>
        <tr>
          <td><strong>Vencimiento Original:</strong></td>
          <td>${formatDate(data.originalEndDate)}</td>
        </tr>
        ${
          data.newEndDate
            ? `
        <tr>
          <td><strong>Nuevo Vencimiento:</strong></td>
          <td>${formatDate(data.newEndDate)}</td>
        </tr>
        `
            : ''
        }
        <tr>
          <td><strong>Prima ${isProcessed ? 'Anterior' : 'Actual'}:</strong></td>
          <td>${formatCurrency(data.currentPremium)}</td>
        </tr>
        ${
          data.newPremium
            ? `
        <tr>
          <td><strong>Nueva Prima:</strong></td>
          <td>${formatCurrency(data.newPremium)}</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    ${
      isProcessed
        ? '<p>Su cobertura continúa sin interrupciones. Gracias por confiar en nosotros.</p>'
        : '<p>Para cualquier consulta sobre el proceso de renovación, no dude en contactarnos.</p>'
    }

    <p>Saludos cordiales,<br><strong>Equipo SeguroPro</strong></p>
  `

  return {
    subject: `${isProcessed ? '✅' : '📋'} Renovación de Póliza - ${data.policyNumber}`,
    html: createEmailTemplate('Aviso de Renovación', content),
  }
}

// Generic notification email
export function genericNotificationEmail(data: {
  recipientName: string
  subject: string
  title: string
  message: string
  alertType?: 'info' | 'warning' | 'success' | 'danger'
}): EmailTemplate {
  const content = `
    <h2>${data.title}</h2>
    <p>Estimado/a <strong>${data.recipientName}</strong>,</p>

    <div class="alert-box ${data.alertType || ''}">
      ${data.message}
    </div>

    <p>Saludos cordiales,<br><strong>Equipo SeguroPro</strong></p>
  `

  return {
    subject: data.subject,
    html: createEmailTemplate(data.title, content),
  }
}
