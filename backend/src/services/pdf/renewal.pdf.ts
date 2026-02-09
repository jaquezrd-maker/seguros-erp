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

export async function generateRenewalNoticePDF(renewalId: number): Promise<Buffer> {
  // Fetch renewal data with all related information
  const renewal = await prisma.renewal.findUnique({
    where: { id: renewalId },
    include: {
      policy: {
        select: {
          id: true,
          policyNumber: true,
          status: true,
          premium: true,
          startDate: true,
          endDate: true,
          autoRenew: true,
          client: {
            select: {
              id: true,
              name: true,
              cedulaRnc: true,
              email: true,
              phone: true,
            },
          },
          insurer: {
            select: {
              id: true,
              name: true,
              rnc: true,
            },
          },
          insuranceType: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
      processor: {
        select: { id: true, name: true },
      },
    },
  })

  if (!renewal) {
    throw new Error('Renovación no encontrada')
  }

  // Create PDF document
  const doc = createDocument()

  // Add company header
  addCompanyHeader(doc, 'Aviso de Renovación de Póliza')

  // Status indicator
  doc.moveDown(0.5)

  const statusColorMap: Record<string, string> = {
    PENDIENTE: '#f59e0b',
    PROCESADA: '#10b981',
    RECHAZADA: '#ef4444',
    VENCIDA: '#64748b',
  }

  const statusTextMap: Record<string, string> = {
    PENDIENTE: '⏳ Renovación Pendiente',
    PROCESADA: '✅ Renovación Procesada',
    RECHAZADA: '❌ Renovación Rechazada',
    VENCIDA: '⚠️ Renovación Vencida',
  }

  const statusColor = statusColorMap[renewal.status] || '#64748b'
  const statusText = statusTextMap[renewal.status] || renewal.status

  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(statusColor)
    .text(statusText, { align: 'center' })
  doc.moveDown(1)

  // Policy Information Section
  addSectionHeader(doc, 'Información de la Póliza')

  addField(doc, 'Número de Póliza', renewal.policy?.policyNumber || '—')
  addField(doc, 'Aseguradora', renewal.policy?.insurer?.name || '—')
  addField(doc, 'Tipo de Seguro', renewal.policy?.insuranceType?.name || '—')
  if (renewal.policy?.insuranceType?.category) {
    addField(doc, 'Categoría', renewal.policy.insuranceType.category)
  }

  // Renewal Information Section
  addSectionHeader(doc, 'Detalles de la Renovación')

  addField(doc, 'Fecha de Vencimiento Original', formatDate(renewal.originalEndDate))

  if (renewal.newEndDate) {
    addField(doc, 'Nueva Fecha de Vencimiento', formatDate(renewal.newEndDate), { bold: true })
  }

  addField(doc, 'Prima Anterior', formatCurrency(Number(renewal.policy?.premium || 0)))

  if (renewal.newPremium) {
    addField(doc, 'Nueva Prima', formatCurrency(Number(renewal.newPremium)), { bold: true })

    // Calculate and show difference
    const difference = Number(renewal.newPremium) - Number(renewal.policy?.premium || 0)
    const differenceText =
      difference > 0
        ? `+${formatCurrency(difference)} (aumento)`
        : difference < 0
        ? `${formatCurrency(difference)} (disminución)`
        : 'Sin cambios'

    addField(doc, 'Diferencia', differenceText)
  }

  addField(doc, 'Estado', renewal.status)

  if (renewal.processedBy && renewal.processor) {
    addField(doc, 'Procesado por', renewal.processor.name)
  }

  // Client Information Section
  addSectionHeader(doc, 'Información del Asegurado')

  addField(doc, 'Nombre', renewal.policy?.client?.name || '—')
  addField(doc, 'Cédula/RNC', renewal.policy?.client?.cedulaRnc || '—')
  if (renewal.policy?.client?.phone) {
    addField(doc, 'Teléfono', renewal.policy.client.phone)
  }
  if (renewal.policy?.client?.email) {
    addField(doc, 'Correo Electrónico', renewal.policy.client.email)
  }

  // Renewal Summary Box
  doc.moveDown(1)
  const pageWidth = doc.page.width
  const leftMargin = 50
  const rightMargin = 50
  const boxWidth = pageWidth - leftMargin - rightMargin
  const boxHeight = renewal.status === 'PROCESADA' ? 100 : 80

  // Draw summary box
  const boxColor = renewal.status === 'PROCESADA' ? '#d1fae5' : '#f1f5f9'
  const borderColor = renewal.status === 'PROCESADA' ? '#10b981' : '#cbd5e1'
  doc.rect(leftMargin, doc.y, boxWidth, boxHeight).fillAndStroke(boxColor, borderColor)

  const boxY = doc.y + 15

  if (renewal.status === 'PROCESADA') {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#059669')
      .text('✅ Renovación Completada', leftMargin + 20, boxY)

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#064e3b')
      .text('Su póliza ha sido renovada exitosamente.', leftMargin + 20, boxY + 25)

    if (renewal.newEndDate) {
      doc
        .fontSize(9)
        .fillColor('#065f46')
        .text(
          `Nueva vigencia hasta: ${formatDate(renewal.newEndDate)}`,
          leftMargin + 20,
          boxY + 45
        )
    }

    if (renewal.newPremium) {
      doc
        .fontSize(9)
        .text(`Nueva prima: ${formatCurrency(Number(renewal.newPremium))}`, leftMargin + 20, boxY + 60)
    }
  } else if (renewal.status === 'PENDIENTE') {
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#f59e0b')
      .text('⏳ Renovación en Proceso', leftMargin + 20, boxY)

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#92400e')
      .text(
        'Esta renovación está pendiente de procesamiento.',
        leftMargin + 20,
        boxY + 25
      )

    doc
      .fontSize(9)
      .text(
        'Nos comunicaremos con usted para confirmar los detalles.',
        leftMargin + 20,
        boxY + 45
      )
  } else if (renewal.status === 'RECHAZADA') {
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#ef4444')
      .text('❌ Renovación Rechazada', leftMargin + 20, boxY)

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#7f1d1d')
      .text(
        'Esta renovación no pudo ser procesada.',
        leftMargin + 20,
        boxY + 25
      )

    doc
      .fontSize(9)
      .text('Contacte con nosotros para más detalles.', leftMargin + 20, boxY + 45)
  } else {
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#64748b')
      .text('⚠️ Renovación Vencida', leftMargin + 20, boxY)

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#334155')
      .text('Esta renovación ha expirado sin ser procesada.', leftMargin + 20, boxY + 25)
  }

  doc.y += boxHeight + 10

  // Contact Information
  doc.moveDown(1)
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(
      'Para consultas sobre la renovación de su póliza, contacte con su ejecutivo de seguros.',
      { align: 'center' }
    )

  // Footer disclaimer
  doc.moveDown(1)
  doc
    .fontSize(9)
    .fillColor('#64748b')
    .text(
      'Este documento es un aviso oficial de renovación emitido por SeguroPro.',
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
