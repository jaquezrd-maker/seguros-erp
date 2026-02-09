import prisma from '../../config/database'
import {
  createDocument,
  addPage,
  addCompanyHeader,
  addFooter,
  addField,
  addSectionHeader,
  formatCurrency,
  formatDate,
  documentToBuffer,
  drawText,
  drawBoldText,
  COLORS,
} from '../../utils/pdf'

export async function generatePaymentReceiptPDF(paymentId: number): Promise<Buffer> {
  // Fetch payment data with related information
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      policy: {
        select: {
          id: true,
          policyNumber: true,
          status: true,
          premium: true,
          paymentMethod: true,
          insurer: { select: { name: true } },
          insuranceType: { select: { name: true } },
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          cedulaRnc: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      creator: {
        select: { id: true, name: true },
      },
    },
  })

  if (!payment) {
    throw new Error('Pago no encontrado')
  }

  // Create PDF document
  const doc = await createDocument()
  const page = await addPage(doc)
  const { width, height } = page.getSize()
  const margin = 50

  // Add company header
  let currentY = await addCompanyHeader(doc, page, 'Recibo Oficial de Pago')

  // Receipt number (prominent)
  currentY -= 10
  currentY = await drawBoldText(page, `Recibo No. ${payment.receiptNumber || payment.id}`, {
    x: width / 2 - 80,
    y: currentY,
    size: 14,
    color: COLORS.primary,
  })
  currentY -= 25

  // Payment Information Section
  currentY = await addSectionHeader(page, 'Información del Pago', currentY)

  currentY = await addField(page, 'Monto Pagado', formatCurrency(Number(payment.amount)), currentY, { bold: true })
  currentY = await addField(page, 'Fecha de Pago', formatDate(payment.paymentDate), currentY)
  currentY = await addField(page, 'Método de Pago', payment.paymentMethod || '—', currentY)
  currentY = await addField(page, 'Estado', payment.status, currentY)
  if (payment.dueDate) {
    currentY = await addField(page, 'Fecha de Vencimiento', formatDate(payment.dueDate), currentY)
  }

  // Policy Information Section
  currentY -= 10 // Extra spacing
  currentY = await addSectionHeader(page, 'Información de la Póliza', currentY)

  currentY = await addField(page, 'Número de Póliza', payment.policy?.policyNumber || '—', currentY)
  currentY = await addField(page, 'Aseguradora', payment.policy?.insurer?.name || '—', currentY)
  currentY = await addField(page, 'Tipo de Seguro', payment.policy?.insuranceType?.name || '—', currentY)
  currentY = await addField(page, 'Prima Total', formatCurrency(Number(payment.policy?.premium || 0)), currentY)

  // Client Information Section
  currentY -= 10 // Extra spacing
  currentY = await addSectionHeader(page, 'Información del Cliente', currentY)

  currentY = await addField(page, 'Nombre', payment.client?.name || '—', currentY)
  currentY = await addField(page, 'Cédula/RNC', payment.client?.cedulaRnc || '—', currentY)
  if (payment.client?.phone) {
    currentY = await addField(page, 'Teléfono', payment.client.phone, currentY)
  }
  if (payment.client?.email) {
    currentY = await addField(page, 'Correo Electrónico', payment.client.email, currentY)
  }
  if (payment.client?.address) {
    currentY = await addField(page, 'Dirección', payment.client.address, currentY)
  }

  // Notes Section
  if (payment.notes) {
    currentY -= 10 // Extra spacing
    currentY = await addSectionHeader(page, 'Notas', currentY)
    currentY = await drawText(page, payment.notes, {
      x: margin,
      y: currentY,
      size: 10,
      color: COLORS.text,
      maxWidth: width - margin * 2,
    })
    currentY -= 15
  }

  // Payment Summary Box
  currentY -= 20
  const boxWidth = width - margin * 2
  const boxHeight = 60

  // Draw summary box
  page.drawRectangle({
    x: margin,
    y: currentY - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
  })

  currentY -= 20
  await drawBoldText(page, 'Total Pagado:', {
    x: margin + 20,
    y: currentY,
    size: 11,
    color: COLORS.textLight,
  })

  await drawBoldText(page, formatCurrency(Number(payment.amount)), {
    x: margin + 150,
    y: currentY,
    size: 16,
    color: COLORS.primary,
  })

  currentY -= boxHeight + 10

  // Registered by
  if (payment.creator) {
    currentY -= 10
    currentY = await drawText(page, `Registrado por: ${payment.creator.name}`, {
      x: margin,
      y: currentY,
      size: 9,
      color: COLORS.textLight,
    })
  }

  // Footer disclaimer
  currentY -= 30
  currentY = await drawText(page, 'Este recibo es un documento oficial emitido por SeguroPro. Conserve este recibo como comprobante de pago.', {
    x: margin,
    y: currentY,
    size: 9,
    color: COLORS.textLight,
    maxWidth: width - margin * 2,
  })

  currentY = await drawText(page, `Emitido el: ${formatDate(new Date())}`, {
    x: width / 2 - 50,
    y: currentY - 10,
    size: 8,
    color: COLORS.textLight,
  })

  // Add footer
  await addFooter(doc, page, 1)

  // Convert to buffer
  return await documentToBuffer(doc)
}
