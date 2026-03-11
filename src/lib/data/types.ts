export enum DatabaseStatus {
  AVAILABLE = 'available',
  MIGRATING = 'migrating',
  MODIFYING = 'modifying',
  PROVISIONING = 'provisioning',
  UNAVAILABLE = 'unavailable',
}

export enum MaintenanceStatus {
  completed = 'completed',
  none = 'none',
  pending = 'pending',
  preparing = 'preparing',
  ready = 'ready',
  running = 'running',
}

export enum MigrationStatus {
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  FAILED = 'failed',
  MIGRATING = 'migrating',
  PREPARING = 'preparing',
  PROMOTING = 'promoting',
  READY = 'ready',
  UNKNOWN = 'unknown',
}

export enum PoolStatus {
  AVAILABLE = 'available',
  MODIFYING = 'modifying',
  PROVISIONING = 'provisioning',
  UNKNOWN = 'unknown',
}

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
export type CreatePoolParameters = {
  count: number
  level: string
  name?: string
}

export type CredentialInfo = AdvancedCredentialInfo | NonAdvancedCredentialInfo

export type CredentialsInfo = { items: Array<AdvancedCredentialInfo> }

// This can be removed if at any point we get to generate a correct TypeScript schema from the Platform API
// HyperSchema, but that's not easy due to API variants and some other header-selectable serialization expansion
// options like `Accept-Inclusion` and `Accept-Expansion`.
export type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

export type ExtendedPostgresLevelInfo = PostgresLevelInfo & {
  pricing: PricingInfo | undefined
}

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
  status: DatabaseStatus
  tier: 'advanced'
  version: string
}

export type Maintenance = {
  'addon': {
    'attachments': string[];
    'kind': string;
    'name': string;
    'plan': string;
    'uuid'?: string;
    'window': null | string;
  };
  'app': {
    'name': string;
    'uuid'?: string;
  };
  'completed_at': null | string;
  'duration_seconds': null | string;
  'method': string;
  'previously_scheduled_for': null | string;
  'reason': string;
  'required_by': null | string;
  'scheduled_for': null | string;
  'server_created_at': string;
  'started_at': null | string;
  'status': MaintenanceStatus;
  'window': null | string;
}

export type MigrationResponse = {
  auto_promote: boolean
  cdc_lag: null | number
  completed: boolean
  full_load_progress: null | number
  id: string
  last_error_message: null | string
  preassessment_results: PreassessmentResults
  source_id: string
  status: MigrationStatus
  stop_reason: null | string
  successful: boolean
  tables_errored: null | number
  target_id: string
}

export interface NonAdvancedCredentialInfo extends Record<string, unknown> {
  credentials: Array<NonAdvancedCredential>
  database: string
  host: string
  name: string
  port: string
  state: NonAdvancedCredentialStoreState
  uuid: string
}

export type PlanLimit = ConnectionLimit | StorageLimitInGb | TableLimit

export type PoolInfoResponse = {
  compute_instances: Array<ComputeInstance>
  connections_used: null | number
  endpoints: Array<ConnectionEndpoint>
  expected_connection_limit: number
  expected_count: number
  expected_level: string
  id: string
  metrics_sources: {
    cluster: null | string
    database: null | string
    leader: null | string
  }
  name: string
  status: PoolStatus
  wait_status: {
    message: null | string
    waiting: boolean
  }
}

export type PostgresLevelInfo = {
  memory_in_gb: number
  name: string
  vcpu: number
}

export type PostgresLevelsResponse = {
  items: Array<PostgresLevelInfo>
}

export type PricingInfo = {
  billing_period: 'month'
  billing_unit: 'compute' | 'gigabyte'
  included_units?: number
  product_description: string
  rate: number // in cents
}

export type PricingInfoResponse = Record<string, TierPricingInfo>

export type Quota = {
  critical_gb: null | number
  current_gb: null | number
  enforcement_action: 'none' | 'notify' | 'restrict'
  enforcement_active: boolean
  type: string
  warning_gb: null | number
}

export type Quotas = { items: Array<Quota> }

export type ScaleResponse = {
  changes: Array<PoolChange>
}

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

export type TierPricingInfo = Record<string, PricingInfo>
export type Window = {
  previous_window: null | string;
  previously_scheduled_at: null | string;
  scheduled_at: null | string;
  window: null | string;
}
type AddonReference = ResourceReference

type AppReference = ResourceReference

type BaseChange = {
  current: boolean | null | number | string
  name: string
  previous: boolean | null | number | string
}

type CommonRuntimeRegion = 'eu' | 'us'

type ConnectionLimit = {
  current: number
  limit: number
  name: 'connection-limit'
}

type NonAdvancedCredential = {
  connections?: null | number
  password: string
  state: NonAdvancedCredentialState
  user: string
}
type NonAdvancedCredentialState = 'active' | 'archived' | 'enabling' | 'revoked' | 'revoking'

type NonAdvancedCredentialStoreState = 'active' | 'archived' | 'provisioning' | 'revoking' | 'rotating' | 'rotation_completed' | 'wait_for_provisioning'

type PoolChange = BaseChange & {
  pool: string
}

type PreassessmentCheck = {
  checked_at: null | string
  description: null | string
  name: string
  result: 'cancelled' | 'error' | 'failed' | 'passed' | 'pending' | 'running' | 'skipped' | 'warning'
}

type PreassessmentResults = Array<PreassessmentCheck>

type PrivateSpaceRegion =
  'california' | 'dublin' | 'frankfurt' | 'london' | 'montreal' | 'mumbai'
    | 'ohio' | 'oregon' | 'paris' | 'singapore' | 'sydney' | 'tokyo' | 'virginia'

type ResourceReference = {
  id: string
  name: string
}

type SettingsChange = BaseChange

type StorageLimitInGb = {
  current: number
  limit: number
  name: 'storage-limit-in-gb'
}

type TableLimit = {
  current: number
  limit: number
  name: 'table-limit'
}

export function isAdvancedCredentialInfo(credential: CredentialInfo): credential is AdvancedCredentialInfo {
  return 'type' in credential
}
