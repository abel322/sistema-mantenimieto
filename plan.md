# CMMS Plastics Pro - Arquitectura y Especificaciones Técnicas

Sistema integral de gestión de mantenimiento asistido por computadora (CMMS) diseñado específicamente para la industria de extrusión, impresión y corte/sellado de plásticos.

## 🚀 Stack Tecnológico
- **Framework:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma
- **Estilos:** Tailwind CSS + Shadcn/UI
- **Gráficos:** Recharts / Tremor (para el Dashboard)
- **Autenticación:** NextAuth.js

---

## 🏗️ 1. Módulos Core de la Aplicación

### A. Gestión de Activos (Jerarquía)
Estructura jerárquica para trazabilidad exacta de las fallas:
- **Áreas:** Extrusión, Impresión, Sellado/Corte, Servicios Auxiliares.
- **Máquinas:** Extrusora 1, Bolsera 3.
- **Componentes:** Motores, Resistencias, Husillos, Rodillos, Cuchillas.

### B. Inventario de Repuestos y Consumibles
- Control de stock de piezas críticas (Teflón, resistencias tipo banda, cuchillas, mallas, sensores).
- Alertas de stock mínimo.
- Vinculación de repuestos a Órdenes de Trabajo (OT) para cálculo de costos automáticos.

### C. Mantenimiento y Órdenes de Trabajo (OT)
- **Correctivo:** Reporte de fallas (con fotos) directo desde piso de planta.
- **Preventivo:** Asignación de tareas antes de que ocurra la falla.
- **Estados:** Abierta, En Progreso, En Pausa (espera de repuesto), Cerrada.

---

## 📅 2. Módulo de Programación (Planner)
Permite estructurar el mantenimiento proactivo para evitar paradas imprevistas.
- **Programación por Frecuencia:** Alertas automatizadas por calendario (ej. mensual).
- **Programación por Uso:** Basado en horas de máquina operativas o metros producidos.
- **Calendario Maestro:** Vista mensual para asignar técnicos y balancear la carga de trabajo de la planta.

---

## 📊 3. Dashboard y KPIs (Panel Gerencial)
Panel de control en tiempo real para visualizar la salud operativa de la planta.

| KPI | Descripción | Objetivo |
| :--- | :--- | :--- |
| **OEE** | Eficacia General de Equipos (Disp. x Rend. x Calidad) | Métrica global de productividad. |
| **MTBF** | Tiempo Medio Entre Fallas | Aumentar el tiempo operativo continuo. |
| **MTTR** | Tiempo Medio de Reparación | Reducir el tiempo de respuesta de los técnicos. |
| **PMP** | Porcentaje de Mantenimiento Preventivo | Mantener el ratio preventivo > correctivo. |
| **Costos Totales** | Suma de repuestos consumidos + Horas hombre | Control presupuestario por área/máquina. |
| **Top Fallas** | Gráfico de Pareto (80/20) | Identificar las máquinas o piezas más problemáticas. |

---

## 📝 4. Listas de Actividades (Checklists Dinámicos)
Pasos obligatorios integrados en las OT según el tipo de máquina.

### Extrusión de Película
- [ ] Revisión y limpieza de filtros de aire de motores principales.
- [ ] Verificación de amperaje y termografía en zonas de calentamiento (cañón y cabezal).
- [ ] Cambio programado de mallas (screen packs).
- [ ] Lubricación de rodamientos de rodillos haladores y bobinadores.

### Corte y Sellado (Bolseras)
- [ ] Cambio de cinta teflonada y limpieza de barra selladora.
- [ ] Afiliado/rotación de cuchillas de corte.
- [ ] Calibración de fotoceldas de registro para bolsas impresas.
- [ ] Ajuste de tensión en correas transportadoras.

---

## 📜 5. Gestión de Historiales

### Historial de Fallas (Log de Averías)
- Registro independiente de las OT para aislar el análisis de problemas.
- **Datos:** Máquina, Síntoma, Causa Raíz (Análisis de los 5 Porqués), Horas de Inactividad (Downtime).

### Historial de Mantenimiento (Hoja de Vida del Activo)
- Consolidado histórico de todo lo realizado en una máquina.
- **Datos:** Fechas de intervención, OT vinculadas, resumen de la reparación, técnico responsable y costo total acumulado.

---

## 🗄️ 6. Modelo de Datos Completo (Prisma Schema)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Asset {
  id              String           @id @default(uuid())
  name            String
  code            String           @unique // Ej: EXT-01
  area            String           // EXTRUSION, IMPRESION, SELLADO
  criticality     Int              // 1 (Baja) a 3 (Alta)
  workOrders      WorkOrder[]
  maintenanceLogs MaintenanceLog[]
  failureLogs     FailureLog[]
  schedules       Schedule[]
}

model WorkOrder {
  id           String        @id @default(cuid())
  title        String
  description  String
  type         OrderType     
  status       Status        @default(OPEN)
  priority     Priority      @default(MEDIUM)
  assetId      String
  asset        Asset         @relation(fields: [assetId], references: [id])
  checklist    Json?         // [{ task: "Limpiar teflón", done: true }]
  partsUsed    PartOnOrder[] // Repuestos consumidos en esta OT
  technicianId String
  createdAt    DateTime      @default(now())
  closedAt     DateTime?
}

model Part {
  id         String        @id @default(uuid())
  name       String
  stock      Int
  minStock   Int
  price      Float
  workOrders PartOnOrder[]
}

// Tabla pivote para relación Muchos a Muchos entre Repuestos y Órdenes
model PartOnOrder {
  id          String    @id @default(uuid())
  workOrderId String
  partId      String
  quantity    Int
  workOrder   WorkOrder @relation(fields: [workOrderId], references: [id])
  part        Part      @relation(fields: [partId], references: [id])
}

model Schedule {
  id            String   @id @default(uuid())
  assetId       String
  asset         Asset    @relation(fields: [assetId], references: [id])
  frequencyDays Int?     // Ciclo en días
  nextDueDate   DateTime
  taskTemplate  String   // Tarea a programar
}

model FailureLog {
  id            String   @id @default(uuid())
  assetId       String
  asset         Asset    @relation(fields: [assetId], references: [id])
  symptom       String
  rootCause     String
  downtimeHours Float    // Impacto en la producción
  reportedAt    DateTime @default(now())
}

model MaintenanceLog {
  id            String   @id @default(uuid())
  assetId       String
  asset         Asset    @relation(fields: [assetId], references: [id])
  workOrderId   String   @unique
  summary       String
  totalCost     Float    // Costo de repuestos + labor
  executionDate DateTime @default(now())
}

enum OrderType { PREVENTIVE; CORRECTIVE; PREDICTIVE }
enum Status { OPEN; IN_PROGRESS; ON_HOLD; CLOSED }
enum Priority { LOW; MEDIUM; HIGH; CRITICAL }