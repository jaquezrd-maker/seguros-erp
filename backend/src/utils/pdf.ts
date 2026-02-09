import PDFDocument from 'pdfkit'

// Dominican Spanish locale formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

// Create a new PDF document with standard configuration
export function createDocument(): PDFKit.PDFDocument {
  return new PDFDocument({
    size: 'LETTER',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
    info: {
      Title: 'SeguroPro - Documento',
      Author: 'SeguroPro - Corredora de Seguros',
      Subject: 'Documento Oficial',
    },
  })
}

// Add company header to document
export function addCompanyHeader(doc: PDFKit.PDFDocument, title: string): void {
  const pageWidth = doc.page.width
  const leftMargin = 50
  const rightMargin = 50

  // Company name
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#0d9488') // Teal color to match brand
    .text('SeguroPro', leftMargin, 40, { align: 'left' })

  // Document title
  doc
    .fontSize(16)
    .font('Helvetica')
    .fillColor('#1e293b') // Dark slate
    .text(title, leftMargin, 70, {
      width: pageWidth - leftMargin - rightMargin,
      align: 'center',
    })

  // Horizontal line
  doc
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .moveTo(leftMargin, 100)
    .lineTo(pageWidth - rightMargin, 100)
    .stroke()

  // Reset position
  doc.y = 120
}

// Add footer to document
export function addFooter(doc: PDFKit.PDFDocument, pageNumber: number, totalPages?: number): void {
  const pageWidth = doc.page.width
  const pageHeight = doc.page.height
  const leftMargin = 50
  const rightMargin = 50

  // Footer line
  doc
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .moveTo(leftMargin, pageHeight - 70)
    .lineTo(pageWidth - rightMargin, pageHeight - 70)
    .stroke()

  // Company info
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(
      'SeguroPro - Corredora de Seguros',
      leftMargin,
      pageHeight - 60,
      { width: pageWidth - leftMargin - rightMargin, align: 'center' }
    )

  doc.text(
    'Santo Domingo, República Dominicana',
    leftMargin,
    pageHeight - 48,
    { width: pageWidth - leftMargin - rightMargin, align: 'center' }
  )

  // Page number
  const pageText = totalPages
    ? `Página ${pageNumber} de ${totalPages}`
    : `Página ${pageNumber}`

  doc
    .fontSize(9)
    .text(pageText, leftMargin, pageHeight - 35, {
      width: pageWidth - leftMargin - rightMargin,
      align: 'center',
    })
}

// Build a table in the PDF
interface TableColumn {
  header: string
  key: string
  width: number
  align?: 'left' | 'center' | 'right'
}

interface TableOptions {
  startY?: number
  rowHeight?: number
  headerColor?: string
  cellPadding?: number
}

export function buildTable(
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
  rows: Record<string, any>[],
  options: TableOptions = {}
): void {
  const {
    startY = doc.y,
    rowHeight = 25,
    headerColor = '#0d9488',
    cellPadding = 5,
  } = options

  const leftMargin = 50
  let currentY = startY

  // Calculate total width
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0)
  let currentX = leftMargin

  // Draw header
  doc.fontSize(10).font('Helvetica-Bold')

  columns.forEach((col) => {
    doc
      .rect(currentX, currentY, col.width, rowHeight)
      .fillAndStroke(headerColor, '#000000')

    doc
      .fillColor('#ffffff')
      .text(
        col.header,
        currentX + cellPadding,
        currentY + cellPadding,
        {
          width: col.width - cellPadding * 2,
          height: rowHeight - cellPadding * 2,
          align: col.align || 'left',
        }
      )

    currentX += col.width
  })

  currentY += rowHeight

  // Draw rows
  doc.fontSize(9).font('Helvetica')

  rows.forEach((row, index) => {
    currentX = leftMargin
    const fillColor = index % 2 === 0 ? '#ffffff' : '#f8fafc'

    columns.forEach((col) => {
      doc
        .rect(currentX, currentY, col.width, rowHeight)
        .fillAndStroke(fillColor, '#cbd5e1')

      const value = row[col.key]
      const displayValue =
        value !== null && value !== undefined ? String(value) : '—'

      doc
        .fillColor('#1e293b')
        .text(
          displayValue,
          currentX + cellPadding,
          currentY + cellPadding,
          {
            width: col.width - cellPadding * 2,
            height: rowHeight - cellPadding * 2,
            align: col.align || 'left',
          }
        )

      currentX += col.width
    })

    currentY += rowHeight
  })

  // Update document y position
  doc.y = currentY + 10
}

// Add a labeled field (key: value pair)
export function addField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string | number,
  options: { bold?: boolean } = {}
): void {
  const pageWidth = doc.page.width
  const leftMargin = 50
  const labelWidth = 150

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#64748b')
    .text(label + ':', leftMargin, doc.y, { continued: true, width: labelWidth })

  doc
    .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fillColor('#1e293b')
    .text(' ' + value, { width: pageWidth - leftMargin - 50 - labelWidth })

  doc.moveDown(0.5)
}

// Add a section header
export function addSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
  const pageWidth = doc.page.width
  const leftMargin = 50
  const rightMargin = 50

  doc.moveDown(1)

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#0d9488')
    .text(title, leftMargin, doc.y)

  doc.moveDown(0.3)

  // Underline
  doc
    .strokeColor('#0d9488')
    .lineWidth(2)
    .moveTo(leftMargin, doc.y)
    .lineTo(pageWidth - rightMargin, doc.y)
    .stroke()

  doc.moveDown(0.5)
}

// Convert document to buffer
export function documentToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.end()
  })
}

// Add page numbers to all pages
export function addPageNumbers(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i)
    addFooter(doc, i + 1, range.count)
  }
}
