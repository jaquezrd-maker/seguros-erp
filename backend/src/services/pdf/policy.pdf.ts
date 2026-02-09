import { policiesService } from '../../modules/policies/policies.service'
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

export async function generatePolicyPDF(policyId: number): Promise<Buffer> {
  // Fetch policy data with all related information
  const policy = await policiesService.findById(policyId)

  // Create PDF document
  const doc = createDocument()

  // Add company header
  addCompanyHeader(doc, 'Certificado de Póliza de Seguro')

  // Policy Information Section
  addSectionHeader(doc, 'Información de la Póliza')

  addField(doc, 'Número de Póliza', policy.policyNumber, { bold: true })
  addField(doc, 'Estado', policy.status)
  addField(doc, 'Aseguradora', policy.insurer?.name || '—')
  addField(doc, 'Tipo de Seguro', policy.insuranceType?.name || '—')
  if (policy.insuranceType?.category) {
    addField(doc, 'Categoría', policy.insuranceType.category)
  }

  doc.moveDown(0.5)

  // Dates and Premium
  addField(doc, 'Fecha de Inicio', formatDate(policy.startDate))
  addField(doc, 'Fecha de Vencimiento', formatDate(policy.endDate))
  addField(doc, 'Prima Total', formatCurrency(Number(policy.premium)), { bold: true })
  addField(doc, 'Forma de Pago', policy.paymentMethod)
  if (policy.numberOfInstallments) {
    addField(doc, 'Cuotas', `${policy.numberOfInstallments} cuotas`)
  }
  addField(doc, 'Renovación Automática', policy.autoRenew ? 'Sí' : 'No')

  // Client Information Section
  addSectionHeader(doc, 'Información del Asegurado')

  addField(doc, 'Nombre', policy.client?.name || '—')
  addField(doc, 'Cédula/RNC', policy.client?.cedulaRnc || '—')
  if (policy.client?.phone) {
    addField(doc, 'Teléfono', policy.client.phone)
  }
  if (policy.client?.email) {
    addField(doc, 'Correo Electrónico', policy.client.email)
  }

  // Beneficiary Data Section (if exists)
  if (policy.beneficiaryData && typeof policy.beneficiaryData === 'object') {
    const beneficiary = policy.beneficiaryData as Record<string, any>

    addSectionHeader(doc, 'Datos del Beneficiario/Bien Asegurado')

    if (beneficiary.type === 'vehicle') {
      addField(doc, 'Tipo', 'Vehículo')
      if (beneficiary.vehicleMake) addField(doc, 'Marca', beneficiary.vehicleMake)
      if (beneficiary.vehicleModel) addField(doc, 'Modelo', beneficiary.vehicleModel)
      if (beneficiary.vehicleYear) addField(doc, 'Año', beneficiary.vehicleYear.toString())
      if (beneficiary.vehiclePlate) addField(doc, 'Placa', beneficiary.vehiclePlate)
      if (beneficiary.vehicleChasis) addField(doc, 'Chasis', beneficiary.vehicleChasis)
      if (beneficiary.vehicleColor) addField(doc, 'Color', beneficiary.vehicleColor)
      if (beneficiary.vehicleValue) {
        addField(doc, 'Valor del Vehículo', formatCurrency(Number(beneficiary.vehicleValue)))
      }
    } else if (beneficiary.type === 'person') {
      addField(doc, 'Tipo', 'Persona')
      if (beneficiary.personName) addField(doc, 'Nombre', beneficiary.personName)
      if (beneficiary.personCedula) addField(doc, 'Cédula', beneficiary.personCedula)
      if (beneficiary.personBirthDate) {
        addField(doc, 'Fecha de Nacimiento', formatDate(beneficiary.personBirthDate))
      }
      if (beneficiary.personRelationship) addField(doc, 'Parentesco', beneficiary.personRelationship)
      if (beneficiary.personPhone) addField(doc, 'Teléfono', beneficiary.personPhone)
    } else if (beneficiary.type === 'property') {
      addField(doc, 'Tipo', 'Propiedad')
      if (beneficiary.propertyType) addField(doc, 'Tipo de Propiedad', beneficiary.propertyType)
      if (beneficiary.propertyAddress) addField(doc, 'Dirección', beneficiary.propertyAddress)
      if (beneficiary.propertyValue) {
        addField(doc, 'Valor de la Propiedad', formatCurrency(Number(beneficiary.propertyValue)))
      }
      if (beneficiary.propertyDescription) {
        addField(doc, 'Descripción', beneficiary.propertyDescription)
      }
    } else if (beneficiary.type === 'health') {
      addField(doc, 'Tipo', 'Salud')
      if (beneficiary.healthConditions) {
        addField(doc, 'Condiciones de Salud', beneficiary.healthConditions)
      }
    } else {
      addField(doc, 'Tipo', beneficiary.type || 'Otro')
    }
  }

  // Payment History Section
  if (policy.payments && policy.payments.length > 0) {
    addSectionHeader(doc, 'Historial de Pagos')

    const paymentColumns = [
      { header: 'Fecha', key: 'date', width: 80, align: 'left' as const },
      { header: 'Monto', key: 'amount', width: 80, align: 'right' as const },
      { header: 'Método', key: 'method', width: 100, align: 'left' as const },
      { header: 'Estado', key: 'status', width: 80, align: 'center' as const },
      { header: 'Recibo', key: 'receipt', width: 80, align: 'left' as const },
    ]

    const paymentRows = policy.payments.slice(0, 10).map((payment) => ({
      date: formatDate(payment.paymentDate),
      amount: formatCurrency(Number(payment.amount)),
      method: payment.paymentMethod || '—',
      status: payment.status,
      receipt: payment.receiptNumber || '—',
    }))

    buildTable(doc, paymentColumns, paymentRows)

    if (policy.payments.length > 10) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`(Mostrando los 10 pagos más recientes de ${policy.payments.length} total)`, {
          align: 'center',
        })
    }
  }

  // Claims History Section
  if (policy.claims && policy.claims.length > 0) {
    addSectionHeader(doc, 'Historial de Siniestros')

    const claimColumns = [
      { header: 'Número', key: 'number', width: 90, align: 'left' as const },
      { header: 'Fecha', key: 'date', width: 80, align: 'left' as const },
      { header: 'Tipo', key: 'type', width: 100, align: 'left' as const },
      { header: 'Monto', key: 'amount', width: 80, align: 'right' as const },
      { header: 'Estado', key: 'status', width: 80, align: 'center' as const },
    ]

    const claimRows = policy.claims.slice(0, 10).map((claim) => ({
      number: claim.claimNumber,
      date: formatDate(claim.dateOccurred),
      type: claim.type || '—',
      amount: claim.estimatedAmount ? formatCurrency(Number(claim.estimatedAmount)) : '—',
      status: claim.status,
    }))

    buildTable(doc, claimColumns, claimRows)

    if (policy.claims.length > 10) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`(Mostrando los 10 siniestros más recientes de ${policy.claims.length} total)`, {
          align: 'center',
        })
    }
  }

  // Notes Section
  if (policy.notes) {
    addSectionHeader(doc, 'Notas')
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#1e293b')
      .text(policy.notes, {
        align: 'left',
      })
    doc.moveDown()
  }

  // Add footer disclaimer
  doc.moveDown(2)
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(
      'Este documento es un certificado de póliza emitido por SeguroPro. Para mayor información contacte con su ejecutivo de seguros.',
      {
        align: 'center',
      }
    )

  doc
    .fontSize(8)
    .text(`Emitido el: ${formatDate(new Date())}`, {
      align: 'center',
    })

  // Add page numbers to all pages
  addPageNumbers(doc)

  // Convert to buffer
  return documentToBuffer(doc)
}
