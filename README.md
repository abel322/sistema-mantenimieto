# CMMS Plastics Pro

Sistema integral de gestión de mantenimiento asistido por computadora (CMMS) diseñado específicamente para la industria de extrusión, impresión y corte/sellado de plásticos.

## 🚀 Características Principales

### 📊 Dashboard con KPIs
- **OEE** (Eficacia General de Equipos)
- **MTBF** (Tiempo Medio Entre Fallas)
- **MTTR** (Tiempo Medio de Reparación)
- **PMP** (Porcentaje de Mantenimiento Preventivo)
- Análisis de costos totales
- Gráfico de Pareto para identificar top fallas

### 🏗️ Gestión de Activos
- Estructura jerárquica: Áreas → Máquinas → Componentes
- Trazabilidad completa de fallas
- Historial de mantenimiento por activo
- Clasificación por criticidad

### 📦 Inventario de Repuestos
- Control de stock con alertas automáticas
- Vinculación a órdenes de trabajo
- Cálculo automático de costos
- Categorización de repuestos

### 🔧 Órdenes de Trabajo
- **Correctivo**: Reporte de fallas desde piso de planta
- **Preventivo**: Tareas programadas
- **Predictivo**: Mantenimiento basado en condición
- Estados: Abierta, En Progreso, En Pausa, Cerrada
- Checklists dinámicos por tipo de máquina

### 📅 Programación de Mantenimiento
- Por frecuencia (calendario)
- Por uso (horas de máquina o metros producidos)
- Calendario maestro para asignación de técnicos
- Alertas automáticas de vencimiento

### 📝 Historiales
- **Log de Fallas**: Análisis de causa raíz (5 Porqués)
- **Hoja de Vida**: Historial completo por activo
- Registro de downtime (horas de inactividad)

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Estilos**: Tailwind CSS + Shadcn/UI
- **Autenticación**: NextAuth.js
- **Estado**: Zustand + TanStack Query

## 📋 Requisitos Previos

- Node.js 20+
- PostgreSQL 14+
- npm o yarn

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd cmms-plastics-pro
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cmms_plastics"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-aqui"
```

4. **Configurar la base de datos**
```bash
# Crear las tablas
npm run db:push

# Poblar con datos de ejemplo
npx tsx prisma/seed.ts
```

5. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## 👥 Usuarios de Prueba

Después de ejecutar el seed, puedes iniciar sesión con:

- **Admin**: admin@cmms.com / password123
- **Técnico 1**: juan@cmms.com / password123
- **Técnico 2**: maria@cmms.com / password123

## 📁 Estructura del Proyecto

```
cmms-plastics-pro/
├── prisma/
│   ├── schema.prisma      # Modelo de datos
│   └── seed.ts            # Datos iniciales
├── src/
│   ├── app/
│   │   ├── dashboard/     # Páginas del dashboard
│   │   ├── api/           # API Routes
│   │   └── layout.tsx     # Layout principal
│   ├── components/
│   │   ├── ui/            # Componentes base (shadcn)
│   │   ├── dashboard/     # Componentes del dashboard
│   │   ├── work-orders/   # Componentes de OT
│   │   ├── assets/        # Componentes de activos
│   │   ├── inventory/     # Componentes de inventario
│   │   └── schedule/      # Componentes de programación
│   └── lib/
│       ├── prisma.ts      # Cliente de Prisma
│       └── utils.ts       # Utilidades
└── package.json
```

## 🗄️ Modelo de Datos

### Entidades Principales

- **User**: Usuarios del sistema (Admin, Supervisor, Técnico)
- **Asset**: Activos/Máquinas
- **WorkOrder**: Órdenes de trabajo
- **Part**: Repuestos e insumos
- **Schedule**: Programación de mantenimiento
- **FailureLog**: Registro de fallas
- **MaintenanceLog**: Historial de mantenimiento

## 📊 KPIs Implementados

### OEE (Overall Equipment Effectiveness)
```
OEE = Disponibilidad × Rendimiento × Calidad
```

### MTBF (Mean Time Between Failures)
```
MTBF = Tiempo Total Operativo / Número de Fallas
```

### MTTR (Mean Time To Repair)
```
MTTR = Tiempo Total de Reparación / Número de Reparaciones
```

### PMP (Porcentaje de Mantenimiento Preventivo)
```
PMP = (OT Preventivas / OT Totales) × 100
```
**Objetivo**: Mantener > 60%

## 🔐 Seguridad

- Autenticación con NextAuth.js
- Passwords hasheados con bcrypt
- Variables de entorno para secrets
- Validación de inputs con Zod
- Protección CSRF
- SQL injection prevention (Prisma ORM)

## 🚀 Deployment

### Vercel (Recomendado para Frontend)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push

### Railway (Backend + Database)

1. Crear proyecto en Railway
2. Agregar PostgreSQL
3. Configurar variables de entorno
4. Deploy

### Docker

```bash
docker-compose up -d
```

## ✅ Funcionalidades Implementadas (Actualización)

### Autenticación Completa
- ✅ Login con NextAuth.js
- ✅ Protección de rutas con middleware
- ✅ Roles de usuario (Admin, Supervisor, Técnico)
- ✅ Sesiones JWT
- ✅ Logout funcional

### Páginas de Detalle
- ✅ Detalle completo de órdenes de trabajo
- ✅ Cambio de estado de órdenes (Abrir, Iniciar, Pausar, Completar)
- ✅ Detalle de activos con historial completo
- ✅ Detalle de repuestos con ajuste de stock
- ✅ Cálculo automático de costos

### Reportes en PDF
- ✅ Reporte general de mantenimiento (KPIs, distribución, top fallas)
- ✅ Reporte de inventario completo
- ✅ Reportes individuales de órdenes de trabajo
- ✅ Reportes individuales de activos con historial
- ✅ Generación de PDF con jsPDF y jspdf-autotable
- ✅ Botones de descarga en páginas de detalle
- ✅ Diseño profesional con header y footer
- ✅ Tablas formateadas y colores por estado

### Formularios CRUD Completos
- ✅ Crear/editar órdenes de trabajo
- ✅ Crear/editar activos
- ✅ Crear/editar repuestos
- ✅ Crear programaciones de mantenimiento
- ✅ Ajustar stock de inventario

### Gestión de Stock
- ✅ Agregar stock (entrada)
- ✅ Retirar stock (salida)
- ✅ Historial de uso por repuesto
- ✅ Alertas visuales de stock bajo

## 📈 Roadmap Futuro

- [x] Módulo de reportes PDF ✅
- [ ] Notificaciones push en tiempo real
- [ ] App móvil (React Native)
- [ ] Integración con sensores IoT
- [ ] Machine Learning para mantenimiento predictivo
- [ ] API REST pública documentada
- [ ] Multi-tenancy para múltiples plantas
- [ ] Carga de imágenes para activos y OT
- [ ] Gráficos interactivos avanzados (Recharts)
- [ ] Exportación de datos (Excel, CSV)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para soporte, envía un email a support@cmmsplastics.com o abre un issue en GitHub.

---

**Desarrollado con ❤️ usando el sistema Prompt Maestro**
