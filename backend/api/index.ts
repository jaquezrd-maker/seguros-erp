export default async function handler(req: any, res: any) {
  const { default: app } = await import('../src/app')
  return app(req, res)
}
