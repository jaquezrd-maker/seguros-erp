# Variables de Entorno para Vercel

## Backend (API)

Configurar las siguientes variables en el proyecto de Vercel del backend:

### Supabase
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Database (Neon PostgreSQL)
```
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

### Email (SendGrid)
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### App Configuration
```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
```

### Redis (Opcional - si usas Upstash o similar)
```
REDIS_URL=redis://your-redis-url:6379
```

### WhatsApp (Opcional - si lo usas)
```
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_ID=your-phone-id
```

## Frontend

Configurar las siguientes variables en el proyecto de Vercel del frontend:

### API URL
```
VITE_API_URL=https://your-backend.vercel.app
```

### Supabase (Frontend)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Instrucciones para configurar en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings > Environment Variables
3. Agrega cada variable con su valor
4. Selecciona los entornos donde aplicarán (Production, Preview, Development)
5. Guarda y redeploy el proyecto

## Notas Importantes

⚠️ **NUNCA** commitear archivos .env a git
⚠️ Copia este archivo a `VERCEL_ENV.md` y completa con tus credenciales reales (no commitear)
⚠️ Después de actualizar variables de entorno, debes redeployar el proyecto en Vercel

## Obtener las credenciales

- **Supabase**: Project Settings > API
- **Neon Database**: Connection Details en tu proyecto
- **SendGrid**: Settings > API Keys
- **WhatsApp Business API**: Meta Developer Console
