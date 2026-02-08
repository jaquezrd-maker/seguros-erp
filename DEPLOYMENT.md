# Guía de Deployment - SeguroPro

## Arquitectura de Deployment

Este proyecto consta de dos partes que deben desplegarse por separado:

### 1. Frontend (React + Vite) → Vercel
### 2. Backend (Express + Prisma) → Railway/Render

---

## 📦 Desplegar Frontend en Vercel

### Opción 1: Deployment desde Git (Recomendado)

1. **Sube el código a GitHub** (si aún no lo has hecho):
   ```bash
   # Crear repositorio en GitHub primero, luego:
   git remote add origin https://github.com/tu-usuario/seguros-erp.git
   git push -u origin master
   ```

2. **Conecta con Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Click en "Add New Project"
   - Importa tu repositorio de GitHub
   - Selecciona la carpeta `frontend` como "Root Directory"
   - Vercel detectará automáticamente Vite

3. **Configura las Variables de Entorno**:
   En la configuración del proyecto en Vercel, agrega:
   ```
   VITE_SUPABASE_URL=https://rqzmolpyqqajzzvbwtnd.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
   VITE_API_URL=https://tu-backend-url.railway.app/api
   ```

4. **Deploy**:
   - Click en "Deploy"
   - Espera a que el build termine
   - Tu app estará disponible en `https://tu-proyecto.vercel.app`

### Opción 2: Deployment desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la carpeta frontend
cd frontend

# Login en Vercel
vercel login

# Deploy
vercel

# Para producción
vercel --prod
```

---

## 🚂 Desplegar Backend en Railway

### Paso 1: Preparar el Proyecto

Ya está listo, pero verifica que tengas estos archivos:
- ✅ `backend/package.json` con scripts de build
- ✅ `backend/prisma/schema.prisma` configurado
- ✅ Variables de entorno en `.env`

### Paso 2: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Click en "Add variables" y agrega:

   ```
   NODE_ENV=production
   PORT=3000

   # Supabase
   SUPABASE_URL=https://rqzmolpyqqajzzvbwtnd.supabase.co
   SUPABASE_SERVICE_KEY=tu-service-key

   # Base de datos (Railway te dará esta URL automáticamente si agregas PostgreSQL)
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...

   # JWT (genera un secret fuerte)
   JWT_SECRET=tu-secret-super-secreto-y-largo
   ```

6. **Agregar PostgreSQL**:
   - Click en "New" → "Database" → "PostgreSQL"
   - Railway creará la base de datos y actualizará `DATABASE_URL`

7. **Configurar Build**:
   Railway detectará automáticamente Node.js, pero verifica:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Root Directory: `backend`

8. **Deploy**:
   - Railway desplegará automáticamente
   - Obtendrás una URL como `https://tu-app.railway.app`

### Paso 3: Ejecutar Migraciones

Desde tu local (una sola vez):
```bash
cd backend
# Actualizar DATABASE_URL en .env con la URL de Railway
npx prisma migrate deploy
npx prisma db seed
```

---

## 🔄 Actualizar Variables de Entorno

Después de desplegar el backend, **actualiza** la variable `VITE_API_URL` en Vercel:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Edita `VITE_API_URL` con la URL del backend de Railway
4. Ejemplo: `https://seguros-backend.railway.app/api`
5. Redeploy el frontend

---

## ✅ Verificar Deployment

### Frontend:
1. Abre `https://tu-proyecto.vercel.app`
2. Verifica que cargue la página de login
3. Verifica en DevTools que no haya errores 404

### Backend:
1. Prueba el endpoint de health: `https://tu-backend.railway.app/health`
2. Verifica logs en Railway Dashboard
3. Prueba login desde el frontend

### Integración:
1. Intenta hacer login con `admin@corredora.com.do` / `Admin123!`
2. Navega por los módulos
3. Crea una póliza de prueba

---

## 🛠️ Alternativas de Hosting

### Backend:
- **Railway** (Recomendado) - $5/mes, fácil setup
- **Render** - Free tier disponible
- **Fly.io** - Free tier disponible
- **Heroku** - Pago mensual

### Frontend:
- **Vercel** (Recomendado) - Free para proyectos personales
- **Netlify** - Free tier similar a Vercel
- **Cloudflare Pages** - Free tier generoso

---

## 🔒 Seguridad

Antes de ir a producción:

1. ✅ Cambia todas las contraseñas y secrets
2. ✅ Habilita CORS solo para tu dominio de frontend
3. ✅ Usa HTTPS en todas las URLs
4. ✅ Revisa los permisos de RBAC
5. ✅ Configura rate limiting en el backend
6. ✅ Habilita logs y monitoring

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel/Railway Dashboard
2. Verifica las variables de entorno
3. Asegúrate que las URLs no terminen con `/`
4. Verifica que Supabase esté configurado correctamente
