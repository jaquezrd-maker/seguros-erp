import { Router } from 'express'
import quotationsController from './quotations.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createQuotationSchema, updateQuotationSchema, createProposalSchema, sendQuotationEmailSchema } from './quotations.validation'

const router = Router()

router.use(authMiddleware)

// Quotations
router.get('/', quotationsController.list)

// Sub-routes MUST be before /:id to avoid parameter conflict
router.get('/:id/pdf', quotationsController.downloadPdf)
router.get('/:id/email/preview', quotationsController.previewEmail)
router.post('/:id/email', validate(sendQuotationEmailSchema), quotationsController.sendEmail)

router.get('/:id', quotationsController.getById)
router.post('/', validate(createQuotationSchema), quotationsController.create)
router.put('/:id', validate(updateQuotationSchema), quotationsController.update)
router.patch('/:id/status', quotationsController.updateStatus)
router.delete('/:id', quotationsController.delete)

// Proposals
router.get('/proposals/list', quotationsController.listProposals)
router.get('/proposals/:id', quotationsController.getProposalById)
router.post('/proposals', validate(createProposalSchema), quotationsController.createProposal)
router.patch('/proposals/:id/status', quotationsController.updateProposalStatus)
router.post('/:id/generate-proposal', quotationsController.generateProposalFromQuotation)

export default router
