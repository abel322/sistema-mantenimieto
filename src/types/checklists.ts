export type ChecklistItemType = 'BOOLEAN' | 'NUMERIC' | 'TEXT'

export type ExecutionStatus = 'PASSED' | 'FLAGGED' | 'FAILED'

export interface ChecklistItem {
  id: string
  templateId: string
  label: string
  type: ChecklistItemType
  isRequired: boolean
  defaultOption?: string | null
  minValue?: number | null
  maxValue?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface ChecklistTemplate {
  id: string
  title: string
  description?: string | null
  assetType?: string | null
  items: ChecklistItem[]
  createdAt?: string
  updatedAt?: string
}

export interface ChecklistResponseInput {
  itemId: string
  valueBoolean?: boolean | null
  valueNumeric?: number | null
  valueText?: string | null
  notes?: string | null
}

export interface ChecklistResponse {
  id: string
  executionId: string
  itemId: string
  item?: ChecklistItem
  valueBoolean?: boolean | null
  valueNumeric?: number | null
  valueText?: string | null
  isFlagged: boolean
  notes?: string | null
}

export interface ChecklistExecution {
  id: string
  templateId: string
  template?: ChecklistTemplate
  assetId: string
  asset?: {
    id: string
    name: string
    code: string
    area: string
  }
  technicianId: string
  technician?: {
    id: string
    name: string
    email: string
  }
  status: ExecutionStatus
  completedAt: string
  notes?: string | null
  responses?: ChecklistResponse[]
  workOrders?: {
    id: string
    title: string
    status: string
    priority: string
  }[]
  createdAt: string
  updatedAt: string
}

export interface CreateExecutionDTO {
  templateId: string
  assetId: string
  technicianId?: string
  notes?: string
  responses: ChecklistResponseInput[]
}
