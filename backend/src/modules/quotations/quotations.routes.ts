import { Router } from 'express'
import quotationsController from './quotations.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createQuotationSchema, updateQuotationSchema, createProposalSchema } from './quotations.validation'

const router = Router()

router.use(authMiddleware)

// Quotations
router.get('/', quotationsController.list)
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
