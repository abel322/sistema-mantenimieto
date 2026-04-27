# 🚀 Guía de Inicio Rápido - CMMS Plastics Pro

## ⚡ Instalación en 5 Minutos

### Prerrequisitos
- Node.js 20+ instalado
- PostgreSQL 14+ instalado y corriendo
- Git instalado

### Paso 1: Clonar y Configurar

```bash
# Clonar el repositorio
git clone <repository-url>
cd cmms-plastics-pro

# Instalar dependencias
npm install
```

### Paso 2: Configurar Base de Datos

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
# DATABASE_URL="postgresql://user:password@localhost:5432/cmms_plastics"
```

### Paso 3: Inicializar Base de Datos

```bash
# Crear tablas
npm run db:push

# Poblar con datos de ejemplo
npm run db:seed
```

### Paso 4: Iniciar Aplicación

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) 🎉

### Paso 5: Iniciar Sesión

Usa cualquiera de estos usuarios de prueba:

- **Admin**: admin@cmms.com / password123
- **Técnico**: juan@cmms.com / password123

---

## 🐳 Inicio Rápido con Docker

Si prefieres usar Docker:

```bash
# Iniciar todo (app + database)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ejecutar migrations
docker-compose exec app npx prisma db push

# Ejecutar seed
docker-compose exec app npm run db:seed
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 📊 Datos de Ejemplo Incluidos

Después del seed tendrás:

### Usuarios
- 1 Administrador
- 2 Técnicos

### Activos
- 2 Extrusoras
- 1 Impresora Flexográfica
- 1 Bolsera
- 1 Compresor

### Repuestos
- 6 tipos de repuestos
- Algunos con stock bajo (para probar alertas)

### Órdenes de Trabajo
- 3 órdenes de ejemplo (Abierta, En Progreso, Cerrada)

### Programaciones
- 3 programaciones de mantenimiento
- Una vencida (para probar alertas)

### Fallas Registradas
- 4 fallas históricas para análisis

---

## 🎯 Primeros Pasos en la Aplicación

### 1. Explorar el Dashboard
- Ver KPIs principales (MTTR, OEE, etc.)
- Revisar alertas de stock bajo
- Ver órdenes de trabajo recientes

### 2. Crear una Orden de Trabajo
1. Ir a "Órdenes de Trabajo"
2. Click en "Nueva Orden"
3. Llenar formulario
4. Guardar

### 3. Gestionar Inventario
1. Ir a "Inventario"
2. Ver repuestos con stock bajo
3. Click en un repuesto para ver detalles

### 4. Programar Mantenimiento
1. Ir a "Programación"
2. Click en "Nueva Programación"
3. Seleccionar activo y frecuencia
4. Guardar

### 5. Ver Activos
1. Ir a "Activos"
2. Click en un activo
3. Ver historial de mantenimiento y fallas

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build para producción
npm run start            # Iniciar servidor de producción
npm run lint             # Ejecutar linter

# Base de Datos
npm run db:push          # Aplicar cambios al schema
npm run db:studio        # Abrir Prisma Studio (GUI)
npm run db:generate      # Generar Prisma Client
npm run db:seed          # Poblar con datos de ejemplo

# Docker
docker-compose up -d     # Iniciar servicios
docker-compose down      # Detener servicios
docker-compose logs -f   # Ver logs en tiempo real
```

---

## 📁 Estructura del Proyecto

```
cmms-plastics-pro/
├── src/
│   ├── app/              # Páginas y rutas (Next.js App Router)
│   ├── components/       # Componentes React
│   └── lib/              # Utilidades y configuración
├── prisma/
│   ├── schema.prisma     # Modelo de datos
│   └── seed.ts           # Datos iniciales
├── public/               # Assets estáticos
└── package.json
```

---

## 🔧 Configuración Avanzada

### Cambiar Puerto

```bash
# En .env
PORT=4000

# O al ejecutar
PORT=4000 npm run dev
```

### Usar Base de Datos Externa

```bash
# En .env
DATABASE_URL="postgresql://user:pass@external-host:5432/dbname"
```

### Habilitar Logs de Prisma

```typescript
// src/lib/prisma.ts
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot connect to database"

**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
# Windows
services.msc  # Buscar PostgreSQL

# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Verificar credenciales en .env
```

### Error: "Module not found"

**Solución:**
```bash
rm -rf node_modules .next
npm install
```

### Error: "Prisma Client not generated"

**Solución:**
```bash
npx prisma generate
```

### Puerto 3000 ya en uso

**Solución:**
```bash
# Cambiar puerto
PORT=3001 npm run dev

# O matar proceso en puerto 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Próximos Pasos

1. **Leer la documentación completa**: [README.md](README.md)
2. **Entender la arquitectura**: [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Preparar deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Personalizar la aplicación** según tus necesidades

---

## 🆘 ¿Necesitas Ayuda?

- 📖 Documentación completa: [README.md](README.md)
- 🐛 Reportar bugs: GitHub Issues
- 💬 Preguntas: support@cmmsplastics.com

---

**¡Listo para empezar! 🚀**
