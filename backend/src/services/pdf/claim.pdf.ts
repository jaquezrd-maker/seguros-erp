import prisma from '../../config/database'
import {
  createDocument,
  addPage,
  addCompanyHeader,
  addFooter,
  addField,
  addSectionHeader,
  buildTable,
  formatCurrency,
  formatDate,
  documentToBuffer,
  drawText,
  drawBoldText,
  COLORS,
} from '../../utils/pdf'
import { rgb } from 'pdf-lib'

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
  const doc = await createDocument()
  const page = await addPage(doc)
  const { width, height } = page.getSize()
  const margin = 50

  // Add company header
  let currentY = await addCompanyHeader(doc, page, 'Reporte de Siniestro')

  // Claim Number (prominent)
  currentY -= 10
  currentY = await drawBoldText(page, `Siniestro No. ${claim.claimNumber}`, {
    x: width / 2 - 80,
    y: currentY,
    size: 14,
    color: COLORS.primary,
  })
  currentY -= 25

  // Claim Information Section
  currentY = await addSectionHeader(page, 'Información del Siniestro', currentY)

  currentY = await addField(page, 'Número de Siniestro', claim.claimNumber, currentY)
  currentY = await addField(page, 'Tipo', claim.type || '—', currentY)
  currentY = await addField(page, 'Estado', claim.status, currentY, { bold: true })
  currentY = await addField(page, 'Prioridad', claim.priority, currentY)
  currentY = await addField(page, 'Fecha del Incidente', formatDate(claim.dateOccurred), currentY)
  currentY = await addField(page, 'Fecha Reportado', formatDate(claim.dateReported), currentY)

  if (claim.estimatedAmount) {
    currentY = await addField(
      page,
      'Monto Estimado',
      formatCurrency(Number(claim.estimatedAmount)),
      currentY,
      { bold: true }
    )
  }

  if (claim.approvedAmount) {
    currentY = await addField(
      page,
      'Monto Aprobado',
      formatCurrency(Number(claim.approvedAmount)),
      currentY,
      { bold: true }
    )
  }

  // Description Section
  if (claim.description) {
    currentY -= 10 // Extra spacing
    currentY = await addSectionHeader(page, 'Descripción del Incidente', currentY)
    currentY = await drawText(page, claim.description, {
      x: margin,
      y: currentY,
      size: 10,
      color: COLORS.text,
      maxWidth: width - margin * 2,
    })
    currentY -= 15
  }

  // Policy Information Section
  currentY -= 10 // Extra spacing
  currentY = await addSectionHeader(page, 'Información de la Póliza', currentY)

  currentY = await addField(page, 'Número de Póliza', claim.policy?.policyNumber || '—', currentY)
  currentY = await addField(page, 'Aseguradora', claim.policy?.insurer?.name || '—', currentY)
  currentY = await addField(page, 'Tipo de Seguro', claim.policy?.insuranceType?.name || '—', currentY)
  if (claim.policy?.insuranceType?.category) {
    currentY = await addField(page, 'Categoría', claim.policy.insuranceType.category, currentY)
  }

  // Client Information Section
  currentY -= 10 // Extra spacing
  currentY = await addSectionHeader(page, 'Información del Asegurado', currentY)

  currentY = await addField(page, 'Nombre', claim.policy?.client?.name || '—', currentY)
  currentY = await addField(page, 'Cédula/RNC', claim.policy?.client?.cedulaRnc || '—', currentY)
  if (claim.policy?.client?.phone) {
    currentY = await addField(page, 'Teléfono', claim.policy.client.phone, currentY)
  }
  if (claim.policy?.client?.email) {
    currentY = await addField(page, 'Correo Electrónico', claim.policy.client.email, currentY)
  }

  // Notes/Activity History Section
  if (claim.notes && claim.notes.length > 0) {
    currentY -= 15 // Extra spacing
    currentY = await addSectionHeader(page, 'Historial de Actividad', currentY)

    const noteColumns = [
      { header: 'Fecha', key: 'date', width: 100 },
      { header: 'Usuario', key: 'user', width: 120 },
      { header: 'Nota', key: 'note', width: 240 },
    ]

    const noteRows = claim.notes.map((noteItem) => ({
      date: formatDate(noteItem.createdAt),
      user: noteItem.user?.name || '—',
      note: noteItem.note,
    }))

    currentY = await buildTable(page, noteColumns, noteRows, currentY)
  }

  // Status Summary Box
  currentY -= 20
  const boxWidth = width - margin * 2
  const boxHeight = 80

  const statusColorMap: Record<string, ReturnType<typeof rgb>> = {
    PENDIENTE: rgb(0.96, 0.62, 0.04), // Orange
    EN_PROCESO: rgb(0.23, 0.51, 0.96), // Blue
    EN_REVISION: rgb(0.54, 0.36, 0.96), // Purple
    APROBADO: rgb(0.06, 0.71, 0.41), // Green
    RECHAZADO: rgb(0.94, 0.27, 0.27), // Red
    PAGADO: rgb(0.02, 0.54, 0.41), // Dark green
  }

  const statusColor = statusColorMap[claim.status] || COLORS.textLight

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
  await drawBoldText(page, 'Estado Actual:', {
    x: margin + 20,
    y: currentY,
    size: 11,
    color: COLORS.textLight,
  })

  currentY -= 20
  await drawBoldText(page, claim.status, {
    x: margin + 20,
    y: currentY,
    size: 14,
    color: statusColor,
  })

  if (claim.approvedAmount) {
    currentY -= 20
    await drawText(page, 'Monto:', {
      x: margin + 20,
      y: currentY,
      size: 11,
      color: COLORS.textLight,
    })
    await drawBoldText(page, formatCurrency(Number(claim.approvedAmount)), {
      x: margin + 85,
      y: currentY,
      size: 12,
      color: COLORS.primary,
    })
  }

  currentY -= boxHeight + 10

  // Contact Information
  currentY -= 20
  currentY = await drawText(page, 'Para consultas sobre este siniestro, contacte con su ejecutivo de seguros o directamente con la aseguradora.', {
    x: margin,
    y: currentY,
    size: 9,
    color: COLORS.textLight,
    maxWidth: width - margin * 2,
  })

  // Footer disclaimer
  currentY -= 20
  currentY = await drawText(page, 'Este documento es un reporte oficial del siniestro emitido por SeguroPro.', {
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
