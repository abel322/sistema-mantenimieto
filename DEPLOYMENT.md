# Guía de Deployment - CMMS Plastics Pro

## 🚀 Opciones de Deployment

### 1. Vercel (Recomendado para MVP)

**Ventajas:**
- Deploy automático desde GitHub
- Preview deployments
- Edge functions
- CDN global
- SSL automático

**Pasos:**

1. **Conectar repositorio**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

2. **Configurar variables de entorno en Vercel Dashboard**
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=tu-secret-key
```

3. **Configurar base de datos**
- Usar Supabase (PostgreSQL managed)
- O Neon (PostgreSQL serverless)
- O PlanetScale (MySQL serverless)

4. **Deploy**
```bash
vercel --prod
```

### 2. Railway

**Ventajas:**
- PostgreSQL incluido
- Deploy desde GitHub
- Pricing simple
- Logs en tiempo real

**Pasos:**

1. **Crear cuenta en Railway.app**

2. **Crear nuevo proyecto**
- New Project → Deploy from GitHub
- Seleccionar repositorio

3. **Agregar PostgreSQL**
- Add Service → Database → PostgreSQL

4. **Configurar variables de entorno**
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=tu-secret-key
```

5. **Deploy automático**
- Cada push a main despliega automáticamente

### 3. Fly.io

**Ventajas:**
- Deploy global (edge)
- PostgreSQL managed
- Pricing competitivo
- Excelente performance

**Pasos:**

1. **Instalar Fly CLI**
```bash
# macOS
brew install flyctl

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux
curl -L https://fly.io/install.sh | sh
```

2. **Login**
```bash
fly auth login
```

3. **Crear app**
```bash
fly launch
```

4. **Crear PostgreSQL**
```bash
fly postgres create
fly postgres attach <postgres-app-name>
```

5. **Configurar secrets**
```bash
fly secrets set NEXTAUTH_SECRET=tu-secret-key
```

6. **Deploy**
```bash
fly deploy
```

### 4. Docker + VPS (DigitalOcean, AWS, etc.)

**Ventajas:**
- Control total
- Costo predecible
- Personalización completa

**Pasos:**

1. **Build imagen**
```bash
docker build -t cmms-plastics-pro .
```

2. **Crear docker-compose.yml** (ya incluido)

3. **Deploy en VPS**
```bash
# Conectar a VPS
ssh user@your-server.com

# Clonar repositorio
git clone <repo-url>
cd cmms-plastics-pro

# Configurar .env
cp .env.example .env
nano .env

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

4. **Configurar Nginx (reverse proxy)**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Configurar SSL con Certbot**
```bash
sudo certbot --nginx -d tu-dominio.com
```

## 🗄️ Base de Datos

### Opciones Managed

#### Supabase (Recomendado)
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

**Ventajas:**
- PostgreSQL managed
- Auth incluido
- Storage incluido
- Real-time subscriptions
- Free tier generoso

#### Neon
```env
DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]"
```

**Ventajas:**
- PostgreSQL serverless
- Branching (como Git)
- Auto-scaling
- Free tier

#### PlanetScale
```env
DATABASE_URL="mysql://[user]:[password]@[host]/[database]?sslaccept=strict"
```

**Ventajas:**
- MySQL serverless
- Branching
- No downtime migrations
- Free tier

### Self-Hosted

#### PostgreSQL en Docker
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cmms_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: cmms_plastics
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
```

## 🔐 Variables de Entorno

### Producción
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
```

### Generar NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

## 📊 Monitoreo

### Sentry (Error Tracking)

1. **Instalar**
```bash
npm install @sentry/nextjs
```

2. **Configurar**
```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🔄 CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🔧 Mantenimiento

### Backups de Base de Datos

#### Automático (Railway/Supabase)
- Backups diarios automáticos
- Point-in-time recovery

#### Manual
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### Migrations

```bash
# Crear migration
npx prisma migrate dev --name add_new_field

# Aplicar en producción
npx prisma migrate deploy
```

### Logs

```bash
# Vercel
vercel logs

# Railway
railway logs

# Docker
docker-compose logs -f app
```

## 📈 Escalabilidad

### Horizontal Scaling

1. **Load Balancer**
```nginx
upstream backend {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}
```

2. **Database Replication**
- Read replicas
- Connection pooling (PgBouncer)

3. **CDN**
- Cloudflare
- Vercel Edge Network

### Vertical Scaling

1. **Aumentar recursos**
- CPU
- RAM
- Storage

2. **Optimizar queries**
- Índices
- Query optimization
- Caching

## ✅ Checklist Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] Database migrations ejecutadas
- [ ] Secrets seguros (no hardcoded)
- [ ] HTTPS configurado
- [ ] Backups automáticos activos
- [ ] Monitoreo configurado (Sentry)
- [ ] Logs accesibles
- [ ] Health check endpoint
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Error: "Module not found"
```bash
# Limpiar cache
rm -rf .next node_modules
npm install
npm run build
```

### Error: "Prisma Client not generated"
```bash
npx prisma generate
```

---

**¿Necesitas ayuda?** Abre un issue en GitHub o contacta a support@cmmsplastics.com
