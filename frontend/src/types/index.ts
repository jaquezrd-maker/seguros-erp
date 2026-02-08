export type ClientType = 'FISICA' | 'JURIDICA'
export type ClientStatus = 'ACTIVO' | 'SUSPENDIDO' | 'CANCELADO'
export type InsurerStatus = 'ACTIVA' | 'INACTIVA'
export type PolicyStatus = 'VIGENTE' | 'VENCIDA' | 'CANCELADA' | 'EN_RENOVACION'
export type PaymentMethod = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
export type PaymentStatus = 'PENDIENTE' | 'COMPLETADO' | 'ANULADO' | 'VENCIDO'
export type ClaimStatus = 'PENDIENTE' | 'EN_PROCESO' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO' | 'PAGADO'
export type ClaimPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
export type CommissionStatus = 'PENDIENTE' | 'PAGADA' | 'ANULADA'
export type RenewalStatus = 'PENDIENTE' | 'PROCESADA' | 'RECHAZADA' | 'VENCIDA'
export type UserRole = 'ADMINISTRADOR' | 'EJECUTIVO' | 'CONTABILIDAD' | 'SOLO_LECTURA'
export type UserStatus = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'

export interface InsuranceType {
  id: number
  name: string
  category?: string
  description?: string
}

export interface Client {
  id: number
  type: ClientType
  name: string
  cedulaRnc: string
  phone?: string
  phoneAlt?: string
  email?: string
  address?: string
  city?: string
  province?: string
  status: ClientStatus
  notes?: string
  createdAt: string
  updatedAt: string
  _count?: { policies: number; payments: number }
}

export interface Insurer {
  id: number
  name: string
  rnc: string
  legalName?: string
  phone?: string
  email?: string
  contactPerson?: string
  address?: string
  status: InsurerStatus
  createdAt: string
  updatedAt: string
  branches?: InsurerBranch[]
  commissionRules?: CommissionRule[]
  _count?: { policies: number }
}

export interface InsurerBranch {
  id: number
  insurerId: number
  name: string
  ramos: string[]
}

export interface CommissionRule {
  id: number
  insurerId: number
  insuranceTypeId: number
  ratePercentage: number
  effectiveFrom: string
  effectiveTo?: string
  insuranceType?: InsuranceType
}

export interface Policy {
  id: number
  policyNumber: string
  clientId: number
  insurerId: number
  insuranceTypeId: number
  startDate: string
  endDate: string
  premium: number
  paymentMethod: PaymentMethod
  numberOfInstallments?: number
  status: PolicyStatus
  autoRenew: boolean
  beneficiaryData?: BeneficiaryData
  notes?: string
  createdAt: string
  updatedAt: string
  client?: Client
  insurer?: Insurer
  insuranceType?: InsuranceType
}

export interface BeneficiaryData {
  type: 'vehicle' | 'person' | 'property' | 'health' | 'other'
  // Datos para vehículos
  vehicleMake?: string
  vehicleModel?: string
  vehicleYear?: number
  vehiclePlate?: string
  vehicleChasis?: string
  vehicleColor?: string
  vehicleValue?: number
  // Datos para personas
  personName?: string
  personCedula?: string
  personBirthDate?: string
  personRelationship?: string
  personPhone?: string
  // Datos para propiedades
  propertyAddress?: string
  propertyType?: string
  propertyValue?: number
  propertyDescription?: string
  // Datos para salud
  healthConditions?: string
  // Otros datos flexibles
  [key: string]: any
}

export interface Claim {
  id: number
  policyId: number
  claimNumber: string
  type: string
  dateOccurred: string
  dateReported: string
  description?: string
  estimatedAmount?: number
  approvedAmount?: number
  status: ClaimStatus
  priority: ClaimPriority
  assignedTo?: number
  createdAt: string
  updatedAt: string
  policy?: Policy & { client?: Client; insurer?: Insurer }
}

export interface Payment {
  id: number
  policyId: number
  clientId: number
  amount: number
  paymentMethod: string
  paymentDate: string
  dueDate?: string
  receiptNumber?: string
  status: PaymentStatus
  notes?: string
  createdAt: string
  policy?: Policy & { client?: Client }
  client?: Client
  createdByUser?: { id: number; name: string }
}

export interface Commission {
  id: number
  policyId: number
  producerId: number
  premiumAmount: number
  rate: number
  amount: number
  period: string
  status: CommissionStatus
  paidDate?: string
  createdAt: string
  policy?: Policy & { client?: Client; insurer?: Insurer }
  producer?: { id: number; name: string }
}

export interface Renewal {
  id: number
  policyId: number
  originalEndDate: string
  newEndDate?: string
  newPremium?: number
  status: RenewalStatus
  processedBy?: number
  createdAt: string
  policy?: Policy & {
    client?: Client
    insurer?: Insurer
    insuranceType?: InsuranceType
  }
}

export interface ERPUser {
  id: number
  name: string
  email: string
  role: UserRole
  phone?: string
  status: UserStatus
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  summary?: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
