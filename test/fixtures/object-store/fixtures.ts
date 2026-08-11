import * as Heroku from '@heroku-cli/schema'

import {DeepRequired} from '../../../src/lib/data/types.js'

export const addon: DeepRequired<Heroku.AddOn> = {
  actions: [],
  addon_service: {
    id: 'b91b3d4f-1234-4f18-8343-51515771e8f9',
    name: 'heroku-object-store',
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
  name: 'object-store-crystalline-01234',
  plan: {
    addon_service: {
      id: 'b91b3d4f-1234-4f18-8343-51515771e8f9',
      name: 'heroku-object-store',
    },
    compliance: [],
    created_at: '2025-01-01T12:00:00Z',
    default: false,
    description: 'Heroku Object Store',
    human_name: 'Standard',
    id: 'ab0490b3-b7cd-4bf6-b840-9db509f3d075',
    installable_inside_private_network: false,
    installable_outside_private_network: true,
    name: 'heroku-object-store:standard',
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
  state: 'provisioned',
  updated_at: '2025-01-01T12:00:00Z',
  web_url: 'https://addons-sso.heroku.com/apps/a3bbf89e-a908-4275-b573-8bdf6409764b/addons/9e2c5a11-f51b-42d9-8fd9-255148140194',
}

export const nonObjectStoreAddon: DeepRequired<Heroku.AddOn> = {
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
    name: 'heroku-redis:premium-0',
  },
}

export const releasesResponse = [
  {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    status: 'succeeded',
    version: 123,
  },
]

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
  name: 'REPORTS',
  namespace: 'credential:reports',
  updated_at: '2025-01-01T12:00:00Z',
  web_url: addon.web_url,
}

export const createForeignAttachmentResponse: Required<Heroku.AddOnAttachment> = {
  ...createAttachmentResponse,
  app: {
    id: '2ef2b408-12ae-4c7c-ac16-1327eb891399',
    name: 'myapp2',
  },
  id: 'df05357b-9950-403b-bcdf-aed3d60ec94e',
  name: 'REPORTS2',
}

export const destroyAttachment: Required<Heroku.AddOnAttachment> = {
  ...createAttachmentResponse,
  config_vars: ['REPORTS_AWS_CONTAINER_CREDENTIALS_FULL_URI'],
}

export const attachmentsResponse: Required<Heroku.AddOnAttachment>[] = [
  {
    ...createAttachmentResponse,
    config_vars: ['AWS_CONTAINER_CREDENTIALS_FULL_URI'],
    id: 'c61eb5ce-0ce2-447e-817e-ba34afe8b95f',
    name: 'OBJECT_STORE',
    namespace: null,
  },
  {
    ...createAttachmentResponse,
    config_vars: ['REPORTS_AWS_CONTAINER_CREDENTIALS_FULL_URI'],
    id: '9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4',
    name: 'REPORTS',
    namespace: 'credential:reports',
  },
]

export const emptyAttachmentsResponse: Required<Heroku.AddOnAttachment>[] = []

export const defaultCredential = {
  capabilities: ['read', 'write', 'list', 'delete'],
  config_namespace: null,
  config_vars: {},
  credentials_rotated_at: null,
  default: true,
  id: '11111111-1111-1111-1111-111111111111',
  key_prefix: '',
  name: 'default',
  session_ttl_hours: 12,
  sessions_revoked_before: null,
  state: 'operational',
}

export const reportsCredential = {
  capabilities: ['read', 'list'],
  config_namespace: 'credential:reports',
  config_vars: {},
  credentials_rotated_at: null,
  default: false,
  id: '22222222-2222-2222-2222-222222222222',
  key_prefix: 'reports/',
  name: 'reports',
  session_ttl_hours: 12,
  sessions_revoked_before: null,
  state: 'operational',
}

export const credentialsResponse = [defaultCredential, reportsCredential]

export const objectStoreInfoResponse = {
  addon_name: addon.name,
  created_at: '2025-01-01T12:00:00Z',
  id: addon.id,
  kind: 'standard',
  plan: 'standard',
  region: 'virginia',
  session_ttl_hours: 12,
  status: 'Available',
  storage: {
    objects_count: 7,
    stored_bytes: 2048,
    updated_at: '2025-01-01T12:00:00Z',
  },
}

export const objectStoreInfoNoMetricsResponse = {
  ...objectStoreInfoResponse,
  storage: {
    objects_count: null,
    stored_bytes: null,
    updated_at: null,
  },
}
