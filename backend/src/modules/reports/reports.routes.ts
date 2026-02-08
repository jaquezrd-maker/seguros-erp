import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { ReportsService } from './reports.service'

const router = Router()
const reportsService = new ReportsService()

// All routes require authentication
router.use(authMiddleware)

// GET /reports/dashboard — all roles
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const data = await reportsService.getDashboard()

    return res.status(200).json({
      success: true,
      data,
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener dashboard',
    })
  }
})

// GET /reports/sales — ADMIN, CONTABILIDAD
router.get(
  '/sales',
  rbacMiddleware(['ADMINISTRADOR', 'CONTABILIDAD']),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate y endDate son requeridos',
        })
      }

      const data = await reportsService.getSalesByPeriod(
        startDate as string,
        endDate as string
      )

      return res.status(200).json({
        success: true,
        data,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener reporte de ventas',
      })
    }
  }
)

// GET /reports/commissions — ADMIN, CONTABILIDAD
router.get(
  '/commissions',
  rbacMiddleware(['ADMINISTRADOR', 'CONTABILIDAD']),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate y endDate son requeridos',
        })
      }

      const data = await reportsService.getCommissionsByPeriod(
        startDate as string,
        endDate as string
      )

      return res.status(200).json({
        success: true,
        data,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener reporte de comisiones',
      })
    }
  }
)

// GET /reports/claims — ADMIN, EJECUTIVO
router.get(
  '/claims',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      const data = await reportsService.getClaimsReport(
        startDate as string | undefined,
        endDate as string | undefined
      )

      return res.status(200).json({
        success: true,
        data,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener reporte de reclamaciones',
      })
    }
  }
)

export default router
