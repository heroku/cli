/**
 * Extracts the scoped credential name from an object store attachment's
 * `namespace`. The namespace is `credential:<name>` for a named credential, or
 * nullish for the default (ambient) credential.
 */
export function parseCredential(namespace?: null | string): string | undefined {
  const match = namespace?.match(/^credential:(.+)$/)
  return match ? match[1].trim() || undefined : undefined
}
