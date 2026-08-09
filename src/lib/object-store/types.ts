// The shape shogun's ScopedCredential serializer returns, proxied verbatim by
// data-api at /object-stores/:id/credentials. The list endpoint returns a bare
// array of these (not a paginated envelope).
export interface ObjectStoreCredentialInfo extends Record<string, unknown> {
  capabilities: string[]
  config_namespace: null | string
  config_vars: Record<string, string>
  credentials_rotated_at: null | string
  default: boolean
  id: string
  key_prefix: string
  name: string
  session_ttl_hours: number
  sessions_revoked_before: null | string
  state: string
}

export const OBJECT_STORE_CAPABILITIES = ['read', 'write', 'list', 'delete'] as const
