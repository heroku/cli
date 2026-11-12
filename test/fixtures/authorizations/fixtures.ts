import type {OauthAuthorization} from '@heroku/types/3.sdk'

// Complete OauthAuthorization records with fixed IDs and timestamps for --json snapshots.
// Token values are fake; --json returns them exactly as the API does.

const user = {
  email: 'developer@example.com',
  full_name: 'Example Developer',
  id: 'd7760946-8565-43f7-b4c0-7abf654c3a3c',
}

export const tokenAuthorization = {
  access_token: {
    expires_in: null,
    id: '2b6a4d3c-5f8e-4a1b-9c7d-0e1f2a3b4c5d',
    token: 'HRKU-fake-access-token-0000',
    version: 1,
  },
  client: null,
  created_at: '2026-01-02T03:04:05Z',
  description: 'b description',
  grant: null,
  id: 'abcd1234-129f-42d2-854b-def123abc123',
  refresh_token: null,
  scope: ['global'],
  session: null,
  updated_at: '2026-01-03T03:04:05Z',
  user,
} satisfies OauthAuthorization

export const clientAuthorization = {
  access_token: {
    expires_in: 28_800,
    id: '7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
    token: 'HRKU-fake-access-token-1111',
    version: 1,
  },
  client: {
    id: '3e4f5a6b-7c8d-4e9f-a0b1-c2d3e4f5a6b7',
    name: 'awesome client',
    redirect_uri: 'https://example.com/auth/heroku/callback',
  },
  created_at: '2026-02-03T04:05:06Z',
  description: 'awesome',
  grant: {
    code: 'fake-grant-code',
    expires_in: 300,
    id: '9a0b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
  },
  id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
  refresh_token: {
    expires_in: null,
    id: '5d6e7f8a-9b0c-4d1e-a2f3-a4b5c6d7e8f9',
    token: 'fake-refresh-token-2222',
  },
  scope: ['app', 'user'],
  session: {id: '1f2e3d4c-5b6a-4978-8695-a4b3c2d1e0f9'},
  updated_at: '2026-02-04T04:05:06Z',
  user,
} satisfies OauthAuthorization

/** API order is deliberately not alphabetical by description, so tests can tell the two apart. */
export const authorizationList = [tokenAuthorization, clientAuthorization] satisfies OauthAuthorization[]
