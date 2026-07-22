export type MachineStatus = 'STOPPED_LOTO' | 'RUNNING'

export interface TaskStep {
  id?: string
  planId?: string
  stepNumber: number
  description: string
  referenceVal?: string | null
  isMandatory: boolean
}

export interface PlanMaterial {
  id?: string
  planId?: string
  partId?: string | null
  materialName: string
  quantity: number
  unit: string
  part?: {
    id: string
    name: string
    code: string
    stock: number
    minStock: number
    unit: string
  } | null
}

export interface TaskPlan {
  id: string
  title: string
  description?: string | null
  assetType: string
  frequency: string
  estimatedMinutes: number
  machineStatus: MachineStatus
  requiredSkill: string
  tools: string[]
  safetyEquipment: string[]
  steps: TaskStep[]
  materials: PlanMaterial[]
  workOrders?: {
    id: string
    title: string
    status: string
  }[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateTaskPlanDTO {
  title: string
  description?: string
  assetType: string
  frequency: string
  estimatedMinutes: number
  machineStatus: MachineStatus
  requiredSkill: string
  tools: string[]
  safetyEquipment: string[]
  steps: {
    stepNumber: number
    description: string
    referenceVal?: string
    isMandatory?: boolean
  }[]
  materials?: {
    partId?: string
    materialName: string
    quantity: number
    unit: string
  }[]
}
