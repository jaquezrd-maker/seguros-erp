export default function handler(_req: any, res: any) {
  return res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
}
