// This can be removed if at any point we get to generate a correct TypeScript schema from the Platform API
// HyperSchema, but that's not easy due to API variants and some other header-selectable serialization expansion
// options like `Accept-Inclusion` and `Accept-Expansion`.
export type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

type ResourceReference = {
  id: string
  name: string
}
type AppReference = ResourceReference
type AddonReference = ResourceReference

type CommonRuntimeRegion = 'eu' | 'us'
type PrivateSpaceRegion =
  'california' | 'dublin' | 'frankfurt' | 'london' | 'montreal' | 'mumbai'
    | 'ohio' | 'oregon' | 'paris' | 'singapore' | 'sydney' | 'tokyo' | 'virginia'

export type InfoResponse = {
  addon: AddonReference
  app: AppReference
  created_at: string
  features: {
    continuous_protection: {
      enabled: boolean
    }
    credentials: {
      current_count: number
      enabled: boolean
    }
    data_encryption: {
      enabled: boolean
    }
    fork: {
      enabled: boolean
    }
    highly_available: {
      enabled: boolean
    }
    rollback: {
      earliest_time: null | string
      enabled: boolean
      latest_time: null | string
    }
  }
  forked_from: AddonReference | null
  plan_limits: Array<PlanLimit>
  pools: Array<PoolInfoResponse>
  quotas: Array<Quota>
  region: CommonRuntimeRegion | PrivateSpaceRegion
  status: 'available' | 'modifying' | 'provisioning' | 'unavailable'
  tier: 'advanced'
  version: string
}

export type Quotas = { items: Array<Quota> }
export type Quota = {
  critical_gb: null | number
  current_gb: null | number
  enforcement_action: 'none' | 'notify' | 'restrict'
  enforcement_active: boolean
  type: string
  warning_gb: null | number
}

type TableLimit = {
  current: number
  limit: number
  name: 'table-limit'
}

type ConnectionLimit = {
  current: number
  limit: number
  name: 'connection-limit'
}

type StorageLimitInGb = {
  current: number
  limit: number
  name: 'storage-limit-in-gb'
}

export type PlanLimit = ConnectionLimit | StorageLimitInGb | TableLimit

export type PostgresLevelInfo = {
  memory_in_gb: number
  name: string
  vcpu: number
}

export type PostgresLevelsResponse = {
  items: Array<PostgresLevelInfo>
}

type BaseChange = {
  current: boolean | null | number | string
  name: string
  previous: boolean | null | number | string
}

type PoolChange = {
  pool: string
} & BaseChange

export type ScaleResponse = {
  changes: Array<PoolChange>
}

type SettingsChange = BaseChange

export type SettingsChangeResponse = {
  changes: Array<SettingsChange>
}

export type SettingsResponse = {
  items: Array<{
    current: boolean | null | number | string
    default: boolean | null | number | string
    name: string
    reboot_required: boolean
  }>
}

export type CreatePoolParameters = {
  count: number
  level: string
  name?: string
}

export type ComputeInstance = {
  id: string
  level: string
  name: string
  role: string // will be good to have an enum for the valid roles
  status: string // will be good to have an enum for the valid statuses
  updated_at: string
}

export type ConnectionEndpoint = {
  host: string
  port: number
  status: 'available' | 'degraded' | 'deprovisioning' | 'modifying'
}

export type PoolInfoResponse = {
  compute_instances: Array<ComputeInstance>
  endpoints: Array<ConnectionEndpoint>
  expected_count: number
  expected_level: string
  id: string
  name: string
  status: 'available' | 'modifying'
}

export type CredentialsInfo = { items: Array<AdvancedCredentialInfo> }
export type CredentialInfo = AdvancedCredentialInfo | NonAdvancedCredentialInfo
export interface AdvancedCredentialInfo extends Record<string, unknown> {
  database: string
  host: string
  id: string
  name: string
  port: string
  roles: Array<{
    password: string
    state: string
    user: string
  }>
  state: string
  type: 'additional' | 'owner'
}

export function isAdvancedCredentialInfo(credential: CredentialInfo): credential is AdvancedCredentialInfo {
  return 'type' in credential
}

export type PricingInfo = {
  billing_period: 'month'
  billing_unit: 'compute' | 'gigabyte'
  included_units?: number
  product_description: string
  rate: number // in cents
}

export type TierPricingInfo = Record<string, PricingInfo>

export type PricingInfoResponse = Record<string, TierPricingInfo>

type NonAdvancedCredentialState = 'active' | 'archived' | 'enabling' | 'revoked' | 'revoking'
type NonAdvancedCredential = {
  connections?: null | number
  password: string
  state: NonAdvancedCredentialState
  user: string
}

type NonAdvancedCredentialStoreState = 'active' | 'archived' | 'provisioning' | 'revoking' | 'rotating' | 'rotation_completed' | 'wait_for_provisioning'

export interface NonAdvancedCredentialInfo extends Record<string, unknown> {
  credentials: Array<NonAdvancedCredential>
  database: string
  host: string
  name: string
  port: string
  state: NonAdvancedCredentialStoreState
  uuid: string
}

export type ExtendedPostgresLevelInfo = {
  pricing: PricingInfo | undefined
} & PostgresLevelInfo
