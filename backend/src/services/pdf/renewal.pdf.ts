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
import { rgb } from 'pdf-lib'

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
              email: true,
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
  const doc = await createDocument()
  const page = await addPage(doc)
  const { width, height } = page.getSize()
  const margin = 50

  // Add company header
  let currentY = await addCompanyHeader(doc, page, 'Aviso de Renovación de Póliza')

  // Status indicator
  currentY -= 10

  const statusColorMap: Record<string, ReturnType<typeof rgb>> = {
    PENDIENTE: rgb(0.96, 0.62, 0.04), // Orange
    PROCESADA: rgb(0.06, 0.71, 0.41), // Green
    RECHAZADA: rgb(0.94, 0.27, 0.27), // Red
    VENCIDA: rgb(0.39, 0.45, 0.55), // Slate
  }

  const statusTextMap: Record<string, string> = {
    PENDIENTE: '⏳ Renovación Pendiente',
    PROCESADA: '✅ Renovación Procesada',
    RECHAZADA: '❌ Renovación Rechazada',
    VENCIDA: '⚠️ Renovación Vencida',
  }

  const statusColor = statusColorMap[renewal.status] || COLORS.textLight
  const statusText = statusTextMap[renewal.status] || renewal.status

  currentY = await drawBoldText(page, statusText, {
    x: width / 2 - 100,
    y: currentY,
    size: 14,
    color: statusColor,
  })
  currentY -= 25

  // Policy Information Section
  currentY = await addSectionHeader(page, 'Información de la Póliza', currentY)

  currentY = await addField(page, 'Número de Póliza', renewal.policy?.policyNumber || '—', currentY)
  currentY = await addField(page, 'Aseguradora', renewal.policy?.insurer?.name || '—', currentY)
  currentY = await addField(page, 'Tipo de Seguro', renewal.policy?.insuranceType?.name || '—', currentY)
  if (renewal.policy?.insuranceType?.category) {
    currentY = await addField(page, 'Categoría', renewal.policy.insuranceType.category, currentY)
  }

  // Renewal Information Section
  currentY -= 10 // Extra spacing
  currentY = await addSectionHeader(page, 'Detalles de la Renovación', currentY)

  currentY = await addField(page, 'Fecha de Vencimiento Original', formatDate(renewal.originalEndDate), currentY)

  if (renewal.newEndDate) {
    currentY = await addField(page, 'Nueva Fecha de Vencimiento', formatDate(renewal.newEndDate), currentY, { bold: true })
  }

  currentY = await addField(page, 'Prima Anterior', formatCurrency(Number(renewal.policy?.premium || 0)), currentY)

  if (renewal.newPremium) {
    currentY = await addField(page, 'Nueva Prima', formatCurrency(Number(renewal.newPremium)), currentY, { bold: true })

    // Calculate and show difference
    const difference = Number(renewal.newPremium) - Number(renewal.policy?.premium || 0)
    const differenceText =
      difference > 0
        ? `+${formatCurrency(difference)} (aumento)`
        : difference < 0
        ? `${formatCurrency(difference)} (disminución)`
        : 'Sin cambios'

    currentY = await addField(page, 'Diferencia', differenceText, currentY)
  }

  currentY = await addField(page, 'Estado', renewal.status, currentY)

  if (renewal.processedBy && renewal.processor) {
    currentY = await addField(page, 'Procesado por', renewal.processor.name, currentY)
  }

  // Client Information Section
  currentY -= 10 // Extra spacing
  currentY = await addSectionHeader(page, 'Información del Asegurado', currentY)

  currentY = await addField(page, 'Nombre', renewal.policy?.client?.name || '—', currentY)
  currentY = await addField(page, 'Cédula/RNC', renewal.policy?.client?.cedulaRnc || '—', currentY)
  if (renewal.policy?.client?.phone) {
    currentY = await addField(page, 'Teléfono', renewal.policy.client.phone, currentY)
  }
  if (renewal.policy?.client?.email) {
    currentY = await addField(page, 'Correo Electrónico', renewal.policy.client.email, currentY)
  }

  // Renewal Summary Box
  currentY -= 20
  const boxWidth = width - margin * 2
  const boxHeight = renewal.status === 'PROCESADA' ? 100 : 80

  // Draw summary box
  const boxColor = renewal.status === 'PROCESADA' ? rgb(0.82, 0.98, 0.90) : COLORS.background
  const borderColor = renewal.status === 'PROCESADA' ? COLORS.success : COLORS.border

  page.drawRectangle({
    x: margin,
    y: currentY - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: boxColor,
    borderColor: borderColor,
    borderWidth: 1,
  })

  currentY -= 20

  if (renewal.status === 'PROCESADA') {
    await drawBoldText(page, '✅ Renovación Completada', {
      x: margin + 20,
      y: currentY,
      size: 12,
      color: rgb(0.02, 0.40, 0.29), // Dark green
    })

    currentY -= 20
    await drawText(page, 'Su póliza ha sido renovada exitosamente.', {
      x: margin + 20,
      y: currentY,
      size: 10,
      color: rgb(0.02, 0.31, 0.23),
    })

    if (renewal.newEndDate) {
      currentY -= 20
      await drawText(page, `Nueva vigencia hasta: ${formatDate(renewal.newEndDate)}`, {
        x: margin + 20,
        y: currentY,
        size: 9,
        color: rgb(0.02, 0.37, 0.27),
      })
    }

    if (renewal.newPremium) {
      currentY -= 15
      await drawText(page, `Nueva prima: ${formatCurrency(Number(renewal.newPremium))}`, {
        x: margin + 20,
        y: currentY,
        size: 9,
        color: rgb(0.02, 0.37, 0.27),
      })
    }
  } else if (renewal.status === 'PENDIENTE') {
    await drawBoldText(page, '⏳ Renovación en Proceso', {
      x: margin + 20,
      y: currentY,
      size: 11,
      color: rgb(0.96, 0.62, 0.04),
    })

    currentY -= 20
    await drawText(page, 'Esta renovación está pendiente de procesamiento.', {
      x: margin + 20,
      y: currentY,
      size: 10,
      color: rgb(0.57, 0.25, 0.05),
    })

    currentY -= 20
    await drawText(page, 'Nos comunicaremos con usted para confirmar los detalles.', {
      x: margin + 20,
      y: currentY,
      size: 9,
      color: rgb(0.57, 0.25, 0.05),
    })
  } else if (renewal.status === 'RECHAZADA') {
    await drawBoldText(page, '❌ Renovación Rechazada', {
      x: margin + 20,
      y: currentY,
      size: 11,
      color: rgb(0.94, 0.27, 0.27),
    })

    currentY -= 20
    await drawText(page, 'Esta renovación no pudo ser procesada.', {
      x: margin + 20,
      y: currentY,
      size: 10,
      color: rgb(0.50, 0.11, 0.11),
    })

    currentY -= 20
    await drawText(page, 'Contacte con nosotros para más detalles.', {
      x: margin + 20,
      y: currentY,
      size: 9,
      color: rgb(0.50, 0.11, 0.11),
    })
  } else {
    await drawBoldText(page, '⚠️ Renovación Vencida', {
      x: margin + 20,
      y: currentY,
      size: 11,
      color: COLORS.textLight,
    })

    currentY -= 20
    await drawText(page, 'Esta renovación ha expirado sin ser procesada.', {
      x: margin + 20,
      y: currentY,
      size: 10,
      color: rgb(0.20, 0.26, 0.33),
    })
  }

  currentY -= boxHeight + 10

  // Contact Information
  currentY -= 20
  currentY = await drawText(page, 'Para consultas sobre la renovación de su póliza, contacte con su ejecutivo de seguros.', {
    x: margin,
    y: currentY,
    size: 9,
    color: COLORS.textLight,
    maxWidth: width - margin * 2,
  })

  // Footer disclaimer
  currentY -= 20
  currentY = await drawText(page, 'Este documento es un aviso oficial de renovación emitido por SeguroPro.', {
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
