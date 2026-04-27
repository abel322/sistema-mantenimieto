import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear usuarios
  const hashedPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cmms.com' },
    update: {},
    create: {
      email: 'admin@cmms.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const tech1 = await prisma.user.upsert({
    where: { email: 'juan@cmms.com' },
    update: {},
    create: {
      email: 'juan@cmms.com',
      name: 'Juan Pérez',
      password: hashedPassword,
      role: 'TECHNICIAN',
    },
  })

  const tech2 = await prisma.user.upsert({
    where: { email: 'maria@cmms.com' },
    update: {},
    create: {
      email: 'maria@cmms.com',
      name: 'María González',
      password: hashedPassword,
      role: 'TECHNICIAN',
    },
  })

  console.log('✅ Usuarios creados')

  // Crear activos
  const extrusora1 = await prisma.asset.create({
    data: {
      name: 'Extrusora 1',
      code: 'EXT-01',
      area: 'EXTRUSION',
      criticality: 3,
      description: 'Extrusora de película soplada de 3 capas',
    },
  })

  const extrusora2 = await prisma.asset.create({
    data: {
      name: 'Extrusora 2',
      code: 'EXT-02',
      area: 'EXTRUSION',
      criticality: 3,
      description: 'Extrusora monocapa para película tubular',
    },
  })

  const impresora1 = await prisma.asset.create({
    data: {
      name: 'Impresora Flexográfica 1',
      code: 'IMP-01',
      area: 'PRINTING',
      criticality: 2,
      description: 'Impresora de 6 colores para película',
    },
  })

  const bolsera1 = await prisma.asset.create({
    data: {
      name: 'Bolsera 1',
      code: 'SEL-01',
      area: 'SEALING',
      criticality: 2,
      description: 'Máquina selladora y cortadora de bolsas',
    },
  })

  const compresor = await prisma.asset.create({
    data: {
      name: 'Compresor Principal',
      code: 'AUX-01',
      area: 'AUXILIARY',
      criticality: 3,
      description: 'Compresor de aire de 100 HP',
    },
  })

  console.log('✅ Activos creados')

  // Crear repuestos
  await prisma.part.createMany({
    data: [
      {
        name: 'Resistencia tipo banda 220V',
        code: 'RES-001',
        stock: 8,
        minStock: 5,
        price: 450.0,
        unit: 'pieza',
        category: 'Eléctrico',
      },
      {
        name: 'Cinta teflonada 50mm',
        code: 'TEF-001',
        stock: 3,
        minStock: 5,
        price: 280.0,
        unit: 'rollo',
        category: 'Consumible',
      },
      {
        name: 'Cuchilla de corte industrial',
        code: 'CUC-001',
        stock: 12,
        minStock: 8,
        price: 320.0,
        unit: 'pieza',
        category: 'Herramienta',
      },
      {
        name: 'Malla filtrante 80 mesh',
        code: 'MAL-001',
        stock: 0,
        minStock: 10,
        price: 150.0,
        unit: 'pieza',
        category: 'Consumible',
      },
      {
        name: 'Rodamiento 6205 2RS',
        code: 'ROD-001',
        stock: 15,
        minStock: 10,
        price: 95.0,
        unit: 'pieza',
        category: 'Mecánico',
      },
      {
        name: 'Sensor de temperatura PT100',
        code: 'SEN-001',
        stock: 4,
        minStock: 3,
        price: 680.0,
        unit: 'pieza',
        category: 'Eléctrico',
      },
    ],
  })

  console.log('✅ Repuestos creados')

  // Crear órdenes de trabajo
  await prisma.workOrder.create({
    data: {
      title: 'Cambio de resistencias zona 3',
      description:
        'Reemplazar resistencias quemadas en zona de calentamiento 3 del cañón',
      type: 'CORRECTIVE',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assetId: extrusora1.id,
      technicianId: tech1.id,
      laborHours: 2.5,
    },
  })

  await prisma.workOrder.create({
    data: {
      title: 'Mantenimiento preventivo mensual',
      description:
        'Limpieza de filtros, verificación de amperajes, lubricación de rodamientos',
      type: 'PREVENTIVE',
      status: 'OPEN',
      priority: 'MEDIUM',
      assetId: extrusora2.id,
      technicianId: tech2.id,
    },
  })

  await prisma.workOrder.create({
    data: {
      title: 'Cambio de cinta teflonada',
      description: 'Reemplazo de cinta teflonada en barra selladora',
      type: 'PREVENTIVE',
      status: 'CLOSED',
      priority: 'MEDIUM',
      assetId: bolsera1.id,
      technicianId: tech1.id,
      laborHours: 1.0,
      closedAt: new Date(),
    },
  })

  console.log('✅ Órdenes de trabajo creadas')

  // Crear programaciones
  await prisma.schedule.create({
    data: {
      assetId: extrusora1.id,
      frequencyDays: 30,
      frequencyType: 'CALENDAR',
      nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En 7 días
      taskTemplate: 'Mantenimiento preventivo mensual - Limpieza y lubricación',
    },
  })

  await prisma.schedule.create({
    data: {
      assetId: impresora1.id,
      frequencyDays: 15,
      frequencyType: 'CALENDAR',
      nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // En 3 días
      taskTemplate: 'Limpieza de rodillos anilox y verificación de registro',
    },
  })

  await prisma.schedule.create({
    data: {
      assetId: compresor.id,
      frequencyDays: 7,
      frequencyType: 'CALENDAR',
      nextDueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Vencido hace 2 días
      taskTemplate: 'Drenaje de condensados y verificación de presión',
    },
  })

  console.log('✅ Programaciones creadas')

  // Crear logs de fallas
  await prisma.failureLog.createMany({
    data: [
      {
        assetId: extrusora1.id,
        symptom: 'Temperatura inestable en zona 3',
        rootCause: 'Resistencia quemada por sobrecarga',
        downtimeHours: 4.5,
        reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        assetId: extrusora1.id,
        symptom: 'Vibración excesiva en motor principal',
        rootCause: 'Rodamiento desgastado',
        downtimeHours: 6.0,
        reportedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        assetId: bolsera1.id,
        symptom: 'Sellado deficiente',
        rootCause: 'Cinta teflonada desgastada',
        downtimeHours: 1.5,
        reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        assetId: impresora1.id,
        symptom: 'Desregistro en impresión',
        rootCause: 'Fotocelda descalibrada',
        downtimeHours: 2.0,
        reportedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    ],
  })

  console.log('✅ Logs de fallas creados')

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
