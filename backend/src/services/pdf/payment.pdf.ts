import prisma from '../../config/database'
import {
  createDocument,
  addCompanyHeader,
  addFooter,
  addField,
  addSectionHeader,
  formatCurrency,
  formatDate,
  documentToBuffer,
  addPageNumbers,
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
  const doc = createDocument()

  // Add company header
  addCompanyHeader(doc, 'Recibo Oficial de Pago')

  // Receipt number (prominent)
  doc.moveDown(0.5)
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#0d9488')
    .text(`Recibo No. ${payment.receiptNumber || payment.id}`, { align: 'center' })
  doc.moveDown(1)

  // Payment Information Section
  addSectionHeader(doc, 'Información del Pago')

  addField(doc, 'Monto Pagado', formatCurrency(Number(payment.amount)), { bold: true })
  addField(doc, 'Fecha de Pago', formatDate(payment.paymentDate))
  addField(doc, 'Método de Pago', payment.paymentMethod || '—')
  addField(doc, 'Estado', payment.status)
  if (payment.dueDate) {
    addField(doc, 'Fecha de Vencimiento', formatDate(payment.dueDate))
  }

  // Policy Information Section
  addSectionHeader(doc, 'Información de la Póliza')

  addField(doc, 'Número de Póliza', payment.policy?.policyNumber || '—')
  addField(doc, 'Aseguradora', payment.policy?.insurer?.name || '—')
  addField(doc, 'Tipo de Seguro', payment.policy?.insuranceType?.name || '—')
  addField(doc, 'Prima Total', formatCurrency(Number(payment.policy?.premium || 0)))

  // Client Information Section
  addSectionHeader(doc, 'Información del Cliente')

  addField(doc, 'Nombre', payment.client?.name || '—')
  addField(doc, 'Cédula/RNC', payment.client?.cedulaRnc || '—')
  if (payment.client?.phone) {
    addField(doc, 'Teléfono', payment.client.phone)
  }
  if (payment.client?.email) {
    addField(doc, 'Correo Electrónico', payment.client.email)
  }
  if (payment.client?.address) {
    addField(doc, 'Dirección', payment.client.address)
  }

  // Notes Section
  if (payment.notes) {
    addSectionHeader(doc, 'Notas')
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#1e293b')
      .text(payment.notes, { align: 'left' })
    doc.moveDown()
  }

  // Payment Summary Box
  doc.moveDown(1)
  const pageWidth = doc.page.width
  const leftMargin = 50
  const rightMargin = 50
  const boxWidth = pageWidth - leftMargin - rightMargin
  const boxHeight = 60

  // Draw summary box
  doc
    .rect(leftMargin, doc.y, boxWidth, boxHeight)
    .fillAndStroke('#f1f5f9', '#cbd5e1')

  const boxY = doc.y + 15
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#64748b')
    .text('Total Pagado:', leftMargin + 20, boxY, { continued: true })
    .fontSize(16)
    .fillColor('#0d9488')
    .text(`  ${formatCurrency(Number(payment.amount))}`, { align: 'left' })

  doc.y += boxHeight + 10

  // Registered by
  if (payment.creator) {
    doc.moveDown(1)
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`Registrado por: ${payment.creator.name}`, { align: 'left' })
  }

  // Footer disclaimer
  doc.moveDown(2)
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(
      'Este recibo es un documento oficial emitido por SeguroPro. Conserve este recibo como comprobante de pago.',
      { align: 'center' }
    )

  doc
    .fontSize(8)
    .text(`Emitido el: ${formatDate(new Date())}`, { align: 'center' })

  // Add page numbers to all pages
  addPageNumbers(doc)

  // Convert to buffer
  return documentToBuffer(doc)
}
