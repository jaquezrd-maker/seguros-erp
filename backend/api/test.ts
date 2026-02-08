export default function handler(_req: any, res: any) {
  return res.json({
    status: 'ok',
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  })
}
