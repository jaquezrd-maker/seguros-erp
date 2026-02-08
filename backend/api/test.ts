import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.json({
    status: 'ok',
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  })
}
