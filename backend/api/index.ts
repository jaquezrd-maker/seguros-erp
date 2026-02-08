export default async function handler(req: any, res: any) {
  try {
    console.log('[API] Loading Express app...')
    const { default: app } = await import('../src/app')
    console.log('[API] Express app loaded successfully')
    return app(req, res)
  } catch (error: any) {
    console.error('[API] Error loading Express app:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
