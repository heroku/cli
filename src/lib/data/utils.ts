import type {DistinctChoice, ListChoiceMap} from 'inquirer'

import {color, hux} from '@heroku/heroku-cli-util'
import {APIClient} from '@heroku-cli/command'
import * as inquirer from 'inquirer'
import printf from 'printf'

import {
  ExtendedPostgresLevelInfo,
  PoolInfoResponse,
  PostgresLevelsResponse,
  PricingInfo,
  PricingInfoResponse,
} from './types.js'

const {Separator} = inquirer

/**
 * @description Formats pricing information into a human-readable text with both hourly and monthly rates
 * @param pricingInfo - The PricingInfo object
 * @param count - The number of units to calculate the pricing for
 * @returns A formatted string with colored pricing information, or empty string if no pricing info provided
 */
export function renderPricingInfo(pricingInfo?: PricingInfo | null, count: number = 1) {
  if (!pricingInfo) return ''

  const priceHourly = hux.formatPrice(pricingInfo.rate * count, true)
  const priceMonthly = hux.formatPrice(pricingInfo.rate * count)

  if (priceHourly === 'free') return priceHourly

  if (pricingInfo.billing_unit === 'gigabyte') {
    return `${priceMonthly}/GB·month`
  }

  return `${priceHourly}/hour (${priceMonthly}/month)`
}

/**
 * @description Cache for Postgres levels and pricing data to avoid redundant API calls.
 * Maps cache keys (format: `levels-pricing-${tier}`) to promises that resolve with
 * extended level information and optional optimized storage pricing.
 *
 * The cache stores promises rather than resolved values to prevent duplicate concurrent
 * requests for the same tier. If a request fails, the cache entry is removed to allow
 * retries on subsequent calls.
 *
 * @type {Map<string, Promise<{extendedLevelsInfo: ExtendedPostgresLevelInfo[], optimizedStoragePricing?: PricingInfo}>>}
 *
 * @property {string} key - Cache key in the format `levels-pricing-${tier}` where tier is the Postgres tier (e.g., 'advanced')
 * @property {Promise<{extendedLevelsInfo: ExtendedPostgresLevelInfo[], optimizedStoragePricing?: PricingInfo}>} value - Promise that resolves to:
 *   - `extendedLevelsInfo`: Array of Postgres level information with associated pricing data
 *   - `optimizedStoragePricing`: Optional pricing information for storage-optimized plans
 */
const levelsAndPricingCache: Map<string, Promise<{ extendedLevelsInfo: ExtendedPostgresLevelInfo[]; optimizedStoragePricing?: PricingInfo }>> = new Map()

/**
 * @description Clears the cache of Postgres levels and pricing data.
 * Removes all cached entries, allowing subsequent calls to fetch levels and pricing to start fresh.
 * This is useful for testing or when you want to ensure fresh data is fetched.
 * @returns void
 */
export function clearLevelsAndPricingCache(): void {
  levelsAndPricingCache.clear()
}

/**
 * @description Fetches Postgres levels and pricing information for a given tier, with caching to avoid redundant API calls.
 * Makes parallel requests to fetch levels and pricing data, then combines them by matching level names with product descriptions.
 * Results are cached per tier to prevent duplicate requests. If a request fails, the cache entry is removed to allow retries.
 *
 * @param tier - The Postgres tier to fetch levels and pricing for (e.g., 'advanced')
 * @param dataApi - The API client instance used to make HTTP requests to the Heroku Data API
 * @returns Promise that resolves to an object containing:
 *   - `extendedLevelsInfo`: Array of Postgres level information with associated pricing data matched by product description
 *   - `optimizedStoragePricing`: Optional pricing information for storage-optimized plans, if available for the tier
 *
 * @throws {Error} Re-throws any errors from the API requests. The cache entry is removed on error to allow retries.
 *
 * @example
 *   const {extendedLevelsInfo, optimizedStoragePricing} = await fetchLevelsAndPricing('advanced', dataApi)
 *   // extendedLevelsInfo contains levels with their matching pricing information
 *   // optimizedStoragePricing may contain storage-optimized pricing if available
 */
export async function fetchLevelsAndPricing(
  tier: string,
  dataApi: APIClient,
): Promise<{
  extendedLevelsInfo: ExtendedPostgresLevelInfo[]
  optimizedStoragePricing?: PricingInfo
}> {
  const cacheKey = `levels-pricing-${tier}`

  if (!levelsAndPricingCache.has(cacheKey)) {
    const promise = (async () => {
      const levelsPromise = dataApi.get<PostgresLevelsResponse>('/data/postgres/v1/levels/advanced')
      const pricingPromise = dataApi.get<PricingInfoResponse>('/data/postgres/v1/pricing')

      const [{body: levels}, {body: pricing}] = await Promise.all([
        levelsPromise,
        pricingPromise,
      ])

      const extendedLevelsInfo = levels.items.map(level => ({
        ...level,
        pricing: Object.entries(pricing[tier]).find(
          ([_, value]) => value.product_description === level.name, // eslint-disable-line @typescript-eslint/no-unused-vars
        )?.[1],
      }))

      const optimizedStoragePricing = Object.entries(pricing[tier]).find(
        ([key, _]) => key === 'storage-optimized', // eslint-disable-line @typescript-eslint/no-unused-vars
      )?.[1]

      return {extendedLevelsInfo, optimizedStoragePricing}
    })().catch(error => {
      // Remove from cache on error
      levelsAndPricingCache.delete(cacheKey)
      throw error
    })

    levelsAndPricingCache.set(cacheKey, promise)
  }

  return levelsAndPricingCache.get(cacheKey)!
}

/**
 * @description Renders Postgres level information as formatted inquirer choices for interactive selection.
 * Formats each level with aligned columns showing name, vCPU count, memory, and pricing information.
 * The current level (if it matches the pool's expected level) is disabled in the choices.
 * Optionally includes a "Go back" option at the end of the list.
 *
 * @param extendedLevelsInfo - Array of Postgres level information with associated pricing data to render as choices
 * @param pool - Optional pool information used to identify and disable the current level in the choices
 * @param withGoBack - If true, adds a separator and "Go back" option at the end of the choices list (default: false)
 * @returns Promise that resolves to an array of inquirer choice objects, where each choice:
 *   - `name`: Formatted string with aligned columns showing level name, vCPU, memory, and pricing
 *   - `value`: The level name (used as the selected value)
 *   - `disabled`: Either `false` (selectable) or `'current level'` (if it matches the pool's expected level)
 *
 * @example
 *   const choices = await renderLevelChoices(extendedLevelsInfo, pool, true)
 *   // Returns choices array with formatted level options and optional "Go back" option
 *   // Current level (if matching pool) will be disabled
 */
export async function renderLevelChoices(
  extendedLevelsInfo: ExtendedPostgresLevelInfo[],
  pool?: PoolInfoResponse,
  withGoBack: boolean = false,
): Promise<Array<DistinctChoice<{ level: string }, ListChoiceMap<{ level: string }>>>> {
  const choices: string[][] = []

  extendedLevelsInfo.forEach(level => {
    const columns: string[] = []
    columns.push(
      `${level.name}`,
      `${printf('%3d', level.vcpu)} ${color.inverse('vCPU')} `,
      `${printf('%4d', level.memory_in_gb)} GB ${color.inverse('MEM')} `,
      `starting at ${color.green(renderPricingInfo(level.pricing))}`,
    )
    choices.push(columns)
  })
  const alignedChoiceNames = hux.alignColumns(choices)
  return [
    ...alignedChoiceNames.map(choice => {
      const levelName = choice.split(' ')[0]
      return {
        disabled: levelName === pool?.expected_level ? 'current level' : false,
        name: choice,
        value: levelName,
      }
    }),
    ...(withGoBack ? [new Separator(), {name: 'Go back', value: '__go_back'}] : []),
  ]
}
