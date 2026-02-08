import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'

const router = Router()

router.get('/env-check', (req, res) => {
  res.json({
    success: true,
    data: {
      supabaseUrl: process.env.SUPABASE_URL || 'NOT_SET',
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) || 'NOT_SET',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 50) || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV || 'NOT_SET',
    },
  })
})

router.post('/verify-token', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.json({ success: false, message: 'No token provided' })
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error) {
      return res.json({
        success: false,
        error: {
          message: error.message,
          status: error.status,
          name: error.name,
        },
      })
    }

    return res.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
      },
    })
  } catch (err: any) {
    return res.json({
      success: false,
      catchError: {
        message: err.message,
        stack: err.stack,
      },
    })
  }
})

export default router
