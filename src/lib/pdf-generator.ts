import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate, formatDateTime } from './utils'

// Configuración de fuentes y colores
const PRIMARY_COLOR = '#3b82f6'
const SECONDARY_COLOR = '#64748b'
const SUCCESS_COLOR = '#10b981'
const WARNING_COLOR = '#f59e0b'
const DANGER_COLOR = '#ef4444'

// Función auxiliar para agregar header
function addHeader(doc: jsPDF, title: string) {
  // Logo/Título
  doc.setFillColor(PRIMARY_COLOR)
  doc.rect(0, 0, 210, 35, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('CMMS Plastics Pro', 15, 15)
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 15, 25)
  
  // Fecha de generación
  doc.setFontSize(9)
  doc.text(`Generado: ${formatDateTime(new Date())}`, 15, 31)
  
  // Reset color
  doc.setTextColor(0, 0, 0)
}

// Función auxiliar para agregar footer
function addFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(SECONDARY_COLOR)
  doc.text(
    `Página ${pageNumber}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 10,
    { align: 'center' }
  )
}

// Reporte de Orden de Trabajo
export function generateWorkOrderPDF(workOrder: any) {
  const doc = new jsPDF()
  
  addHeader(doc, 'Reporte de Orden de Trabajo')
  
  // Información básica
  let yPos = 45
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Información General', 15, yPos)
  
  yPos += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const info = [
    ['ID:', workOrder.id.slice(0, 8)],
    ['Título:', workOrder.title],
    ['Tipo:', workOrder.type],
    ['Estado:', workOrder.status],
    ['Prioridad:', workOrder.priority],
    ['Activo:', `${workOrder.asset.name} (${workOrder.asset.code})`],
    ['Técnico:', workOrder.technician.name],
    ['Creada:', formatDateTime(workOrder.createdAt)],
  ]
  
  if (workOrder.closedAt) {
    info.push(['Cerrada:', formatDateTime(workOrder.closedAt)])
  }
  
  info.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 15, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, yPos)
    yPos += 6
  })
  
  // Descripción
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text('Descripción:', 15, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')
  const splitDescription = doc.splitTextToSize(workOrder.description, 180)
  doc.text(splitDescription, 15, yPos)
  yPos += splitDescription.length * 5 + 10
  
  // Repuestos utilizados
  if (workOrder.partsUsed && workOrder.partsUsed.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('Repuestos Utilizados', 15, yPos)
    yPos += 5
    
    const tableData = workOrder.partsUsed.map((item: any) => [
      item.part.code,
      item.part.name,
      item.quantity.toString(),
      formatCurrency(item.part.price),
      formatCurrency(item.part.price * item.quantity),
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Código', 'Repuesto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR },
      styles: { fontSize: 9 },
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 10
  }
  
  // Resumen de costos
  const totalPartsCost = workOrder.partsUsed?.reduce(
    (acc: number, item: any) => acc + item.part.price * item.quantity,
    0
  ) || 0
  const laborCost = (workOrder.laborHours || 0) * 150
  const totalCost = totalPartsCost + laborCost
  
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen de Costos', 15, yPos)
  yPos += 7
  
  doc.setFont('helvetica', 'normal')
  doc.text('Costo de Repuestos:', 15, yPos)
  doc.text(formatCurrency(totalPartsCost), 180, yPos, { align: 'right' })
  yPos += 6
  
  doc.text(`Mano de Obra (${workOrder.laborHours || 0}h × $150):`, 15, yPos)
  doc.text(formatCurrency(laborCost), 180, yPos, { align: 'right' })
  yPos += 6
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Total:', 15, yPos)
  doc.text(formatCurrency(totalCost), 180, yPos, { align: 'right' })
  
  addFooter(doc, 1)
  
  return doc
}

// Reporte de Activo
export function generateAssetPDF(asset: any) {
  const doc = new jsPDF()
  
  addHeader(doc, 'Reporte de Activo')
  
  let yPos = 45
  
  // Información del activo
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Información del Activo', 15, yPos)
  
  yPos += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const info = [
    ['Nombre:', asset.name],
    ['Código:', asset.code],
    ['Área:', asset.area],
    ['Criticidad:', asset.criticality.toString()],
  ]
  
  if (asset.description) {
    info.push(['Descripción:', asset.description])
  }
  
  info.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 15, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, yPos)
    yPos += 6
  })
  
  // Estadísticas
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text('Estadísticas', 15, yPos)
  yPos += 7
  
  const totalDowntime = asset.failureLogs?.reduce(
    (acc: number, log: any) => acc + log.downtimeHours,
    0
  ) || 0
  
  const totalCost = asset.maintenanceLogs?.reduce(
    (acc: number, log: any) => acc + log.totalCost,
    0
  ) || 0
  
  const stats = [
    ['Total de Fallas:', asset.failureLogs?.length || 0],
    ['Downtime Total:', `${totalDowntime.toFixed(1)}h`],
    ['Órdenes de Trabajo:', asset.workOrders?.length || 0],
    ['Costo Total Mantenimiento:', formatCurrency(totalCost)],
  ]
  
  stats.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, 15, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(value.toString(), 100, yPos)
    yPos += 6
  })
  
  // Historial de fallas
  if (asset.failureLogs && asset.failureLogs.length > 0) {
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Historial de Fallas', 15, yPos)
    yPos += 5
    
    const tableData = asset.failureLogs.slice(0, 10).map((log: any) => [
      formatDate(log.reportedAt),
      log.symptom,
      log.rootCause || 'N/A',
      `${log.downtimeHours}h`,
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Síntoma', 'Causa Raíz', 'Downtime']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: DANGER_COLOR },
      styles: { fontSize: 8 },
      columnStyles: {
        1: { cellWidth: 60 },
        2: { cellWidth: 60 },
      },
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 10
  }
  
  // Historial de órdenes (nueva página si es necesario)
  if (asset.workOrders && asset.workOrders.length > 0) {
    if (yPos > 240) {
      doc.addPage()
      addHeader(doc, 'Reporte de Activo (continuación)')
      yPos = 45
    }
    
    doc.setFont('helvetica', 'bold')
    doc.text('Historial de Órdenes de Trabajo', 15, yPos)
    yPos += 5
    
    const tableData = asset.workOrders.slice(0, 15).map((order: any) => [
      formatDate(order.createdAt),
      order.title,
      order.type,
      order.status,
      order.technician?.name || 'N/A',
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Título', 'Tipo', 'Estado', 'Técnico']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR },
      styles: { fontSize: 8 },
      columnStyles: {
        1: { cellWidth: 60 },
      },
    })
  }
  
  addFooter(doc, 1)
  
  return doc
}

// Reporte de Inventario
export function generateInventoryPDF(parts: any[]) {
  const doc = new jsPDF()
  
  addHeader(doc, 'Reporte de Inventario')
  
  let yPos = 45
  
  // Resumen
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen de Inventario', 15, yPos)
  
  yPos += 7
  doc.setFontSize(10)
  
  const totalParts = parts.length
  const lowStockParts = parts.filter((p) => p.stock <= p.minStock).length
  const outOfStockParts = parts.filter((p) => p.stock === 0).length
  const totalValue = parts.reduce((acc, p) => acc + p.stock * p.price, 0)
  
  const summary = [
    ['Total de Repuestos:', totalParts],
    ['Stock Bajo:', lowStockParts],
    ['Sin Stock:', outOfStockParts],
    ['Valor Total:', formatCurrency(totalValue)],
  ]
  
  summary.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, 15, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(value.toString(), 100, yPos)
    yPos += 6
  })
  
  // Tabla de inventario
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle de Inventario', 15, yPos)
  yPos += 5
  
  const tableData = parts.map((part) => {
    const status =
      part.stock === 0
        ? 'Sin Stock'
        : part.stock <= part.minStock
        ? 'Stock Bajo'
        : 'OK'
    
    return [
      part.code,
      part.name,
      `${part.stock} ${part.unit}`,
      `${part.minStock} ${part.unit}`,
      formatCurrency(part.price),
      formatCurrency(part.stock * part.price),
      status,
    ]
  })
  
  autoTable(doc, {
    startY: yPos,
    head: [
      ['Código', 'Nombre', 'Stock', 'Mín.', 'Precio', 'Valor', 'Estado'],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR },
    styles: { fontSize: 8 },
    columnStyles: {
      1: { cellWidth: 50 },
    },
    didParseCell: function (data) {
      if (data.column.index === 6 && data.section === 'body') {
        const status = data.cell.text[0]
        if (status === 'Sin Stock') {
          data.cell.styles.textColor = [239, 68, 68] // red
          data.cell.styles.fontStyle = 'bold'
        } else if (status === 'Stock Bajo') {
          data.cell.styles.textColor = [245, 158, 11] // yellow
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [16, 185, 129] // green
        }
      }
    },
  })
  
  addFooter(doc, 1)
  
  return doc
}

// Reporte de Mantenimiento (Dashboard)
export function generateMaintenanceReportPDF(data: any) {
  const doc = new jsPDF()
  
  addHeader(doc, 'Reporte de Mantenimiento')
  
  let yPos = 45
  
  // KPIs principales
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Indicadores Clave (KPIs)', 15, yPos)
  
  yPos += 7
  doc.setFontSize(10)
  
  const kpis = [
    ['Órdenes Abiertas:', data.openWorkOrders || 0],
    ['MTTR Promedio:', `${data.mttr || 0}h`],
    ['Total de Activos:', data.totalAssets || 0],
    ['Alertas de Stock:', data.lowStockParts || 0],
    ['PMP:', `${data.pmpPercentage || 0}%`],
  ]
  
  kpis.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, 15, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(value.toString(), 100, yPos)
    yPos += 6
  })
  
  // Distribución de mantenimiento
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text('Distribución de Mantenimiento', 15, yPos)
  yPos += 7
  
  const distribution = [
    ['Preventivo:', data.preventive || 0],
    ['Correctivo:', data.corrective || 0],
    ['Predictivo:', data.predictive || 0],
    ['Total:', data.total || 0],
  ]
  
  distribution.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, 15, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(value.toString(), 100, yPos)
    yPos += 6
  })
  
  // Top fallas
  if (data.topFailures && data.topFailures.length > 0) {
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Top Fallas (Pareto)', 15, yPos)
    yPos += 5
    
    const tableData = data.topFailures.map((failure: any) => [
      failure.asset,
      failure.count.toString(),
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Activo', 'Cantidad de Fallas']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: DANGER_COLOR },
      styles: { fontSize: 9 },
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 10
  }
  
  // Órdenes recientes
  if (data.recentWorkOrders && data.recentWorkOrders.length > 0) {
    if (yPos > 240) {
      doc.addPage()
      addHeader(doc, 'Reporte de Mantenimiento (continuación)')
      yPos = 45
    }
    
    doc.setFont('helvetica', 'bold')
    doc.text('Órdenes de Trabajo Recientes', 15, yPos)
    yPos += 5
    
    const tableData = data.recentWorkOrders.map((order: any) => [
      formatDate(order.createdAt),
      order.title,
      order.asset.name,
      order.status,
      order.technician.name,
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Título', 'Activo', 'Estado', 'Técnico']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR },
      styles: { fontSize: 8 },
      columnStyles: {
        1: { cellWidth: 50 },
      },
    })
  }
  
  addFooter(doc, 1)
  
  return doc
}
