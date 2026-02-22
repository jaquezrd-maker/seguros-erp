import quotationsService from '../../modules/quotations/quotations.service'
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

export async function generateQuotationPDF(quotationId: number): Promise<Buffer> {
  const quotation = await quotationsService.findById(quotationId, undefined)
  if (!quotation) throw new Error('Cotización no encontrada')

  const doc = await createDocument()
  const page = await addPage(doc)
  const { width } = page.getSize()
  const margin = 50

  // Company header
  let currentY = await addCompanyHeader(doc, page, 'Cotización de Seguros')

  // Quotation info section
  currentY = await addSectionHeader(page, 'Información de la Cotización', currentY)
  currentY = await addField(page, 'No. Cotización', quotation.quotationNo, currentY, { bold: true })
  currentY = await addField(page, 'Estado', quotation.status, currentY)
  currentY = await addField(page, 'Fecha', formatDate(quotation.createdAt), currentY)
  if (quotation.validUntil) {
    currentY = await addField(page, 'Válido Hasta', formatDate(quotation.validUntil), currentY)
  }
  currentY = await addField(page, 'Prima Total', formatCurrency(Number(quotation.totalPremium)), currentY, { bold: true })

  // Client section
  currentY -= 10
  currentY = await addSectionHeader(page, 'Datos del Cliente', currentY)
  currentY = await addField(page, 'Nombre', quotation.clientName, currentY)
  if (quotation.clientEmail) {
    currentY = await addField(page, 'Email', quotation.clientEmail, currentY)
  }
  if (quotation.clientPhone) {
    currentY = await addField(page, 'Teléfono', quotation.clientPhone, currentY)
  }

  // Items table
  if (quotation.items && quotation.items.length > 0) {
    currentY -= 15
    currentY = await addSectionHeader(page, 'Productos Cotizados', currentY)

    const columns = [
      { header: 'Producto', key: 'product', width: 140 },
      { header: 'Aseguradora', key: 'insurer', width: 100 },
      { header: 'Plan', key: 'plan', width: 110 },
      { header: 'Cobertura', key: 'coverage', width: 80 },
      { header: 'Prima', key: 'premium', width: 80 },
    ]

    const rows = quotation.items.map((item: any) => ({
      product: item.product?.name || '—',
      insurer: item.product?.insurer?.name || '—',
      plan: `${item.plan?.name || '—'} (${item.plan?.tier || ''})`,
      coverage: item.coverage ? formatCurrency(Number(item.coverage)) : '—',
      premium: formatCurrency(Number(item.premium)),
    }))

    currentY = await buildTable(page, columns, rows, currentY)
  }

  // Notes section
  if (quotation.notes) {
    currentY -= 15
    currentY = await addSectionHeader(page, 'Notas', currentY)
    currentY = await drawText(page, quotation.notes, {
      x: margin,
      y: currentY,
      size: 10,
      color: COLORS.text,
      maxWidth: width - margin * 2,
    })
    currentY -= 15
  }

  // Disclaimer
  currentY -= 30
  currentY = await drawText(page, 'Esta cotización es informativa y no constituye un contrato de seguro. Los precios están sujetos a cambios según las condiciones de la aseguradora.', {
    x: margin,
    y: currentY,
    size: 9,
    color: COLORS.textLight,
    maxWidth: width - margin * 2,
  })

  await drawText(page, `Emitido el: ${formatDate(new Date())}`, {
    x: width / 2 - 50,
    y: currentY - 10,
    size: 8,
    color: COLORS.textLight,
  })

  await addFooter(doc, page, 1)

  return await documentToBuffer(doc)
}
