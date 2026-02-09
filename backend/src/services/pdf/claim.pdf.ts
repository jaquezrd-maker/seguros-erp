import prisma from '../../config/database'
import {
  createDocument,
  addCompanyHeader,
  addFooter,
  addField,
  addSectionHeader,
  buildTable,
  formatCurrency,
  formatDate,
  documentToBuffer,
  addPageNumbers,
} from '../../utils/pdf'

export async function generateClaimReportPDF(claimId: number): Promise<Buffer> {
  // Fetch claim data with all related information
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      policy: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              cedulaRnc: true,
              phone: true,
              email: true,
            },
          },
          insurer: {
            select: {
              id: true,
              name: true,
              rnc: true,
              phone: true,
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
      notes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!claim) {
    throw new Error('Siniestro no encontrado')
  }

  // Create PDF document
  const doc = createDocument()

  // Add company header
  addCompanyHeader(doc, 'Reporte de Siniestro')

  // Claim Number (prominent)
  doc.moveDown(0.5)
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#0d9488')
    .text(`Siniestro No. ${claim.claimNumber}`, { align: 'center' })
  doc.moveDown(1)

  // Claim Information Section
  addSectionHeader(doc, 'Información del Siniestro')

  addField(doc, 'Número de Siniestro', claim.claimNumber)
  addField(doc, 'Tipo', claim.type || '—')
  addField(doc, 'Estado', claim.status, { bold: true })
  addField(doc, 'Prioridad', claim.priority)
  addField(doc, 'Fecha del Incidente', formatDate(claim.dateOccurred))
  addField(doc, 'Fecha Reportado', formatDate(claim.dateReported))

  if (claim.estimatedAmount) {
    addField(
      doc,
      'Monto Estimado',
      formatCurrency(Number(claim.estimatedAmount)),
      { bold: true }
    )
  }

  if (claim.approvedAmount) {
    addField(
      doc,
      'Monto Aprobado',
      formatCurrency(Number(claim.approvedAmount)),
      { bold: true }
    )
  }

  // Description Section
  if (claim.description) {
    addSectionHeader(doc, 'Descripción del Incidente')
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#1e293b')
      .text(claim.description, { align: 'left' })
    doc.moveDown()
  }

  // Policy Information Section
  addSectionHeader(doc, 'Información de la Póliza')

  addField(doc, 'Número de Póliza', claim.policy?.policyNumber || '—')
  addField(doc, 'Aseguradora', claim.policy?.insurer?.name || '—')
  addField(doc, 'Tipo de Seguro', claim.policy?.insuranceType?.name || '—')
  if (claim.policy?.insuranceType?.category) {
    addField(doc, 'Categoría', claim.policy.insuranceType.category)
  }

  // Client Information Section
  addSectionHeader(doc, 'Información del Asegurado')

  addField(doc, 'Nombre', claim.policy?.client?.name || '—')
  addField(doc, 'Cédula/RNC', claim.policy?.client?.cedulaRnc || '—')
  if (claim.policy?.client?.phone) {
    addField(doc, 'Teléfono', claim.policy.client.phone)
  }
  if (claim.policy?.client?.email) {
    addField(doc, 'Correo Electrónico', claim.policy.client.email)
  }

  // Notes/Activity History Section
  if (claim.notes && claim.notes.length > 0) {
    addSectionHeader(doc, 'Historial de Actividad')

    const noteColumns = [
      { header: 'Fecha', key: 'date', width: 90, align: 'left' as const },
      { header: 'Usuario', key: 'user', width: 120, align: 'left' as const },
      { header: 'Nota', key: 'note', width: 210, align: 'left' as const },
    ]

    const noteRows = claim.notes.map((noteItem) => ({
      date: formatDate(noteItem.createdAt),
      user: noteItem.user?.name || '—',
      note: noteItem.note,
    }))

    buildTable(doc, noteColumns, noteRows)
  }

  // Status Summary Box
  doc.moveDown(1)
  const pageWidth = doc.page.width
  const leftMargin = 50
  const rightMargin = 50
  const boxWidth = pageWidth - leftMargin - rightMargin
  const boxHeight = 80

  const statusColorMap: Record<string, string> = {
    PENDIENTE: '#f59e0b',
    EN_PROCESO: '#3b82f6',
    EN_REVISION: '#8b5cf6',
    APROBADO: '#10b981',
    RECHAZADO: '#ef4444',
    PAGADO: '#059669',
  }

  const statusColor = statusColorMap[claim.status] || '#64748b'

  // Draw summary box
  doc.rect(leftMargin, doc.y, boxWidth, boxHeight).fillAndStroke('#f1f5f9', '#cbd5e1')

  const boxY = doc.y + 15
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#64748b')
    .text('Estado Actual:', leftMargin + 20, boxY)

  doc
    .fontSize(14)
    .fillColor(statusColor)
    .text(claim.status, leftMargin + 20, boxY + 20)

  if (claim.approvedAmount) {
    doc
      .fontSize(11)
      .fillColor('#64748b')
      .text('Monto:', leftMargin + 20, boxY + 45, { continued: true })
      .fontSize(12)
      .fillColor('#0d9488')
      .text(`  ${formatCurrency(Number(claim.approvedAmount))}`)
  }

  doc.y += boxHeight + 10

  // Contact Information
  doc.moveDown(1)
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(
      'Para consultas sobre este siniestro, contacte con su ejecutivo de seguros o directamente con la aseguradora.',
      { align: 'center' }
    )

  // Footer disclaimer
  doc.moveDown(1)
  doc
    .fontSize(9)
    .fillColor('#64748b')
    .text(
      'Este documento es un reporte oficial del siniestro emitido por SeguroPro.',
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
