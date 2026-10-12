import {createHash} from 'node:crypto'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

interface CacheEntry {
  expiresAt: number
  values: string[]
}

/**
 * Tiny TTL file cache for completion values.
 *
 * Every TAB press cold-boots Node, resolves auth, and hits the API; without a
 * cache that is a visible pause on each completion. Values are stored at
 * `<cacheDir>/autocomplete/completions/<key>.json` with an absolute expiry: a
 * fresh entry is reused, a stale / missing / corrupt one is recomputed. Writes
 * are best-effort — a failure just means the next completion recomputes.
 */
export async function cachedValues(
  cacheDir: string,
  key: string,
  ttlSeconds: number,
  compute: () => Promise<string[]>,
): Promise<string[]> {
  const dir = path.join(cacheDir, 'autocomplete', 'completions')
  const file = path.join(dir, `${safeKey(key)}.json`)

  const cached = await readEntry(file)
  if (cached && cached.expiresAt > Date.now()) return cached.values

  const values = await compute()
  // Never persist an empty result. An empty list is almost always a transient
  // "can't answer right now" (logged out, offline, a failed fetch that resolved
  // to []), not a real answer — caching it with the full TTL would hide live
  // values for up to a day after the user logs in or reconnects. Recomputing on
  // the rare genuinely-empty account (zero apps) is one cheap API call.
  if (values.length === 0) return values

  try {
    await mkdir(dir, {recursive: true})
    const entry: CacheEntry = {expiresAt: Date.now() + (ttlSeconds * 1000), values}
    await writeFile(file, JSON.stringify(entry))
  } catch {
    // best-effort: a write failure only costs a recompute next time.
  }

  return values
}

async function readEntry(file: string): Promise<CacheEntry | undefined> {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as CacheEntry
    if (typeof parsed?.expiresAt === 'number' && Array.isArray(parsed.values)) return parsed
  } catch {
    // missing or corrupt entry: treat as a cache miss.
  }

  return undefined
}

/** Turn an arbitrary cache key into a readable, filesystem-safe filename. */
function safeKey(key: string): string {
  const slug = key.replaceAll(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40)
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 8)
  return `${slug}-${hash}`
}
