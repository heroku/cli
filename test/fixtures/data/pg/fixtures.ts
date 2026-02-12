import {pg} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'

import {
  CredentialInfo,
  CredentialsInfo,
  DeepRequired,
  InfoResponse,
  NonAdvancedCredentialInfo,
  PoolInfoResponse,
  PostgresLevelsResponse,
  PricingInfoResponse,
  Quota,
  Quotas,
  ScaleResponse,
  SettingsChangeResponse,
  SettingsResponse,
} from '../../../../src/lib/data/types.js'

export const addon: DeepRequired<Heroku.AddOn> = {
  actions: [],
  addon_service: {
    id: 'a67ff466-7f79-4f18-8343-51515771e8f9',
    name: 'heroku-postgresql',
  },
  app: {
    id: 'a3bbf89e-a908-4275-b573-8bdf6409764b',
    name: 'myapp',
  },
  billed_price: {
    cents: 0,
    contract: false,
    unit: 'month',
  },
  billing_entity: {
    id: 'a3bbf89e-a908-4275-b573-8bdf6409764b',
    name: 'myapp',
    type: 'app',
  },
  config_vars: [],
  created_at: '2025-01-01T12:00:00Z',
  id: '9e2c5a11-f51b-42d9-8fd9-255148140194',
  name: 'advanced-horizontal-01234',
  plan: {
    addon_service: {
      id: 'a67ff466-7f79-4f18-8343-51515771e8f9',
      name: 'heroku-postgresql',
    },
    compliance: [],
    created_at: '2025-01-01T12:00:00Z',
    default: false,
    description: 'Heroku Postgres Advanced Beta',
    human_name: 'Advanced Beta',
    id: 'ab0490b3-b7cd-4bf6-b840-9db509f3d075',
    installable_inside_private_network: false,
    installable_outside_private_network: true,
    name: 'heroku-postgresql:advanced-beta',
    price: {
      cents: 0,
      contract: false,
      unit: 'month',
    },
    space_default: false,
    state: 'ga',
    updated_at: '2025-01-01T12:00:00Z',
    visible: true,
  },
  provider_id: '9e2c5a11-f51b-42d9-8fd9-255148140194',
  state: 'provisioning',
  updated_at: '2025-01-01T12:00:00Z',
  web_url: 'https://addons-sso.heroku.com/apps/a3bbf89e-a908-4275-b573-8bdf6409764b/addons/9e2c5a11-f51b-42d9-8fd9-255148140194',
}

export const nonAdvancedAddon: DeepRequired<Heroku.AddOn> = {
  ...addon,
  name: 'standard-database',
  plan: {...addon.plan, name: 'heroku-postgresql:standard-0'},
}

export const legacyEssentialAddon: DeepRequired<Heroku.AddOn> = {
  ...addon,
  plan: {...addon.plan, name: 'heroku-postgresql:mini-0'},
}

export const nonPostgresAddon: DeepRequired<Heroku.AddOn> = {
  ...addon,
  addon_service: {
    id: '3db562b4-0241-4074-babc-f56c014c4779',
    name: 'heroku-redis',
  },
  name: 'redis-database',
  plan: {
    ...addon.plan,
    addon_service: {
      id: '3db562b4-0241-4074-babc-f56c014c4779',
      name: 'heroku-redis',
    },
    description: 'Heroku Redis Premium 0',
    human_name: 'Premium 0',
    name: 'heroku-redis:premium-0',
  },
}

export const essentialAddon: DeepRequired<Heroku.AddOn> = {
  ...addon,
  plan: {...addon.plan, name: 'heroku-postgresql:essential-0'},
}

export const levelsResponse: PostgresLevelsResponse = {
  items: [
    {memory_in_gb: 4, name: '4G-Performance', vcpu: 2},
    {memory_in_gb: 8, name: '8G-Performance', vcpu: 4},
  ],
}

export const pricingResponse: PricingInfoResponse = {
  advanced: {
    'instance-4G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '4G-Performance',
      rate: 6000,
    },
    'instance-8G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '8G-Performance',
      rate: 20000,
    },
    'storage-optimized': {
      billing_period: 'month',
      billing_unit: 'gigabyte',
      included_units: 100,
      product_description: 'Optimized Storage',
      rate: 20,
    },
  },
  'advanced-beta': {
    'instance-4G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '4G-Performance',
      rate: 6000,
    },
    'instance-8G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '8G-Performance',
      rate: 20000,
    },
    'storage-optimized': {
      billing_period: 'month',
      billing_unit: 'gigabyte',
      included_units: 100,
      product_description: 'Optimized Storage',
      rate: 20,
    },
  },
  'advanced-private': {
    'instance-4G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '4G-Performance',
      rate: 7200,
    },
    'instance-8G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '8G-Performance',
      rate: 24000,
    },
    'storage-optimized': {
      billing_period: 'month',
      billing_unit: 'gigabyte',
      included_units: 100,
      product_description: 'Optimized Storage',
      rate: 24,
    },
  },
  'advanced-private-beta': {
    'instance-4G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '4G-Performance',
      rate: 7200,
    },
    'instance-8G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '8G-Performance',
      rate: 24000,
    },
    'storage-optimized': {
      billing_period: 'month',
      billing_unit: 'gigabyte',
      included_units: 100,
      product_description: 'Optimized Storage',
      rate: 24,
    },
  },
  'advanced-shield': {
    'instance-4G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '4G-Performance',
      rate: 8400,
    },
    'instance-8G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '8G-Performance',
      rate: 28000,
    },
    'storage-optimized': {
      billing_period: 'month',
      billing_unit: 'gigabyte',
      included_units: 100,
      product_description: 'Optimized Storage',
      rate: 28,
    },
  },
  'advanced-shield-beta': {
    'instance-4G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '4G-Performance',
      rate: 8400,
    },
    'instance-8G': {
      billing_period: 'month',
      billing_unit: 'compute',
      product_description: '8G-Performance',
      rate: 28000,
    },
    'storage-optimized': {
      billing_period: 'month',
      billing_unit: 'gigabyte',
      included_units: 100,
      product_description: 'Optimized Storage',
      rate: 28,
    },
  },
}

export const scaleResponse: ScaleResponse = {
  changes: [
    {
      current: '8G-Performance', name: 'level', pool: 'leader', previous: '4G-Performance',
    },
    {
      current: 'false', name: 'high-availability', pool: 'leader', previous: 'true',
    },
  ],
}

export const emptyScaleResponse: ScaleResponse = {
  changes: [],
}

export const createAddonResponse: DeepRequired<Heroku.AddOn> = {
  ...addon,
  provision_message: 'Your database is being provisioned',
}

export const pgInfo: InfoResponse = {
  addon: {
    id: addon.id,
    name: addon.name,
  },
  app: {
    id: addon.app.id!,
    name: addon.app.name!,
  },
  created_at: '2025-01-01T00:00:00+00:00',
  features: {
    continuous_protection: {
      enabled: true,
    },
    credentials: {
      current_count: 1,
      enabled: true,
    },
    data_encryption: {
      enabled: true,
    },
    fork: {
      enabled: true,
    },
    highly_available: {
      enabled: true,
    },
    rollback: {
      earliest_time: '2025-01-02T00:00:00+00:00',
      enabled: true,
      latest_time: '2025-01-10T00:00:00+00:00',
    },
  },
  forked_from: null,
  plan_limits: [
    {
      current: 10,
      limit: 4000,
      name: 'table-limit',
    },
    {
      current: 1.1,
      limit: 128_000,
      name: 'storage-limit-in-gb',
    },
  ],
  pools: [
    {
      compute_instances: [
        {
          id: 'i3r507gt6dbscn',
          level: '4G-Performance',
          name: 'i3r507gt6dbscn',
          role: 'leader',
          status: 'up',
          updated_at: '2025-01-01T12:00:00+00:00',
        },
        {
          id: 'i7fquhvs4efu74',
          level: '4G-Performance',
          name: 'i7fquhvs4efu74',
          role: 'standby',
          status: 'up',
          updated_at: '2025-01-01T06:00:00+00:00',
        },
      ],
      connections_used: 10,
      endpoints: [
        {
          host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
          port: 5432,
          status: 'available',
        },
      ],
      expected_connection_limit: 400,
      expected_count: 2,
      expected_level: '4G-Performance',
      id: '199cc055-ad6b-48dd-8344-ef1a7688659e',
      metrics_sources: {
        cluster: null,
        database: null,
        leader: null,
      },
      name: 'leader',
      status: 'available',
      wait_status: {
        message: null,
        waiting: false,
      },
    },
    {
      compute_instances: [
        {
          id: 'ic7mb4lq0rkurk',
          level: '4G-Performance',
          name: 'ic7mb4lq0rkurk',
          role: 'follower',
          status: 'up',
          updated_at: '2025-01-01T12:00:00+00:00',
        },
        {
          id: 'i7q78mp2fg4v15',
          level: '4G-Performance',
          name: 'i7q78mp2fg4v15',
          role: 'follower',
          status: 'up',
          updated_at: '2025-01-01T06:00:00+00:00',
        },
      ],
      connections_used: 50,
      endpoints: [
        {
          host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
          port: 5432,
          status: 'available',
        },
      ],
      expected_connection_limit: 800,
      expected_count: 2,
      expected_level: '4G-Performance',
      id: 'b2492c07-c2d4-4956-b739-c15e9a6d6485',
      metrics_sources: {
        cluster: null,
        database: null,
        leader: null,
      },
      name: 'analytics',
      status: 'available',
      wait_status: {
        message: null,
        waiting: false,
      },
    },
  ],
  quotas: [
    {
      critical_gb: null,
      current_gb: 1.1,
      enforcement_action: 'none',
      enforcement_active: false,
      type: 'storage',
      warning_gb: null,
    },
  ],
  region: 'us',
  status: 'available',
  tier: 'advanced',
  version: '17.5',
}

export const pgInfoWithDisabledFeatures: InfoResponse = {
  ...pgInfo,
  features: {
    continuous_protection: {
      enabled: false,
    },
    credentials: {
      current_count: 0,
      enabled: false,
    },
    data_encryption: {
      enabled: false,
    },
    fork: {
      enabled: false,
    },
    highly_available: {
      enabled: false,
    },
    rollback: {
      earliest_time: '',
      enabled: false,
      latest_time: '',
    },
  },
  pools: [
    {
      compute_instances: [
        {
          id: 'i3r507gt6dbscn',
          level: '4G-Performance',
          name: 'i3r507gt6dbscn',
          role: 'leader',
          status: 'up',
          updated_at: '2025-01-01T12:00:00+00:00',
        },
      ],
      connections_used: 10,
      endpoints: [
        {
          host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
          port: 5432,
          status: 'available',
        },
      ],
      expected_connection_limit: 400,
      expected_count: 1,
      expected_level: '4G-Performance',
      id: '199cc055-ad6b-48dd-8344-ef1a7688659e',
      metrics_sources: {
        cluster: null,
        database: null,
        leader: null,
      },
      name: 'leader',
      status: 'available',
      wait_status: {
        message: null,
        waiting: false,
      },
    },
  ],
}

export const pgInfoWithForkedDatabase: InfoResponse = {
  ...pgInfo,
  forked_from: {
    id: '6ddd0626-e8b0-463c-a405-4df431c89fa7',
    name: 'advanced-oblique-01234',
  },
}

export const pgInfoWithUncompliantPlanLimits: InfoResponse = {
  ...pgInfoWithDisabledFeatures,
  plan_limits: [
    {current: 4001, limit: 4000, name: 'table-limit'},
    {current: 128_050, limit: 128_000, name: 'storage-limit-in-gb'},
  ],
  quotas: [
    {...pgInfo.quotas[0], current_gb: 128_050},
  ],
}

export const destroyedAddonResponse: DeepRequired<Heroku.AddOn> = {
  ...addon,
  state: 'deprovisioned',
}

export const settingsGetResponse: SettingsResponse = {
  items: [
    {
      current: true,
      default: false,
      name: 'log_connections',
      reboot_required: false,
    },
    {
      current: true,
      default: true,
      name: 'log_lock_waits',
      reboot_required: false,
    },
    {
      current: 500,
      default: -1,
      name: 'log_min_duration_statement',
      reboot_required: false,
    },
    {
      current: 'info',
      default: 'error',
      name: 'log_min_error_statement',
      reboot_required: false,
    },
    {
      current: 'ddl',
      default: 'none',
      name: 'log_statement',
      reboot_required: false,
    },
    {
      current: 'pl',
      default: 'none',
      name: 'track_functions',
      reboot_required: false,
    },
    {
      current: null,
      default: false,
      name: 'auto_explain.log_analyze',
      reboot_required: false,
    },
    {
      current: null,
      default: false,
      name: 'auto_explain.log_buffers',
      reboot_required: false,
    },
    {
      current: null,
      default: 'text',
      name: 'auto_explain.log_format',
      reboot_required: false,
    },
    {
      current: null,
      default: -1,
      name: 'auto_explain.log_min_duration',
      reboot_required: false,
    },
    {
      current: null,
      default: false,
      name: 'auto_explain.log_nested_statements',
      reboot_required: false,
    },
    {
      current: null,
      default: false,
      name: 'auto_explain.log_triggers',
      reboot_required: false,
    },
    {
      current: null,
      default: false,
      name: 'auto_explain.log_verbose',
      reboot_required: false,
    },
  ],
}

export const settingsPutResponse: SettingsChangeResponse = {
  changes: [
    {current: '500', name: 'log_min_duration_statement', previous: '550'},
    {current: '864000', name: 'idle_in_transaction_session_timeout', previous: '80000'},
  ],
}

export const emptySettingsChangeResponse: SettingsChangeResponse = {
  changes: [],
}

export const singleAttachmentResponse: Heroku.AddOnAttachment[] = [
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_URL'],
    id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
    name: 'DATABASE',
    namespace: null,
  },
]

export const multipleAttachmentsResponse: Heroku.AddOnAttachment[] = [
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_URL'],
    id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
    name: 'DATABASE',
    namespace: null,
  },
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_ANALYST_URL'],
    id: '9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4',
    name: 'DATABASE_ANALYST',
    namespace: 'role:analyst',
  },
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_ANALYTICS_URL'],
    id: 'fa7b348b-34dc-498e-aa23-0e7da817523d',
    name: 'DATABASE_ANALYTICS',
    namespace: 'pool:analytics',
  },
]

export const attachmentWithMissingNamespace: Heroku.AddOnAttachment[] = [
  {
    // namespace is missing
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_URL'],
    id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
    name: 'DATABASE',
  },
]

export const emptyAttachmentsResponse: Heroku.AddOnAttachment[] = []

export const addonResponse = {
  id: '01234567-89ab-cdef-0123-456789abcdef',
  name: 'postgres-1',
  plan: {
    name: 'heroku-postgresql:essential-1',
  },
}

export const credentialConfigResponse = [
  {
    name: 'role:mycredential',
    value: 'some-value',
  },
]

export const poolConfigResponse = [
  {
    name: 'pool:mypool',
    value: 'some-value',
  },
]

export const releasesResponse = [
  {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    status: 'succeeded',
    version: 123,
  },
]

export const createPoolResponse: PoolInfoResponse = {
  compute_instances: [],
  connections_used: 0,
  endpoints: [],
  expected_connection_limit: 800,
  expected_count: 2,
  expected_level: '4G-Performance',
  id: '12345678-90ab-cdef-0123-456789abcdef',
  metrics_sources: {
    cluster: null,
    database: null,
    leader: null,
  },
  name: 'readers',
  status: 'modifying',
  wait_status: {
    message: 'Waiting for instances to become available',
    waiting: true,
  },
}

export const advancedCredentialsResponse: CredentialsInfo = {
  items: [
    {
      database: 'd4w8akz45kmru7',
      host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
      id: '3d1a0a2d-3e27-4f34-99fa-c701627c0e92',
      name: 'u2vi1nt40t3mcq',
      port: '5432',
      roles: [
        {
          password: 'secret1',
          state: 'active',
          user: 'u2vi1nt40t3mcq',
        },
      ],
      state: 'active',
      type: 'owner',
    },
    {
      database: 'd4w8akz45kmru7',
      host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
      id: '9eb68dd8-5b3e-410a-890a-e44de90356d3',
      name: 'analyst',
      port: '5432',
      roles: [
        {
          password: 'secret2',
          state: 'active',
          user: 'analyst',
        },
      ],
      state: 'active',
      type: 'additional',
    },
  ],
}

export const nonAdvancedCredentialsResponse: NonAdvancedCredentialInfo[] = [
  {
    credentials: [
      {
        password: 'secret1',
        state: 'active',
        user: 'u2vi1nt40t3mcq',
      },
    ],
    database: 'd4w8akz45kmru7',
    host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
    name: 'default',
    port: '5432',
    state: 'active',
    uuid: '3d1a0a2d-3e27-4f34-99fa-c701627c0e92',
  },
  {
    credentials: [
      {
        password: 'secret2',
        state: 'active',
        user: 'analyst',
      },
    ],
    database: 'd4w8akz45kmru7',
    host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
    name: 'analyst',
    port: '5432',
    state: 'active',
    uuid: '9eb68dd8-5b3e-410a-890a-e44de90356d3',
  },
]

export const nonAdvancedInactiveCredentialResponse: NonAdvancedCredentialInfo = {
  ...nonAdvancedCredentialsResponse[1],
  credentials: [
    {
      password: 'secret2',
      state: 'revoked',
      user: 'analyst',
    },
  ],
  state: 'archived',
}

export const essentialCredentialsResponse: NonAdvancedCredentialInfo[] = [
  {
    credentials: [
      {
        password: 'secret1',
        state: 'active',
        user: 'u2vi1nt40t3mcq',
      },
    ],
    database: 'd4w8akz45kmru7',
    host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
    name: 'a1b2c3d4e5f6g7',
    port: '5432',
    state: 'active',
    uuid: '3d1a0a2d-3e27-4f34-99fa-c701627c0e92',
  },
]

export const advancedCredentialsAttachmentsResponse: Heroku.AddOnAttachment[] = [
  {
    addon: {
      app: {
        id: addon.app!.id,
        name: addon.app!.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app!.id,
      name: addon.app!.name,
    },
    config_vars: ['DATABASE_URL'],
    id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
    name: 'DATABASE',
    namespace: null,
  },
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_ANALYST_URL'],
    id: '9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4',
    name: 'DATABASE_ANALYST',
    namespace: 'role:analyst',
  },
]

export const nonAdvancedCredentialsAttachmentsResponse: Heroku.AddOnAttachment[] = [
  {
    addon: {
      app: {
        id: addon.app!.id,
        name: addon.app!.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app!.id,
      name: addon.app!.name,
    },
    config_vars: ['DATABASE_URL'],
    id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
    name: 'DATABASE',
    namespace: null,
  },
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_ANALYST_URL'],
    id: '9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4',
    name: 'DATABASE_ANALYST',
    namespace: 'credential:analyst',
  },
]

export const advancedCredentialsMultipleAttachmentsResponse: Heroku.AddOnAttachment[] = [
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_URL'],
    id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
    name: 'DATABASE',
    namespace: null,
  },
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_ANALYST_URL'],
    id: '9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4',
    name: 'DATABASE_ANALYST',
    namespace: 'role:analyst',
  },
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: '2ef2b408-12ae-4c7c-ac16-1327eb891399',
      name: 'myapp2',
    },
    config_vars: ['DATABASE_ANALYST_URL'],
    id: '913fe503-e95e-4128-9183-7c4e58c924c8',
    name: 'DATABASE_ANALYST',
    namespace: 'role:analyst',
  },
]

export const nonAdvancedCredentialsMultipleAttachmentsResponse: Heroku.AddOnAttachment[] = [
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_URL'],
    id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
    name: 'DATABASE',
    namespace: null,
  },
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    config_vars: ['DATABASE_ANALYST_URL'],
    id: '9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4',
    name: 'DATABASE_ANALYST',
    namespace: 'credential:analyst',
  },
  {
    addon: {
      app: {
        id: addon.app.id,
        name: addon.app.name,
      },
      id: addon.id,
      name: addon.name,
    },
    app: {
      id: '2ef2b408-12ae-4c7c-ac16-1327eb891399',
      name: 'myapp2',
    },
    config_vars: ['DATABASE_ANALYST_URL'],
    id: '913fe503-e95e-4128-9183-7c4e58c924c8',
    name: 'DATABASE_ANALYST',
    namespace: 'credential:analyst',
  },
]

export const createCredentialResponse: CredentialInfo = {
  database: 'd4w8akz45kmru7',
  host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
  id: '3d1a0a2d-3e27-4f34-99fa-c701627c0e92',
  name: 'my-credential',
  port: '5432',
  roles: [
    {
      password: 'secret123',
      state: 'active',
      user: 'my-credential',
    },
  ],
  state: 'active',
  type: 'additional',
}

export const inactiveCredentialResponse: CredentialInfo = {
  database: 'd4w8akz45kmru7',
  host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
  id: '9eb68dd8-5b3e-410a-890a-e44de90356d3',
  name: 'analyst',
  port: '5432',
  roles: [
    {
      password: 'secret2',
      state: 'inactive',
      user: 'analyst',
    },
  ],
  state: 'inactive',
  type: 'additional',
}

export const createAttachmentResponse: Required<Heroku.AddOnAttachment> = {
  addon: {
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    id: addon.id,
    name: addon.name,
  },
  app: {
    id: addon.app.id,
    name: addon.app.name,
  },
  created_at: '2025-01-01T12:00:00Z',
  id: '0484a63c-8ceb-453d-95c8-2aaf8861c40a',
  log_input_url: null,
  name: 'TEST',
  namespace: null,
  updated_at: '2025-01-01T12:00:00Z',
  web_url: addon.web_url,
}

export const createForeignAttachmentResponse: Required<Heroku.AddOnAttachment> = {
  ...createAttachmentResponse,
  app: {
    id: '2ef2b408-12ae-4c7c-ac16-1327eb891399',
    name: 'myapp2',
  },
  created_at: '2025-01-01T12:00:00Z',
  id: 'df05357b-9950-403b-bcdf-aed3d60ec94e',
  log_input_url: null,
  name: 'TEST2',
  namespace: null,
  updated_at: '2025-01-01T12:00:00Z',
  web_url: `https://addons-sso.heroku.com/apps/2ef2b408-12ae-4c7c-ac16-1327eb891399/addons/${addon.id}`,
}

export const createCredentialAttachmentResponse: Required<Heroku.AddOnAttachment> = {
  ...createAttachmentResponse,
  id: 'fc5ce939-663e-4417-8b00-cb7e6e662564',
  name: 'MYCREDENTIAL',
  namespace: 'role:mycredential',
}

export const createPoolAttachmentResponse: Required<Heroku.AddOnAttachment> = {
  ...createAttachmentResponse,
  id: '711a83cd-d9b1-430d-b46d-b35b8847f346',
  name: 'MYPOOL',
  namespace: 'pool:mypool',
}

export const createForkResponse: DeepRequired<Heroku.AddOn> = {
  ...addon,
  id: 'cef4651d-ccba-4989-9cf7-66b8b7532acf',
  name: 'advanced-oblique-01234',
  provision_message: 'Your forked database is being provisioned',
}

export const quotasResponse: Quotas = {
  items: [
    {
      critical_gb: null,
      current_gb: 1.1,
      enforcement_action: 'none',
      enforcement_active: false,
      type: 'storage',
      warning_gb: null,
    },
    {
      critical_gb: 100,
      current_gb: 1.1,
      enforcement_action: 'notify',
      enforcement_active: true,
      type: 'otherQuota',
      warning_gb: 50,
    },
  ],
}

export const storageQuotaResponse: Quota = {
  critical_gb: 100,
  current_gb: null,
  enforcement_action: 'none',
  enforcement_active: false,
  type: 'storage',
  warning_gb: 50,
}

export const storageQuotaResponseRestricted: Quota = {
  critical_gb: 100,
  current_gb: 150,
  enforcement_action: 'restrict',
  enforcement_active: true,
  type: 'storage',
  warning_gb: 50,
}

export const storageQuotaResponseCriticalNotify: Quota = {
  critical_gb: 100,
  current_gb: 150,
  enforcement_action: 'notify',
  enforcement_active: false,
  type: 'storage',
  warning_gb: 50,
}

export const storageQuotaResponseWarning: Quota = {
  critical_gb: 100,
  current_gb: 75,
  enforcement_action: 'none',
  enforcement_active: false,
  type: 'storage',
  warning_gb: 50,
}

export const advancedAddonAttachment: pg.ExtendedAddonAttachment = {
  addon: {
    app: {
      id: addon.app.id,
      name: addon.app.name,
    },
    id: addon.id,
    name: addon.name,
    plan: {
      id: addon.plan.id,
      name: addon.plan.name,
    },
  },
  app: {
    id: addon.app.id,
    name: addon.app.name,
  },
  config_vars: ['DATABASE_URL'],
  created_at: '2025-01-01T12:00:00Z',
  id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
  log_input_url: null,
  name: 'DATABASE',
  namespace: null,
  updated_at: '2025-01-01T12:00:00Z',
  web_url: addon.web_url,
}

export const nonAdvancedAddonAttachment: pg.ExtendedAddonAttachment = {
  ...advancedAddonAttachment,
  addon: {
    app: {
      id: nonAdvancedAddon.app.id,
      name: nonAdvancedAddon.app.name,
    },
    id: nonAdvancedAddon.id,
    name: nonAdvancedAddon.name,
    plan: {
      id: nonAdvancedAddon.plan.id,
      name: nonAdvancedAddon.plan.name,
    },
  },
  config_vars: ['STANDARD_DATABASE_URL'],
  id: 'b16d7e16-55de-4bca-a4e9-f631561e6090',
  name: 'STANDARD_DATABASE',
}

export const nonPostgresAddonAttachment: pg.ExtendedAddonAttachment = {
  ...advancedAddonAttachment,
  addon: {
    app: {
      id: nonPostgresAddon.app.id,
      name: nonPostgresAddon.app.name,
    },
    id: nonPostgresAddon.id,
    name: nonPostgresAddon.name,
    plan: {
      id: nonPostgresAddon.plan.id,
      name: nonPostgresAddon.plan.name,
    },
  },
  config_vars: ['REDIS_URL'],
  id: '0e8e72a3-7922-452e-a490-09cf45797f7e',
  name: 'REDIS',
}
