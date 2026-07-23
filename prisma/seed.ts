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
  const extrusora1 = await prisma.asset.upsert({
    where: { code: 'EXT-01' },
    update: {},
    create: {
      name: 'Extrusora 1',
      code: 'EXT-01',
      area: 'EXTRUSION',
      criticality: 3,
      description: 'Extrusora de película soplada de 3 capas',
    },
  })

  const extrusora2 = await prisma.asset.upsert({
    where: { code: 'EXT-02' },
    update: {},
    create: {
      name: 'Extrusora 2',
      code: 'EXT-02',
      area: 'EXTRUSION',
      criticality: 3,
      description: 'Extrusora monocapa para película tubular',
    },
  })

  const impresora1 = await prisma.asset.upsert({
    where: { code: 'IMP-01' },
    update: {},
    create: {
      name: 'Impresora Flexográfica 1',
      code: 'IMP-01',
      area: 'PRINTING',
      criticality: 2,
      description: 'Impresora de 6 colores para película',
    },
  })

  const bolsera1 = await prisma.asset.upsert({
    where: { code: 'SEL-01' },
    update: {},
    create: {
      name: 'Bolsera 1',
      code: 'SEL-01',
      area: 'SEALING',
      criticality: 2,
      description: 'Máquina selladora y cortadora de bolsas',
    },
  })

  const compresor = await prisma.asset.upsert({
    where: { code: 'AUX-01' },
    update: {},
    create: {
      name: 'Compresor Principal',
      code: 'AUX-01',
      area: 'AUXILIARY',
      criticality: 3,
      description: 'Compresor de aire de 100 HP',
    },
  })

  console.log('✅ Activos creados')

  // Crear proveedores y contratistas externos
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'TecnoSellos & Teflones',
      taxId: 'J-30495821-0',
      category: 'Repuestos Mecánicos',
      contactName: 'Carlos Mendoza',
      phone: '+58 414-555-0101',
      email: 'ventas@tecnosellos.com',
      address: 'Zona Industrial Paramillo, Galpón 12, San Cristóbal',
      status: 'ACTIVE',
      rating: 5,
      notes: 'Especialista en sellos de teflón, empaquetaduras y resistencias para extrusoras y selladoras.',
    },
  })

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Servicios Electromecánicos Industriales C.A.',
      taxId: 'J-40192837-4',
      category: 'Automatización/Electricidad',
      contactName: 'Ing. Roberto Rivas',
      phone: '+58 412-555-0202',
      email: 'contacto@seielectro.com',
      address: 'Av. Las Industrias, Sector Los Dolores, Valencia',
      status: 'ACTIVE',
      rating: 4,
      notes: 'Servicios de rebobinado de motores, mantenimiento de tableros, PLCs y variadores de frecuencia.',
    },
  })

  const supplier3 = await prisma.supplier.create({
    data: {
      name: 'Tornería y Mecanizados de Precisión',
      taxId: 'J-29384756-1',
      category: 'Mecanizado/Tornería',
      contactName: 'Pedro Bastidas',
      phone: '+58 424-555-0303',
      email: 'torneria.precision@gmail.com',
      address: 'Calle 4 con Carrera 8, Zona Industrial I, Barquisimeto',
      status: 'ACTIVE',
      rating: 5,
      notes: 'Fabricación y rectificado de rodillos, ejes de transmisión y engranajes industriales de alta precisión.',
    },
  })

  console.log('✅ Proveedores creados')

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
        preferredSupplierId: supplier1.id,
      },
      {
        name: 'Cinta teflonada 50mm',
        code: 'TEF-001',
        stock: 3,
        minStock: 5,
        price: 280.0,
        unit: 'rollo',
        category: 'Consumible',
        preferredSupplierId: supplier1.id,
      },
      {
        name: 'Cuchilla de corte industrial',
        code: 'CUC-001',
        stock: 12,
        minStock: 8,
        price: 320.0,
        unit: 'pieza',
        category: 'Herramienta',
        preferredSupplierId: supplier3.id,
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
        preferredSupplierId: supplier2.id,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Repuestos creados')

  // Crear órdenes de trabajo
  await prisma.workOrder.create({
    data: {
      title: 'Rebobinado de motor principal Extrusora 1',
      description:
        'Servicio externo de rebobinado y mantenimiento preventivo del motor principal de extrusión.',
      type: 'CORRECTIVE',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assetId: extrusora1.id,
      technicianId: tech1.id,
      externalVendorId: supplier2.id,
      laborHours: 8.0,
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

  // Crear Plantillas de Inspección (Checklists)
  let templateBolseras = await prisma.checklistTemplate.findFirst({
    where: { title: 'Inspección Preventiva Diaria - Bolseras' },
    include: { items: true },
  })

  if (!templateBolseras) {
    templateBolseras = await prisma.checklistTemplate.create({
      data: {
        title: 'Inspección Preventiva Diaria - Bolseras',
        description: 'Checklist diario de parámetros críticos para máquinas selladoras y cortadoras de bolsas.',
        assetType: 'SEALING',
        items: {
          create: [
            {
              label: 'Estado y tensión de cinta teflonada en barra selladora',
              type: 'BOOLEAN',
              isRequired: true,
            },
            {
              label: 'Temperatura de barretas de sellado (°C)',
              type: 'NUMERIC',
              isRequired: true,
              minValue: 140,
              maxValue: 200,
            },
            {
              label: 'Presión de aire en cilindros de corte/impacto (Bar)',
              type: 'NUMERIC',
              isRequired: true,
              minValue: 4,
              maxValue: 7,
            },
            {
              label: 'Alineación de fotocélula de registro',
              type: 'BOOLEAN',
              isRequired: true,
            },
          ],
        },
      },
      include: { items: true },
    })
  }

  let templateExtrusoras = await prisma.checklistTemplate.findFirst({
    where: { title: 'Inspección Preventiva Diaria - Extrusoras' },
    include: { items: true },
  })

  if (!templateExtrusoras) {
    templateExtrusoras = await prisma.checklistTemplate.create({
      data: {
        title: 'Inspección Preventiva Diaria - Extrusoras',
        description: 'Verificación diaria de temperaturas, presiones y niveles en extrusoras de plástico.',
        assetType: 'EXTRUSION',
        items: {
          create: [
            {
              label: 'Amperaje y temperatura en zonas del cañón (°C)',
              type: 'NUMERIC',
              isRequired: true,
              minValue: 180,
              maxValue: 240,
            },
            {
              label: 'Presión de masa en el dado/cabezal (PSI)',
              type: 'NUMERIC',
              isRequired: true,
              minValue: 150,
              maxValue: 300,
            },
            {
              label: 'Nivel de aceite en caja reductora',
              type: 'BOOLEAN',
              isRequired: true,
            },
          ],
        },
      },
      include: { items: true },
    })
  }

  console.log('✅ Plantillas de inspección creadas')

  // Crear una ejecución de ejemplo para demo si no hay ejecuciones
  const existingExecutionCount = await prisma.checklistExecution.count()
  if (existingExecutionCount === 0 && templateBolseras) {
    await prisma.checklistExecution.create({
      data: {
        templateId: templateBolseras.id,
        assetId: bolsera1.id,
        technicianId: tech1.id,
        status: 'PASSED',
        notes: 'Inspección matutina realizada sin novedad.',
        completedAt: new Date(),
        responses: {
          create: templateBolseras.items.map((item) => {
            if (item.type === 'BOOLEAN') {
              return { itemId: item.id, valueBoolean: true, isFlagged: false }
            } else if (item.label.includes('Temperatura')) {
              return { itemId: item.id, valueNumeric: 165, isFlagged: false }
            } else {
              return { itemId: item.id, valueNumeric: 5.5, isFlagged: false }
            }
          }),
        },
      },
    })
    console.log('✅ Ejecución de prueba creada')
  }

  // Crear Pautas Técnicas / SOPs de Mantenimiento
  let planBolseras = await prisma.taskPlan.findFirst({
    where: { title: 'Mantenimiento Preventivo Mensual - Bolseras' },
  })

  if (!planBolseras) {
    const teflonPart = await prisma.part.findFirst({ where: { code: 'TEF-001' } })
    const resPart = await prisma.part.findFirst({ where: { code: 'RES-001' } })

    planBolseras = await prisma.taskPlan.create({
      data: {
        title: 'Mantenimiento Preventivo Mensual - Bolseras',
        description: 'Protocolo estándar de mantenimiento para la barra selladora y corte neumático en máquinas bolseras.',
        assetType: 'SEALING',
        frequency: 'MENSUAL',
        estimatedMinutes: 60,
        machineStatus: 'STOPPED_LOTO',
        requiredSkill: 'Mecánico / Electricista',
        tools: ['Llave Allen set', 'Cepillo de bronce', 'Multímetro'],
        safetyEquipment: ['Guantes térmicos', 'Lentes de seguridad', 'Tarjeta LOTO'],
        steps: {
          create: [
            {
              stepNumber: 1,
              description: 'Aplicar consignación LOTO en tablero principal y corte neumático.',
              referenceVal: 'Verificar cero energía con multímetro y presiones en 0 Bar',
              isMandatory: true,
            },
            {
              stepNumber: 2,
              description: 'Retirar cinta teflonada desgastada y limpiar la barra con cepillo de bronce.',
              referenceVal: 'Superficie libre de residuos de polietileno quemado',
              isMandatory: true,
            },
            {
              stepNumber: 3,
              description: 'Inspeccionar resistencia de barra selladora.',
              referenceVal: 'Continuidad con multímetro - Referencia: Rango 22-25 Ω',
              isMandatory: true,
            },
            {
              stepNumber: 4,
              description: 'Instalar teflón nuevo garantizando tensión uniforme.',
              referenceVal: 'Superficie lisa sin burbujas ni arrugas',
              isMandatory: true,
            },
          ],
        },
        materials: {
          create: [
            {
              partId: teflonPart?.id || null,
              materialName: 'Cinta teflonada 50mm',
              quantity: 2.0,
              unit: 'rollo',
            },
            {
              partId: resPart?.id || null,
              materialName: 'Resistencia tipo banda 220V',
              quantity: 1.0,
              unit: 'pieza',
            },
          ],
        },
      },
    })
  }

  let planExtrusoras = await prisma.taskPlan.findFirst({
    where: { title: 'Ruta de Inspección y Termografía - Extrusora' },
  })

  if (!planExtrusoras) {
    planExtrusoras = await prisma.taskPlan.create({
      data: {
        title: 'Ruta de Inspección y Termografía - Extrusora',
        description: 'Verificación en marcha de puntos calientes en cañón, consumos eléctricos y transmisión.',
        assetType: 'EXTRUSION',
        frequency: 'SEMANAL',
        estimatedMinutes: 30,
        machineStatus: 'RUNNING',
        requiredSkill: 'Instrumentista / Termógrafo',
        tools: ['Cámara/Pistola Termográfica', 'Amperímetro de gancho'],
        safetyEquipment: ['Lentes de seguridad', 'Calzado dieléctrico'],
        steps: {
          create: [
            {
              stepNumber: 1,
              description: 'Medir temperatura de radiación en Zonas de Cañón 1 a 4.',
              referenceVal: 'Setpoint: 170°C - 190°C (Diferencial máximo: ± 5°C)',
              isMandatory: true,
            },
            {
              stepNumber: 2,
              description: 'Verificar amperaje de consumo en motor principal de extrusión.',
              referenceVal: 'Amperaje nominal < 45A',
              isMandatory: true,
            },
            {
              stepNumber: 3,
              description: 'Inspeccionar nivel de aceite en visor de caja reductora.',
              referenceVal: 'Nivel entre marcas MIN y MAX (Sin fugas visibles)',
              isMandatory: true,
            },
          ],
        },
      },
    })
  }

  console.log('✅ Pautas técnicas y SOPs creados')

  // Crear Herramientas de muestra
  const tool1 = await prisma.tool.upsert({
    where: { code: 'HER-001' },
    update: {},
    create: {
      code: 'HER-001',
      name: 'Llave Dinamométrica / Torquímetro 1/2"',
      category: 'Mecánica',
      type: 'PORTABLE',
      status: 'AVAILABLE',
      brand: 'Snap-on',
      serialNumber: 'SN-TORQ-9921',
      notes: 'Ubicación: Pañol Central. Calibración vigente.',
    },
  })

  const tool2 = await prisma.tool.upsert({
    where: { code: 'HER-002' },
    update: {},
    create: {
      code: 'HER-002',
      name: 'Juego de Llaves Allen Milimétricas Extra Largas',
      category: 'Mecánica',
      type: 'FIXED_MACHINE',
      status: 'AVAILABLE',
      brand: 'Bondhus',
      assetId: extrusora1.id,
      notes: 'Fija en Extrusora 1 para ajustes de dado de extrusión.',
    },
  })

  const tool3 = await prisma.tool.upsert({
    where: { code: 'HER-003' },
    update: {},
    create: {
      code: 'HER-003',
      name: 'Pirómetro Digital con Termocupla K',
      category: 'Instrumentación',
      type: 'FIXED_AREA',
      status: 'AVAILABLE',
      brand: 'Fluke',
      area: 'Sellado/Corte',
      notes: 'Asignado al área de Sellado/Corte para control térmico de mordazas.',
    },
  })

  const tool4 = await prisma.tool.upsert({
    where: { code: 'HER-004' },
    update: {},
    create: {
      code: 'HER-004',
      name: 'Pistola Neumática de Impacto 1/2"',
      category: 'Neumática',
      type: 'PORTABLE',
      status: 'IN_USE',
      brand: 'Chicago Pneumatic',
      serialNumber: 'CP-7748-001',
      assignedTo: 'Juan Pérez (Técnico Mecánico)',
      assignedAt: new Date(),
      notes: 'Prestada a Juan Pérez para mantenimiento de turno.',
    },
  })

  console.log('✅ Herramientas de muestra creadas')

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
