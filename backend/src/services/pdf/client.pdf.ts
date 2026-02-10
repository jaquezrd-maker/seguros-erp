import { clientsService } from '../../modules/clients/clients.service'
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
  COLORS,
} from '../../utils/pdf'

export async function generateClientStatementPDF(clientId: number): Promise<Buffer> {
  // Fetch client data with policies
  const client = await clientsService.findById(clientId)

  // Create PDF document
  const doc = await createDocument()
  const page = await addPage(doc)
  const { width, height } = page.getSize()
  const margin = 50

  // Add company header
  let currentY = await addCompanyHeader(doc, page, 'Estado de Cuenta del Cliente')

  // Client Information Section
  currentY = await addSectionHeader(page, 'Información del Cliente', currentY)

  currentY = await addField(page, 'Nombre', client.name, currentY, { bold: true })
  currentY = await addField(page, 'Cédula/RNC', client.cedulaRnc, currentY)
  currentY = await addField(page, 'Tipo', client.type === 'FISICA' ? 'Persona Física' : 'Persona Jurídica', currentY)
  currentY = await addField(page, 'Estado', client.status, currentY)

  currentY -= 10 // Extra spacing

  // Contact Information
  if (client.phone || client.email) {
    currentY = await addSectionHeader(page, 'Datos de Contacto', currentY)
    if (client.phone) currentY = await addField(page, 'Teléfono', client.phone, currentY)
    if (client.email) currentY = await addField(page, 'Email', client.email, currentY)
    if (client.address) currentY = await addField(page, 'Dirección', client.address, currentY)
    if (client.city) currentY = await addField(page, 'Ciudad', client.city, currentY)
    if (client.province) currentY = await addField(page, 'Provincia', client.province, currentY)
    currentY -= 10
  }

  // Balance
  currentY = await addSectionHeader(page, 'Balance General', currentY)
  currentY = await addField(
    page,
    'Balance Pendiente',
    formatCurrency(client.balance?.pending || 0),
    currentY,
    { bold: true }
  )
  currentY = await addField(
    page,
    'Total Pagado',
    formatCurrency(client.balance?.completed || 0),
    currentY
  )

  currentY -= 15

  // Policies Table
  if (client.policies && client.policies.length > 0) {
    currentY = await addSectionHeader(page, 'Pólizas Activas', currentY)
    currentY -= 5

    const activePolicies = client.policies.filter((p: any) => p.status === 'VIGENTE')

    if (activePolicies.length > 0) {
      const columns = [
        { header: 'Póliza', key: 'policyNumber', width: 80 },
        { header: 'Aseguradora', key: 'insurer', width: 100 },
        { header: 'Ramo', key: 'type', width: 80 },
        { header: 'Prima', key: 'premium', width: 70 },
        { header: 'Vencimiento', key: 'endDate', width: 80 },
      ]

      const rows = activePolicies.map((policy: any) => ({
        policyNumber: policy.policyNumber,
        insurer: policy.insurer?.name || '—',
        type: policy.insuranceType?.name || '—',
        premium: formatCurrency(Number(policy.premium)),
        endDate: formatDate(policy.endDate),
      }))

      currentY = await buildTable(page, columns, rows, currentY)
    } else {
      await drawText(page, 'No hay pólizas activas', { x: margin, y: currentY, size: 9, color: COLORS.textLight })
      currentY -= 20
    }

    // Inactive policies summary
    const inactivePolicies = client.policies.filter((p: any) => p.status !== 'VIGENTE')
    if (inactivePolicies.length > 0) {
      currentY -= 10
      await drawText(page, `Pólizas Inactivas: ${inactivePolicies.length}`, { x: margin, y: currentY, size: 9, color: COLORS.textLight })
      currentY -= 20
    }
  }

  // Add footer
  await addFooter(doc, page, 1)

  // Generate PDF buffer
  return documentToBuffer(doc)
}
