import * as routes from '@heroku/types/3.sdk/routes'

export type HttpVerb = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

export type RouteEntry = {
  hasRequestBody: boolean
  method: string
  path: string
  pathRegex: RegExp
  placeholders: string[]
  resource: string
  verb: HttpVerb
}

export type RouteLookupResult = {
  args: string[]
  entry: RouteEntry
}

export class RouteIndex {
  private readonly byVerb: Map<HttpVerb, RouteEntry[]>

  constructor(entries: RouteEntry[]) {
    this.byVerb = new Map()
    for (const entry of entries) {
      const list = this.byVerb.get(entry.verb) ?? []
      list.push(entry)
      this.byVerb.set(entry.verb, list)
    }
  }

  static load(): RouteIndex {
    const entries: RouteEntry[] = []
    for (const [resource, methods] of Object.entries(routes)) {
      if (resource === 'default' || typeof methods !== 'object' || methods === null) continue
      for (const [method, def] of Object.entries(methods as Record<string, {hasRequestBody?: boolean; method: string; path: string}>)) {
        entries.push(buildEntry(resource, method, def))
      }
    }

    return new RouteIndex(entries)
  }

  lookup(verb: HttpVerb, concretePath: string): null | RouteLookupResult {
    const candidates = this.byVerb.get(verb) ?? []
    const matches: RouteLookupResult[] = []
    for (const entry of candidates) {
      const match = concretePath.match(entry.pathRegex)
      if (match) matches.push({args: match.slice(1), entry})
    }

    if (matches.length === 0) return null
    if (matches.length > 1) {
      throw new Error(
        `ambiguous route resolution for ${verb} ${concretePath}: ` +
          matches.map(m => `${m.entry.resource}.${m.entry.method}`).join(', '),
      )
    }

    return matches[0]
  }
}

function buildEntry(resource: string, method: string, def: {hasRequestBody?: boolean; method: string; path: string}): RouteEntry {
  const placeholders = [...def.path.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(m => m[1])
  return {
    hasRequestBody: Boolean(def.hasRequestBody),
    method,
    path: def.path,
    pathRegex: pathToRegex(def.path),
    placeholders,
    resource,
    verb: def.method as HttpVerb,
  }
}

function pathToRegex(path: string): RegExp {
  const escaped = path.replace(/[.+*?^$()|[\]\\]/g, '\\$&').replace(/\{[a-zA-Z][a-zA-Z0-9]*\}/g, '([^/]+)')
  return new RegExp(`^${escaped}$`)
}
