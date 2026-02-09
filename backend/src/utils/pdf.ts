import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib'

// Utility functions for PDF generation using pdf-lib (serverless-compatible)

export async function createDocument(): Promise<PDFDocument> {
  return await PDFDocument.create()
}

export async function addPage(doc: PDFDocument): Promise<PDFPage> {
  return doc.addPage()
}

export async function documentToBuffer(doc: PDFDocument): Promise<Buffer> {
  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}

// Format currency in Dominican Pesos
export function formatCurrency(amount: number): string {
  return `RD$${amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Format date in Dominican Spanish
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Company branding colors
export const COLORS = {
  primary: rgb(0.05, 0.58, 0.53), // Teal #0d9488
  secondary: rgb(0.08, 0.72, 0.65), // Light teal #14b8a6
  text: rgb(0.12, 0.16, 0.23), // Dark slate #1e293b
  textLight: rgb(0.39, 0.45, 0.55), // Slate #64748b
  border: rgb(0.8, 0.84, 0.88), // Light border #cbd5e1
  background: rgb(0.95, 0.96, 0.98), // Light bg #f1f5f9
  success: rgb(0.06, 0.71, 0.41), // Green #10b981
  warning: rgb(0.96, 0.62, 0.04), // Orange #f59e0b
  danger: rgb(0.94, 0.27, 0.27), // Red #ef4444
}

export interface TextOptions {
  x: number
  y: number
  size?: number
  color?: ReturnType<typeof rgb>
  maxWidth?: number
}

export async function drawText(
  page: PDFPage,
  text: string,
  options: TextOptions
): Promise<number> {
  const { x, y, size = 12, color = COLORS.text, maxWidth } = options
  const font = await page.doc.embedFont(StandardFonts.Helvetica)

  let finalText = text
  if (maxWidth) {
    const textWidth = font.widthOfTextAtSize(text, size)
    if (textWidth > maxWidth) {
      // Truncate text if it exceeds maxWidth
      let truncated = text
      while (font.widthOfTextAtSize(truncated + '...', size) > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1)
      }
      finalText = truncated + '...'
    }
  }

  page.drawText(finalText, {
    x,
    y,
    size,
    font,
    color,
  })

  return y - size - 4 // Return next Y position
}

export async function drawBoldText(
  page: PDFPage,
  text: string,
  options: TextOptions
): Promise<number> {
  const { x, y, size = 12, color = COLORS.text } = options
  const font = await page.doc.embedFont(StandardFonts.HelveticaBold)

  page.drawText(text, {
    x,
    y,
    size,
    font,
    color,
  })

  return y - size - 4
}

export async function addCompanyHeader(
  doc: PDFDocument,
  page: PDFPage,
  title: string
): Promise<number> {
  const { width, height } = page.getSize()
  const margin = 50

  // Company name
  await drawBoldText(page, 'SeguroPro', {
    x: margin,
    y: height - 50,
    size: 24,
    color: COLORS.primary,
  })

  await drawText(page, 'Corredora de Seguros', {
    x: margin,
    y: height - 75,
    size: 10,
    color: COLORS.textLight,
  })

  // Horizontal line
  page.drawLine({
    start: { x: margin, y: height - 90 },
    end: { x: width - margin, y: height - 90 },
    thickness: 2,
    color: COLORS.primary,
  })

  // Document title
  await drawBoldText(page, title, {
    x: margin,
    y: height - 120,
    size: 18,
    color: COLORS.text,
  })

  return height - 150 // Return Y position after header
}

export async function addFooter(
  doc: PDFDocument,
  page: PDFPage,
  pageNumber: number
): Promise<void> {
  const { width } = page.getSize()
  const margin = 50

  // Footer line
  page.drawLine({
    start: { x: margin, y: 70 },
    end: { x: width - margin, y: 70 },
    thickness: 1,
    color: COLORS.border,
  })

  // Company info
  await drawText(page, 'SeguroPro - Corredora de Seguros', {
    x: margin,
    y: 50,
    size: 9,
    color: COLORS.textLight,
  })

  await drawText(page, 'Santo Domingo, República Dominicana', {
    x: margin,
    y: 35,
    size: 8,
    color: COLORS.textLight,
  })

  // Page number
  await drawText(page, `Página ${pageNumber}`, {
    x: width - margin - 60,
    y: 50,
    size: 9,
    color: COLORS.textLight,
  })
}

export async function addSectionHeader(
  page: PDFPage,
  text: string,
  y: number
): Promise<number> {
  const margin = 50
  const { width } = page.getSize()

  // Background rectangle
  page.drawRectangle({
    x: margin,
    y: y - 20,
    width: width - margin * 2,
    height: 25,
    color: COLORS.background,
  })

  await drawBoldText(page, text, {
    x: margin + 10,
    y: y - 15,
    size: 12,
    color: COLORS.primary,
  })

  return y - 35
}

export async function addField(
  page: PDFPage,
  label: string,
  value: string,
  y: number,
  options: { bold?: boolean } = {}
): Promise<number> {
  const margin = 50
  const labelWidth = 150

  await drawBoldText(page, label + ':', {
    x: margin,
    y,
    size: 10,
    color: COLORS.textLight,
  })

  if (options.bold) {
    await drawBoldText(page, value, {
      x: margin + labelWidth,
      y,
      size: 10,
      color: COLORS.text,
    })
  } else {
    await drawText(page, value, {
      x: margin + labelWidth,
      y,
      size: 10,
      color: COLORS.text,
    })
  }

  return y - 18
}

export interface TableColumn {
  header: string
  key: string
  width: number
  align?: 'left' | 'center' | 'right'
}

export async function buildTable(
  page: PDFPage,
  columns: TableColumn[],
  rows: Record<string, any>[],
  startY: number
): Promise<number> {
  const margin = 50
  let currentY = startY
  const rowHeight = 25
  const headerHeight = 30

  // Draw header
  let currentX = margin
  for (const col of columns) {
    // Header background
    page.drawRectangle({
      x: currentX,
      y: currentY - headerHeight,
      width: col.width,
      height: headerHeight,
      color: COLORS.primary,
    })

    // Header text
    await drawBoldText(page, col.header, {
      x: currentX + 5,
      y: currentY - 20,
      size: 10,
      color: rgb(1, 1, 1), // White
    })

    currentX += col.width
  }

  currentY -= headerHeight

  // Draw rows
  for (const row of rows) {
    currentX = margin

    // Alternate row background
    page.drawRectangle({
      x: margin,
      y: currentY - rowHeight,
      width: currentX - margin + columns.reduce((sum, col) => sum + col.width, 0),
      height: rowHeight,
      color: rgb(0.98, 0.98, 0.98),
    })

    for (const col of columns) {
      const value = String(row[col.key] || '—')

      await drawText(page, value, {
        x: currentX + 5,
        y: currentY - 17,
        size: 9,
        color: COLORS.text,
        maxWidth: col.width - 10,
      })

      // Cell border
      page.drawRectangle({
        x: currentX,
        y: currentY - rowHeight,
        width: col.width,
        height: rowHeight,
        borderColor: COLORS.border,
        borderWidth: 0.5,
      })

      currentX += col.width
    }

    currentY -= rowHeight
  }

  return currentY - 10
}
