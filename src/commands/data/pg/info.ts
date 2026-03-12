import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../lib/data/baseCommand.js'
import {formatQuotaStatus} from '../../../lib/data/displayQuota.js'
import {InfoResponse, PoolInfoResponse, Quota} from '../../../lib/data/types.js'

const heredoc = tsheredoc.default

const poolStatusRenderMap: Record<PoolInfoResponse['status'], string> = {
  available: color.success('✓ Available'),
  modifying: color.warning('⚡ Modifying'),
  provisioning: color.warning('⚡ Provisioning'),
  unknown: color.failure('? Unknown'),
}

function renderPoolSummary(pool: PoolInfoResponse, attachments: Required<Heroku.AddOnAttachment>[]) {
  const poolAttachmentNames = attachments
    .filter(a => {
      if (pool.name === 'leader') {
        return !a.namespace && a.addon.app.id === a.app.id
      }

      return a.namespace === `pool:${pool.name}` && a.addon.app.id === a.app.id
    })
    .map(a => color.attachment(a.name))
    .join(', ')

  const poolStatus = poolStatusRenderMap[pool.status]
  const connections = `Connections: ${pool.connections_used ?? color.dim('?')} / ${pool.expected_connection_limit} used`
  const {expected_count: expectedCount, expected_level: expectedLevel} = pool
  const poolSize = color.bold(`${expectedCount} instance${expectedCount === 1 ? '' : 's'} of ${expectedLevel}${expectedCount > 1 ? ' (HA)' : ''}:`)

  const instances: string[] = []
  const {compute_instances: computeInstances, name: poolName} = pool
  computeInstances.forEach(({id, role, status}) => {
    let instanceName: string

    if (role === 'standby') {
      instanceName = color.dim(`${role}.${id}`)
    } else {
      instanceName = `${role}.${id}`
    }

    const instanceStatus = status === 'up' ? color.success(status) : color.warning(status)
    instances.push(`  ${instanceName}: ${instanceStatus}`)
  })

  if (poolName === 'leader') {
    hux.styledHeader(`Leader pool${poolAttachmentNames ? color.dim(` (attached as ${poolAttachmentNames})`) : ''}`)
  } else {
    hux.styledHeader(`Follower pool ${color.name(poolName)}${poolAttachmentNames ? color.dim(` (attached as ${poolAttachmentNames})`) : ''}`)
  }

  ux.stdout(
    `  ${poolStatus}\n`
    + `  ${connections}\n`
    + `  ${poolSize}\n`
    + `  ${instances.join('\n  ')}\n`,
  )
}

export default class DataPgInfo extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'get details on a Postgres Advanced database'

  static examples = ['<%= config.bin %> <%= command.id %> database_name']

  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgInfo)
    const {database} = args
    const {app} = flags

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())

    if (!utils.pg.isAdvancedDatabase(addon)) {
      ux.error(heredoc`
        You can only use this command on Advanced-tier databases.
        Run ${color.code(`heroku pg:info ${addon.name} -a ${app}`)} instead.`,
      )
    }

    const [{body: info}, {body: attachments}] = await Promise.all([
      this.dataApi.get<InfoResponse>(`/data/postgres/v1/${addon.id}/info`),
      this.heroku.get<Required<Heroku.AddOnAttachment>[]>(`/addons/${addon.id}/addon-attachments`),
    ])
    const {
      created_at: createdAt,
      features,
      forked_from: forkedFrom,
      pools,
      quotas,
      region,
      status,
      tier,
      version,
    } = info

    hux.styledHeader(`${color.datastore(info.addon.name)} on ${color.app(info.app.name!)}`)

    const statusInfo = status === 'available'
      ? color.success(hux.toTitleCase(status)!)
      : color.warning(hux.toTitleCase(status)!)

    const rollbackInfo = features.rollback.enabled
      ? (features.rollback.earliest_time
        ? `earliest from ${this.renderDateInfo(features.rollback.earliest_time!)}`
        : 'Unavailable')
      : 'Unsupported'

    /* eslint-disable perfectionist/sort-objects */
    const infoObject: Record<string, string> = {
      Plan: hux.toTitleCase(tier)!,
      Status: statusInfo,
      'Data Size': this.renderDataSizeInfo(info),
      Tables: this.renderTableInfo(info),
      'PG Version': version,
      Rollback: rollbackInfo,
      Region: region,
    }
    /* eslint-enable perfectionist/sort-objects */

    if (forkedFrom) {
      infoObject['Forked From'] = color.datastore(forkedFrom.name)
    }

    Object.assign(infoObject, {
      ...infoObject,
      Created: this.renderDateInfo(createdAt),
      Quotas: ' ',
    })

    const quotasInfo = this.renderQuotasInfo(quotas)
    hux.styledObject({...infoObject, ...quotasInfo}, [...Object.keys(infoObject), ...Object.keys(quotasInfo)])
    ux.stdout('')

    if (pools.length > 0) {
      const leaderPool = pools.find(pool => pool.name === 'leader')
      const otherPools = pools.filter(pool => pool.name !== 'leader').sort((a, b) => a.name.localeCompare(b.name))

      if (leaderPool) {
        renderPoolSummary(leaderPool, attachments)
      }

      if (otherPools.length > 0) {
        otherPools.forEach(pool => {
          renderPoolSummary(pool, attachments)
        })
      }
    }
  }

  private renderDataSizeInfo(info: InfoResponse) {
    const storageLimit = info.plan_limits.find(limit => limit.name === 'storage-limit-in-gb')

    if (!storageLimit || !storageLimit.current) {
      return 'N/A'
    }

    return `${hux.toHumanReadableDataSize(storageLimit.current)} / ${hux.toHumanReadableDataSize(storageLimit.limit)}`
  }

  private renderDateInfo(dateStr: string): string {
    const date = new Date(dateStr)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes} UTC`
  }

  private renderQuotasInfo(quotas: Quota[]): Record<string, string> {
    const quotaInfo: Record<string, string> = {}
    quotas.forEach(quota => {
      const usageMessage = formatQuotaStatus(quota)
      quotaInfo[`  ${hux.toTitleCase(quota.type)}`] = `${usageMessage}`
    })
    return quotaInfo
  }

  private renderTableInfo(info: InfoResponse) {
    const tableLimit = info.plan_limits.find(limit => limit.name === 'table-limit')
    const tableLimitCompliance = tableLimit && tableLimit.current <= tableLimit.limit
      ? 'In compliance'
      : 'Not in compliance'
    return tableLimit ? `${tableLimit.current} / ${tableLimit.limit} (${tableLimitCompliance})` : color.dim('N/A')
  }
}
