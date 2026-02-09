import { policiesService } from '../../modules/policies/policies.service'
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

export async function generatePolicyPDF(policyId: number): Promise<Buffer> {
  // Fetch policy data with all related information
  const policy = await policiesService.findById(policyId)

  // Create PDF document
  const doc = await createDocument()
  const page = await addPage(doc)
  const { width, height } = page.getSize()
  const margin = 50

  // Add company header
  let currentY = await addCompanyHeader(doc, page, 'Certificado de Póliza de Seguro')

  // Policy Information Section
  currentY = await addSectionHeader(page, 'Información de la Póliza', currentY)

  currentY = await addField(page, 'Número de Póliza', policy.policyNumber, currentY, { bold: true })
  currentY = await addField(page, 'Estado', policy.status, currentY)
  currentY = await addField(page, 'Aseguradora', policy.insurer?.name || '—', currentY)
  currentY = await addField(page, 'Tipo de Seguro', policy.insuranceType?.name || '—', currentY)
  if (policy.insuranceType?.category) {
    currentY = await addField(page, 'Categoría', policy.insuranceType.category, currentY)
  }

  currentY -= 10 // Extra spacing

  // Dates and Premium
  currentY = await addField(page, 'Fecha de Inicio', formatDate(policy.startDate), currentY)
  currentY = await addField(page, 'Fecha de Vencimiento', formatDate(policy.endDate), currentY)
  currentY = await addField(page, 'Prima Total', formatCurrency(Number(policy.premium)), currentY, { bold: true })
  currentY = await addField(page, 'Forma de Pago', policy.paymentMethod, currentY)
  if (policy.numberOfInstallments) {
    currentY = await addField(page, 'Cuotas', `${policy.numberOfInstallments} cuotas`, currentY)
  }
  currentY = await addField(page, 'Renovación Automática', policy.autoRenew ? 'Sí' : 'No', currentY)

  // Client Information Section
  currentY -= 10 // Extra spacing
  currentY = await addSectionHeader(page, 'Información del Asegurado', currentY)

  currentY = await addField(page, 'Nombre', policy.client?.name || '—', currentY)
  currentY = await addField(page, 'Cédula/RNC', policy.client?.cedulaRnc || '—', currentY)
  if (policy.client?.phone) {
    currentY = await addField(page, 'Teléfono', policy.client.phone, currentY)
  }
  if (policy.client?.email) {
    currentY = await addField(page, 'Correo Electrónico', policy.client.email, currentY)
  }

  // Beneficiary Data Section (if exists)
  if (policy.beneficiaryData && typeof policy.beneficiaryData === 'object') {
    const beneficiary = policy.beneficiaryData as Record<string, any>

    currentY -= 10 // Extra spacing
    currentY = await addSectionHeader(page, 'Datos del Beneficiario/Bien Asegurado', currentY)

    if (beneficiary.type === 'vehicle') {
      currentY = await addField(page, 'Tipo', 'Vehículo', currentY)
      if (beneficiary.vehicleMake) currentY = await addField(page, 'Marca', beneficiary.vehicleMake, currentY)
      if (beneficiary.vehicleModel) currentY = await addField(page, 'Modelo', beneficiary.vehicleModel, currentY)
      if (beneficiary.vehicleYear) currentY = await addField(page, 'Año', beneficiary.vehicleYear.toString(), currentY)
      if (beneficiary.vehiclePlate) currentY = await addField(page, 'Placa', beneficiary.vehiclePlate, currentY)
      if (beneficiary.vehicleChasis) currentY = await addField(page, 'Chasis', beneficiary.vehicleChasis, currentY)
      if (beneficiary.vehicleColor) currentY = await addField(page, 'Color', beneficiary.vehicleColor, currentY)
      if (beneficiary.vehicleValue) {
        currentY = await addField(page, 'Valor del Vehículo', formatCurrency(Number(beneficiary.vehicleValue)), currentY)
      }
    } else if (beneficiary.type === 'person') {
      currentY = await addField(page, 'Tipo', 'Persona', currentY)
      if (beneficiary.personName) currentY = await addField(page, 'Nombre', beneficiary.personName, currentY)
      if (beneficiary.personCedula) currentY = await addField(page, 'Cédula', beneficiary.personCedula, currentY)
      if (beneficiary.personBirthDate) {
        currentY = await addField(page, 'Fecha de Nacimiento', formatDate(beneficiary.personBirthDate), currentY)
      }
      if (beneficiary.personRelationship) currentY = await addField(page, 'Parentesco', beneficiary.personRelationship, currentY)
      if (beneficiary.personPhone) currentY = await addField(page, 'Teléfono', beneficiary.personPhone, currentY)
    } else if (beneficiary.type === 'property') {
      currentY = await addField(page, 'Tipo', 'Propiedad', currentY)
      if (beneficiary.propertyType) currentY = await addField(page, 'Tipo de Propiedad', beneficiary.propertyType, currentY)
      if (beneficiary.propertyAddress) currentY = await addField(page, 'Dirección', beneficiary.propertyAddress, currentY)
      if (beneficiary.propertyValue) {
        currentY = await addField(page, 'Valor de la Propiedad', formatCurrency(Number(beneficiary.propertyValue)), currentY)
      }
      if (beneficiary.propertyDescription) {
        currentY = await addField(page, 'Descripción', beneficiary.propertyDescription, currentY)
      }
    } else if (beneficiary.type === 'health') {
      currentY = await addField(page, 'Tipo', 'Salud', currentY)
      if (beneficiary.healthConditions) {
        currentY = await addField(page, 'Condiciones de Salud', beneficiary.healthConditions, currentY)
      }
    } else {
      currentY = await addField(page, 'Tipo', beneficiary.type || 'Otro', currentY)
    }
  }

  // Payment History Section
  if (policy.payments && policy.payments.length > 0) {
    currentY -= 15 // Extra spacing
    currentY = await addSectionHeader(page, 'Historial de Pagos', currentY)

    const paymentColumns = [
      { header: 'Fecha', key: 'date', width: 100 },
      { header: 'Monto', key: 'amount', width: 90 },
      { header: 'Método', key: 'method', width: 100 },
      { header: 'Estado', key: 'status', width: 80 },
      { header: 'Recibo', key: 'receipt', width: 90 },
    ]

    const paymentRows = policy.payments.slice(0, 10).map((payment) => ({
      date: formatDate(payment.paymentDate),
      amount: formatCurrency(Number(payment.amount)),
      method: payment.paymentMethod || '—',
      status: payment.status,
      receipt: payment.receiptNumber || '—',
    }))

    currentY = await buildTable(page, paymentColumns, paymentRows, currentY)

    if (policy.payments.length > 10) {
      currentY = await drawText(page, `(Mostrando los 10 pagos más recientes de ${policy.payments.length} total)`, {
        x: width / 2 - 150,
        y: currentY,
        size: 9,
        color: COLORS.textLight,
      })
      currentY -= 15
    }
  }

  // Claims History Section
  if (policy.claims && policy.claims.length > 0) {
    currentY -= 15 // Extra spacing
    currentY = await addSectionHeader(page, 'Historial de Siniestros', currentY)

    const claimColumns = [
      { header: 'Número', key: 'number', width: 100 },
      { header: 'Fecha', key: 'date', width: 100 },
      { header: 'Tipo', key: 'type', width: 100 },
      { header: 'Monto', key: 'amount', width: 90 },
      { header: 'Estado', key: 'status', width: 80 },
    ]

    const claimRows = policy.claims.slice(0, 10).map((claim) => ({
      number: claim.claimNumber,
      date: formatDate(claim.dateOccurred),
      type: claim.type || '—',
      amount: claim.estimatedAmount ? formatCurrency(Number(claim.estimatedAmount)) : '—',
      status: claim.status,
    }))

    currentY = await buildTable(page, claimColumns, claimRows, currentY)

    if (policy.claims.length > 10) {
      currentY = await drawText(page, `(Mostrando los 10 siniestros más recientes de ${policy.claims.length} total)`, {
        x: width / 2 - 150,
        y: currentY,
        size: 9,
        color: COLORS.textLight,
      })
      currentY -= 15
    }
  }

  // Notes Section
  if (policy.notes) {
    currentY -= 15 // Extra spacing
    currentY = await addSectionHeader(page, 'Notas', currentY)
    currentY = await drawText(page, policy.notes, {
      x: margin,
      y: currentY,
      size: 10,
      color: COLORS.text,
      maxWidth: width - margin * 2,
    })
    currentY -= 15
  }

  // Footer disclaimer
  currentY -= 30
  currentY = await drawText(page, 'Este documento es un certificado de póliza emitido por SeguroPro. Para mayor información contacte con su ejecutivo de seguros.', {
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
