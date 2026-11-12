import type {App, Domain, SniEndpoint} from '@heroku/types/3.sdk'

// Complete records with fixed IDs and timestamps for certs --json snapshots.

/** The API returns `ssl_cert.acm`, but @heroku/types doesn't declare it yet. */
type ApiSniEndpoint = SniEndpoint & {ssl_cert: {acm: boolean}}

const appRef = {id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', name: 'example'}

export const sniEndpointA = {
  app: appRef,
  certificate_chain: '-----BEGIN CERTIFICATE-----\nfake-certificate-chain-a\n-----END CERTIFICATE-----\n',
  created_at: '2026-01-02T03:04:05Z',
  display_name: null,
  domains: ['3f1e2d4c-5b6a-4789-8a9b-0c1d2e3f4a5b'],
  id: '6a7b8c9d-0e1f-4a2b-9c3d-4e5f6a7b8c9d',
  name: 'tokyo-1050',
  ssl_cert: {
    acm: false,
    'ca_signed?': true,
    cert_domains: ['www.example.com'],
    expires_at: '2027-01-02T03:04:05Z',
    id: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
    issuer: '/C=US/O=Example CA/CN=Example CA',
    'self_signed?': false,
    starts_at: '2026-01-02T03:04:05Z',
    subject: '/CN=www.example.com',
  },
  updated_at: '2026-01-03T03:04:05Z',
} satisfies ApiSniEndpoint

export const sniEndpointB = {
  app: appRef,
  certificate_chain: '-----BEGIN CERTIFICATE-----\nfake-certificate-chain-b\n-----END CERTIFICATE-----\n',
  created_at: '2026-02-03T04:05:06Z',
  display_name: 'Example ACM',
  domains: [],
  id: '1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e',
  name: 'akita-7777',
  ssl_cert: {
    acm: true,
    'ca_signed?': true,
    cert_domains: ['example.com'],
    expires_at: '2026-05-04T04:05:06Z',
    id: '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
    issuer: '/C=US/O=Let\'s Encrypt/CN=R11',
    'self_signed?': false,
    starts_at: '2026-02-03T04:05:06Z',
    subject: '/CN=example.com',
  },
  updated_at: '2026-02-04T04:05:06Z',
} satisfies ApiSniEndpoint

/** API order is deliberately not sorted by name, so tests can tell the two apart. */
export const sniEndpointList = [sniEndpointA, sniEndpointB] satisfies ApiSniEndpoint[]

export const customDomain = {
  acm_status: 'cert issued',
  acm_status_reason: null,
  app: appRef,
  cname: 'www.example.com.herokudns.com',
  created_at: '2026-01-02T03:04:05Z',
  hostname: 'www.example.com',
  id: '3f1e2d4c-5b6a-4789-8a9b-0c1d2e3f4a5b',
  kind: 'custom',
  sni_endpoint: {id: sniEndpointA.id, name: sniEndpointA.name},
  status: 'succeeded',
  updated_at: '2026-01-03T03:04:05Z',
} satisfies Domain

export const rootDomain = {
  acm_status: 'cert issued',
  acm_status_reason: null,
  app: appRef,
  cname: 'example.com.herokudns.com',
  created_at: '2026-01-02T03:04:05Z',
  hostname: 'example.com',
  id: '4a5b6c7d-8e9f-4a0b-9c1d-2e3f4a5b6c7d',
  kind: 'custom',
  sni_endpoint: null,
  status: 'succeeded',
  updated_at: '2026-01-03T03:04:05Z',
} satisfies Domain

export const herokuDomain = {
  acm_status: null,
  acm_status_reason: null,
  app: appRef,
  cname: null,
  created_at: '2026-01-02T03:04:05Z',
  hostname: 'example-0123456789ab.herokuapp.com',
  id: '5b6c7d8e-9f0a-4b1c-8d2e-3f4a5b6c7d8e',
  kind: 'heroku',
  sni_endpoint: null,
  status: 'none',
  updated_at: '2026-01-02T03:04:05Z',
} satisfies Domain

export const domainList = [herokuDomain, customDomain, rootDomain] satisfies Domain[]

export const app = {
  acm: true,
  archived_at: null,
  base_image_name: null,
  build_stack: {id: '69bee368-352b-4bd0-9b7c-819b860a2588', name: 'heroku-24'},
  buildpack_provided_description: 'Node.js',
  buildpacks: null,
  created_at: '2026-01-01T00:00:00Z',
  current_build_architecture: [],
  generation: 'cedar',
  generation_object: {id: '7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e0f', name: 'cedar'},
  git_url: 'https://git.heroku.com/example.git',
  id: appRef.id,
  internal_routing: null,
  maintenance: false,
  name: 'example',
  organization: null,
  owner: {email: 'developer@example.com', id: 'd7760946-8565-43f7-b4c0-7abf654c3a3c'},
  process_tier: 'fir',
  region: {id: '59accabd-516d-4f0e-83e6-6e3757701145', name: 'us'},
  released_at: '2026-01-02T00:00:00Z',
  repo_size: null,
  slug_size: 12_345_678,
  space: null,
  stack: {id: '69bee368-352b-4bd0-9b7c-819b860a2588', name: 'heroku-24'},
  team: null,
  updated_at: '2026-01-02T00:00:00Z',
  web_url: 'https://example-0123456789ab.herokuapp.com/',
} satisfies App

export const acmDisabledApp = {...app, acm: false} satisfies App
