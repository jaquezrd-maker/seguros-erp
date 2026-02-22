import { z } from 'zod'

export const createQuotationSchema = z.object({
  body: z.object({
    clientId: z.number().optional(),
    clientName: z.string().min(1, 'Nombre del cliente requerido'),
    clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
    clientPhone: z.string().optional(),
    currency: z.string().default('DOP'),
    notes: z.string().optional(),
    validUntil: z.string().optional(),
    items: z.array(z.object({
      productId: z.number({ required_error: 'Producto requerido' }),
      planId: z.number({ required_error: 'Plan requerido' }),
      premium: z.number({ required_error: 'Prima requerida' }).positive('La prima debe ser positiva'),
      coverage: z.number().optional(),
      deductible: z.number().optional(),
      details: z.any().optional(),
    })).min(1, 'Debe incluir al menos un producto'),
  }),
})

export const updateQuotationSchema = z.object({
  body: z.object({
    clientId: z.number().optional(),
    clientName: z.string().min(1, 'Nombre del cliente requerido'),
    clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
    clientPhone: z.string().optional(),
    currency: z.string().optional(),
    notes: z.string().optional(),
    validUntil: z.string().optional(),
    items: z.array(z.object({
      productId: z.number(),
      planId: z.number(),
      premium: z.number().positive(),
      coverage: z.number().optional(),
      deductible: z.number().optional(),
      details: z.any().optional(),
    })).optional(),
  }),
})

export const sendQuotationEmailSchema = z.object({
  body: z.object({
    recipients: z.array(z.string()).min(1, 'Debe seleccionar al menos un destinatario'),
    includeAttachment: z.boolean().default(true),
    customSubject: z.string().optional(),
    customHtml: z.string().optional(),
  }),
})

export const createProposalSchema = z.object({
  body: z.object({
    quotationId: z.number().optional(),
    clientId: z.number().optional(),
    clientName: z.string().min(1, 'Nombre del cliente requerido'),
    clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
    totalPremium: z.number({ required_error: 'Prima total requerida' }).positive(),
    currency: z.string().default('DOP'),
    coverageSummary: z.any().optional(),
    terms: z.string().optional(),
    notes: z.string().optional(),
    validUntil: z.string().optional(),
  }),
})
