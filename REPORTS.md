# 📄 Módulo de Reportes PDF - CMMS Plastics Pro

## 🎯 Descripción

El módulo de reportes permite generar documentos PDF profesionales con información detallada de órdenes de trabajo, activos, inventario y estadísticas generales de mantenimiento.

## 📊 Tipos de Reportes

### 1. Reporte General de Mantenimiento

**Ruta:** `/dashboard/reports/maintenance`

**Contenido:**
- Indicadores clave (KPIs)
  - Órdenes abiertas
  - MTTR promedio
  - Total de activos
  - Alertas de stock
- Porcentaje de Mantenimiento Preventivo (PMP)
- Distribución de mantenimiento (Preventivo, Correctivo, Predictivo)
- Top 5 fallas (Análisis de Pareto)
- Órdenes de trabajo recientes

**Uso:**
```typescript
import { generateMaintenanceReportPDF } from '@/lib/pdf-generator'

const data = await fetch('/api/reports/maintenance').then(r => r.json())
const doc = generateMaintenanceReportPDF(data)
doc.save('reporte-mantenimiento.pdf')
```

---

### 2. Reporte de Inventario

**Ruta:** `/dashboard/reports/inventory`

**Contenido:**
- Resumen de inventario
  - Total de repuestos
  - Repuestos con stock bajo
  - Repuestos sin stock
  - Valor total del inventario
- Tabla detallada con todos los repuestos
  - Código y nombre
  - Stock actual vs mínimo
  - Precio unitario
  - Valor total
  - Estado (OK, Stock Bajo, Sin Stock)

**Uso:**
```typescript
import { generateInventoryPDF } from '@/lib/pdf-generator'

const parts = await fetch('/api/inventory').then(r => r.json())
const doc = generateInventoryPDF(parts)
doc.save('reporte-inventario.pdf')
```

---

### 3. Reporte de Orden de Trabajo

**Ruta:** `/dashboard/reports/work-orders`

**Contenido:**
- Información general
  - ID, título, tipo, estado, prioridad
  - Activo asociado
  - Técnico asignado
  - Fechas de creación y cierre
- Descripción detallada
- Repuestos utilizados (tabla)
  - Código, nombre, cantidad
  - Precio unitario y subtotal
- Resumen de costos
  - Costo de repuestos
  - Costo de mano de obra
  - Total general

**Uso:**
```typescript
import { generateWorkOrderPDF } from '@/lib/pdf-generator'

const workOrder = await fetch(`/api/work-orders/${id}`).then(r => r.json())
const doc = generateWorkOrderPDF(workOrder)
doc.save(`orden-trabajo-${id}.pdf`)
```

**Acceso directo:**
- Desde la página de detalle de la orden
- Botón "Generar PDF" en el panel de acciones

---

### 4. Reporte de Activo

**Ruta:** `/dashboard/reports/assets`

**Contenido:**
- Información del activo
  - Nombre, código, área, criticidad
  - Descripción
- Estadísticas
  - Total de fallas
  - Downtime acumulado
  - Órdenes de trabajo totales
  - Costo total de mantenimiento
- Historial de fallas (tabla)
  - Fecha, síntoma, causa raíz, downtime
- Historial de órdenes de trabajo (tabla)
  - Fecha, título, tipo, estado, técnico

**Uso:**
```typescript
import { generateAssetPDF } from '@/lib/pdf-generator'

const asset = await fetch(`/api/reports/assets/${id}`).then(r => r.json())
const doc = generateAssetPDF(asset)
doc.save(`activo-${code}.pdf`)
```

**Acceso directo:**
- Desde la página de detalle del activo
- Botón "Generar PDF" en el header

---

## 🎨 Diseño de los PDFs

### Header
- Logo/Título: "CMMS Plastics Pro"
- Título del reporte
- Fecha de generación

### Contenido
- Secciones claramente definidas
- Tablas con formato profesional
- Colores por estado:
  - Azul (#3b82f6): Primary
  - Verde (#10b981): Success/OK
  - Amarillo (#f59e0b): Warning/Stock Bajo
  - Rojo (#ef4444): Danger/Sin Stock
- Tipografía Helvetica

### Footer
- Número de página centrado

---

## 🛠️ Tecnologías Utilizadas

### jsPDF
Librería principal para generación de PDFs

```bash
npm install jspdf
```

### jspdf-autotable
Plugin para crear tablas formateadas

```bash
npm install jspdf-autotable
```

---

## 📁 Estructura de Archivos

```
src/
├── lib/
│   └── pdf-generator.ts              # Funciones de generación
├── app/
│   └── dashboard/
│       └── reports/
│           ├── page.tsx              # Grid de reportes
│           ├── maintenance/
│           │   └── page.tsx          # Reporte de mantenimiento
│           ├── inventory/
│           │   └── page.tsx          # Reporte de inventario
│           ├── work-orders/
│           │   └── page.tsx          # Lista de órdenes
│           └── assets/
│               └── page.tsx          # Lista de activos
├── components/
│   └── reports/
│       ├── reports-grid.tsx          # Grid principal
│       ├── work-orders-report-list.tsx
│       └── assets-report-list.tsx
└── app/api/
    └── reports/
        ├── maintenance/
        │   └── route.ts              # API para datos
        └── assets/
            └── [id]/
                └── route.ts          # API para activo
```

---

## 🔧 Personalización

### Cambiar Colores

Editar en `src/lib/pdf-generator.ts`:

```typescript
const PRIMARY_COLOR = '#3b82f6'
const SECONDARY_COLOR = '#64748b'
const SUCCESS_COLOR = '#10b981'
const WARNING_COLOR = '#f59e0b'
const DANGER_COLOR = '#ef4444'
```

### Cambiar Logo/Header

Modificar la función `addHeader()`:

```typescript
function addHeader(doc: jsPDF, title: string) {
  // Personalizar aquí
  doc.setFillColor(PRIMARY_COLOR)
  doc.rect(0, 0, 210, 35, 'F')
  // ...
}
```

### Agregar Nuevo Tipo de Reporte

1. Crear función en `pdf-generator.ts`:
```typescript
export function generateMyCustomPDF(data: any) {
  const doc = new jsPDF()
  addHeader(doc, 'Mi Reporte Personalizado')
  // ... contenido
  return doc
}
```

2. Crear página en `app/dashboard/reports/`:
```typescript
// my-report/page.tsx
import { generateMyCustomPDF } from '@/lib/pdf-generator'
```

3. Agregar al grid de reportes

---

## 📊 Ejemplos de Uso

### Generar desde Componente

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { generateWorkOrderPDF } from '@/lib/pdf-generator'

export function MyComponent({ workOrder }) {
  function handleDownload() {
    const doc = generateWorkOrderPDF(workOrder)
    doc.save('mi-reporte.pdf')
  }

  return (
    <Button onClick={handleDownload}>
      Descargar PDF
    </Button>
  )
}
```

### Generar desde API Route

```typescript
import { NextResponse } from 'next/server'
import { generateWorkOrderPDF } from '@/lib/pdf-generator'

export async function GET(request: Request) {
  const workOrder = await getWorkOrder()
  const doc = generateWorkOrderPDF(workOrder)
  
  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="reporte.pdf"',
    },
  })
}
```

---

## 🎯 Mejores Prácticas

1. **Validar datos antes de generar**
   - Verificar que todos los campos requeridos existan
   - Manejar valores null/undefined

2. **Optimizar tamaño de PDF**
   - Limitar número de registros en tablas
   - Usar paginación si es necesario

3. **Feedback al usuario**
   - Mostrar loading state durante generación
   - Confirmar descarga exitosa

4. **Nombres de archivo descriptivos**
   - Incluir fecha: `reporte-2024-01-15.pdf`
   - Incluir identificador: `orden-ABC123.pdf`

5. **Manejo de errores**
   - Try/catch en generación
   - Mensajes de error claros al usuario

---

## 🐛 Troubleshooting

### PDF no se descarga

**Problema:** El PDF se genera pero no se descarga

**Solución:**
```typescript
// Asegurarse de usar .save()
doc.save('nombre-archivo.pdf')
```

### Tablas cortadas

**Problema:** Las tablas se cortan entre páginas

**Solución:**
```typescript
autoTable(doc, {
  // ...
  showHead: 'everyPage', // Repetir header en cada página
  margin: { top: 40 },   // Espacio para header
})
```

### Caracteres especiales

**Problema:** Acentos o ñ no se muestran correctamente

**Solución:** jsPDF usa Helvetica por defecto que soporta caracteres latinos. Si persiste:
```typescript
doc.setFont('helvetica')
```

### Imágenes no aparecen

**Problema:** Las imágenes no se muestran en el PDF

**Solución:** Convertir imágenes a base64 antes de agregarlas:
```typescript
doc.addImage(imageBase64, 'JPEG', x, y, width, height)
```

---

## 📚 Recursos Adicionales

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [jspdf-autotable Documentation](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [PDF Best Practices](https://www.pdfa.org/resource/pdf-best-practices/)

---

**Desarrollado con ❤️ para CMMS Plastics Pro**
