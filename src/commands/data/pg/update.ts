import type {Answers, DistinctChoice, ListChoiceMap} from 'inquirer'

import {
  color, hux, pg, utils,
} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import inquirer from 'inquirer'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../lib/data/baseCommand.js'
import createPool from '../../../lib/data/createPool.js'
import PoolConfig from '../../../lib/data/poolConfig.js'
import {
  DeepRequired,
  ExtendedPostgresLevelInfo,
  InfoResponse,
  PoolInfoResponse,
} from '../../../lib/data/types.js'
import {fetchLevelsAndPricing, renderPricingInfo} from '../../../lib/data/utils.js'

const heredoc = tsheredoc.default
// eslint-disable-next-line import/no-named-as-default-member
const {Separator, prompt} = inquirer

export default class DataPgUpdate extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
    }),
  }

  static description = 'update a Postgres Advanced database through interactive prompts'

  static flags = {
    app: Flags.app({
      required: true,
    }),
    remote: Flags.remote(),
  }

  private database: DeepRequired<Heroku.AddOn> | pg.ExtendedAddonAttachment['addon'] | undefined
  private extendedLevelsInfo: ExtendedPostgresLevelInfo[] | undefined
  private followerInstanceCount: number = 0
  private pool: PoolInfoResponse | undefined
  private selectedPoolOption: string | undefined

  public async confirmCommand(comparison: string): Promise<void> {
    await hux.confirmCommand({comparison})
  }

  public async followerPoolActionStep(pool: PoolInfoResponse): Promise<string> {
    const choices: Array<DistinctChoice<{ action: string }, ListChoiceMap<{ action: string }>>> = [
      {name: 'Change pool level', value: '__change_level'},
      {name: 'Update number of instances', value: '__update_count'},
      {name: 'Destroy pool', value: '__destroy_pool'},
      new Separator(),
      {name: 'Go back', value: '__go_back'},
    ]

    const {action} = await this.prompt<{action: string}>({
      choices,
      message: 'What do you want to do?:',
      name: 'action',
      type: 'list',
    })

    let newLevel: string | undefined
    let newCount: string | undefined
    const poolConfig = new PoolConfig(this.extendedLevelsInfo!, this.followerInstanceCount)
    switch (action) {
    case '__change_level': {
      newLevel = await poolConfig.levelStep('Follower', pool, true)
      if (newLevel !== '__go_back') {
        ux.action.start('Changing follower pool level')

        try {
          await this.dataApi.patch(`/data/postgres/v1/${this.database!.id}/pools/${pool.id}`, {
            body: {level: newLevel},
          })
          ux.action.stop()
          ux.stdout(heredoc`
              ${color.green('✓ Success:')} Level changed from ${pool.expected_level} to ${newLevel} for follower pool ${pool.name}.
            `)
          pool.expected_level = newLevel
        } catch (error) {
          ux.action.stop(color.red('!'))
          throw error
        }
      }

      break
    }

    case '__update_count': {
      newCount = await poolConfig.instanceCountStep(pool)
      if (newCount !== '__go_back') {
        ux.action.start('Updating follower pool instances count')

        try {
          await this.dataApi.patch(`/data/postgres/v1/${this.database!.id}/pools/${pool.id}`, {
            body: {count: Number(newCount)},
          })
          ux.action.stop()
          ux.stdout(heredoc`
              ${color.success('✓ Success:')} The ${color.name(pool.name)} follower pool now has ${newCount} instance${Number(newCount) === 1 ? '' : 's'}.
            `)
          this.followerInstanceCount = this.followerInstanceCount - pool.expected_count + Number(newCount)
          pool.expected_count = Number(newCount)
        } catch (error) {
          ux.action.stop(color.red('!'))
          throw error
        }
      }

      break
    }

    case '__destroy_pool': {
      await this.confirmCommand(this.database!.app.name)
      ux.action.start(`Destroying follower pool ${color.name(`${pool.name}`)} on ${color.datastore(`${this.database!.name}`)}`)

      try {
        await this.dataApi.delete(`/data/postgres/v1/${this.database!.id}/pools/${pool.id}`)
        ux.action.stop()
      } catch (error) {
        ux.action.stop(color.red('!'))
        throw error
      }

      break
    }

    case '__go_back': {
      break
    }
    }

    process.stderr.write('\n')
    return action
  }

  public async leaderPoolActionStep(pool: PoolInfoResponse): Promise<string> {
    const leaderPricing = this.extendedLevelsInfo!.find(level => level.name === pool.expected_level)?.pricing
    const choices: Array<DistinctChoice<{ action: string }, ListChoiceMap<{ action: string }>>> = [
      {name: 'Change pool level', value: '__change_level'},
    ]

    if (pool.expected_count > 1) {
      choices.push({
        name: 'Remove high availability' + (
          renderPricingInfo(leaderPricing) === 'free'
            ? ''
            : ` ${color.yellowBright(`-${renderPricingInfo(leaderPricing).replace('~', '')}`)}`
        ),
        value: '__remove_ha',
      })
    } else {
      choices.push(
        {
          name: (
            'Add a high availability (HA) standby instance'
            + ` ${color.green(renderPricingInfo(leaderPricing))}`
          ),
          value: '__add_ha',
        },
      )
    }

    choices.push(
      new Separator(),
      {name: 'Go back', value: '__go_back'},
    )

    const {action} = await this.prompt<{action: string}>({
      choices,
      message: 'What do you want to do?:',
      name: 'action',
      type: 'list',
    })

    let newLevel: string | undefined
    const poolConfig = new PoolConfig(this.extendedLevelsInfo!, this.followerInstanceCount)
    switch (action) {
    case '__change_level': {
      newLevel = await poolConfig.levelStep('Leader', pool, true)
      if (newLevel !== '__go_back') {
        ux.action.start('Changing leader pool level')

        try {
          await this.dataApi.patch(`/data/postgres/v1/${this.database!.id}/pools/${pool.id}`, {
            body: {level: newLevel},
          })
          ux.action.stop()
          ux.stdout(heredoc`
              ${color.green('✓ Success:')} Level changed from ${pool.expected_level} to ${newLevel} for leader pool.
            `)
          pool.expected_level = newLevel
        } catch (error) {
          ux.action.stop(color.red('!'))
          throw error
        }
      }

      break
    }

    case '__remove_ha': {
      ux.action.start(`Removing the high availability (HA) standby instance from ${color.addon(`${this.database!.name}`)}`)

      try {
        await this.dataApi.patch(`/data/postgres/v1/${this.database!.id}/pools/${pool.id}`, {
          body: {count: 1},
        })
        ux.action.stop()
        pool.expected_count = 1
      } catch (error) {
        ux.action.stop(color.red('!'))
        throw error
      }

      break
    }

    case '__add_ha': {
      ux.action.start(`Adding a high availability (HA) standby instance for ${color.addon(`${this.database!.name}`)}`)

      try {
        await this.dataApi.patch(`/data/postgres/v1/${this.database!.id}/pools/${pool.id}`, {
          body: {count: 2},
        })
        ux.action.stop()
        pool.expected_count = 2
      } catch (error) {
        ux.action.stop(color.red('!'))
        throw error
      }

      break
    }

    case '__go_back': {
      break
    }
    }

    process.stderr.write('\n')
    return action
  }

  public async prompt<T extends Answers>(...args: Parameters<typeof prompt<T>>): Promise<T> {
    return prompt<T>(...args)
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgUpdate)
    const {app} = flags
    const {database: dbIdentifier} = args

    // Database selection stage
    if (dbIdentifier) {
      const addonResolver = new utils.AddonResolver(this.heroku)
      this.database = await addonResolver.resolve(dbIdentifier, app, utils.pg.addonService())
      if (this.database && !utils.pg.isAdvancedDatabase(this.database)) {
        ux.error(heredoc`
          You can only use this command on Advanced-tier databases.
          Use ${color.code(`heroku addons:upgrade ${this.database.name} -a ${app}`)} instead.`,
        )
      }
    } else {
      const databases = await this.getAllAdvancedDatabases(app)
      if (databases.length === 0) {
        ux.error('No Heroku Postgres Advanced-tier databases found on the app.')
      }

      const selectedDatabase = (
        await this.prompt<{database: string}>({
          choices: this.renderDatabaseChoices(databases),
          message: 'Select the Heroku Postgres Advanced database to update:',
          name: 'database',
          pageSize: 12,
          type: 'list',
        })
      ).database

      if (selectedDatabase !== '__exit') {
        this.database = databases.find(db => db.name === selectedDatabase)
      }
    }

    if (this.database) {
      process.stderr.write(heredoc`

        Update ${color.addon(this.database!.name)} on ${color.app(app)}
        ${color.dim('Press Ctrl+C to cancel')}

      `)

      // Fetch the information on levels and pricing for rendering choices
      const [, planName] = this.database!.plan!.name.split(':', 2)
      const {extendedLevelsInfo} = await fetchLevelsAndPricing(planName, this.dataApi)
      this.extendedLevelsInfo = extendedLevelsInfo

      // Pool selection stage
      await this.poolSelectionLoopStage()
    }
  }

  private async addFollowerPoolStage(): Promise<void> {
    const poolConfig = new PoolConfig(this.extendedLevelsInfo!, this.followerInstanceCount)
    const {count, level, name} = await poolConfig.followerInteractiveConfig()
    try {
      ux.action.start('Configuring follower pool')
      const poolInfo = await createPool(this.dataApi, this.database!, {count, level, name})
      ux.action.stop()
      ux.stdout(heredoc`
        ${color.green('✓ Success:')} we're provisioning ${color.bold(poolInfo.name)} follower pool on ${color.addon(this.database!.name)}.
        Run ${color.code(`heroku data:pg:info ${this.database!.name} -a ${this.database!.app?.name}`)} to check creation progress.
      `)
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }

    process.stderr.write('\n')
    this.followerInstanceCount += count
  }

  /**
   * Helper function that attempts to find all Heroku Postgres Advanced-tier attachments on a given app.
   *
   * @param app - The name of the app to get the attachments for
   * @returns Promise resolving to an array of all Heroku Postgres Advanced-tier attachments on the app
   */
  private async allAdvancedDatabaseAttachments(app: string) {
    const {body: attachments} = await this.heroku.get<pg.ExtendedAddonAttachment[]>(
      `/apps/${app}/addon-attachments`,
      {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          'Accept-Inclusion': 'addon:plan,config_vars',
        },
      },
    )
    return attachments.filter(a => utils.pg.isAdvancedDatabase(a.addon))
  }

  /**
   * Return all Heroku Postgres databases on the Advanced-tier for a given app.
   *
   * @param app - The name of the app to get the databases for
   * @returns Promise resolving to all Heroku Postgres databases
   * @throws {Error} When no legacy database add-on exists on the app
   */
  private async getAllAdvancedDatabases(app: string): Promise<Array<{attachment_names?: string[]} & pg.ExtendedAddonAttachment['addon']>> {
    const allAttachments = await this.allAdvancedDatabaseAttachments(app)
    const addons: Array<{attachment_names?: string[]} & pg.ExtendedAddonAttachment['addon']> = []
    for (const attachment of allAttachments) {
      if (!addons.some(a => a.id === attachment.addon.id)) {
        addons.push(attachment.addon)
      }
    }

    const attachmentNamesByAddon = this.getAttachmentNamesByAddon(allAttachments)
    for (const addon of addons) {
      addon.attachment_names = attachmentNamesByAddon[addon.id]
    }

    return addons
  }

  /**
   * Helper function that groups attachment names by addon.
   *
   * @param attachments - The attachments to group by addon
   * @returns A record of addon IDs with their attachment names
   */
  private getAttachmentNamesByAddon(attachments: pg.ExtendedAddonAttachment[]): Record<string, string[]> {
    const addons: Record<string, string[]> = {}
    for (const attachment of attachments) {
      addons[attachment.addon.id] = [...(addons[attachment.addon.id] || []), attachment.name]
    }

    return addons
  }

  private async poolSelectionLoopStage(): Promise<void> {
    let currentStep = 'poolSelectionStep'

    do {
      let action: string | undefined
      switch (currentStep) {
      case 'poolSelectionStep': {
        await this.poolSelectionStep()
        if (this.selectedPoolOption === '__exit') {
          currentStep = '__exit'
        } else if (this.selectedPoolOption === '__add_follower_pool') {
          currentStep = 'addFollowerPoolStage'
        } else {
          currentStep = 'poolActionStage'
        }

        break
      }

      case 'poolActionStage': {
        if (this.pool!.name === 'leader') {
          action = await this.leaderPoolActionStep(this.pool!)
        } else {
          action = await this.followerPoolActionStep(this.pool!)
        }

        if (action === '__go_back' || action === '__destroy_pool') {
          currentStep = 'poolSelectionStep'
        }

        break
      }

      case 'addFollowerPoolStage': {
        await this.addFollowerPoolStage()
        currentStep = 'poolSelectionStep'
        break
      }
      }
    } while (currentStep !== '__exit')
  }

  private async poolSelectionStep(): Promise<void> {
    // Fetch the info each time we render this menu to show the updated database configuration
    const {body: databaseInfo} = await this.dataApi.get<InfoResponse>(`/data/postgres/v1/${this.database!.id}/info`)
    const {pools} = databaseInfo
    if (pools.length === 0) {
      ux.error('No pools found on the database.') // It should never happen, but just for the sake of safety
    }

    this.followerInstanceCount = pools.filter(pool => pool.name !== 'leader').reduce((acc, pool) => acc + pool.expected_count, 0)

    const selectedPoolOption = (
      await this.prompt<{pool: string}>({
        choices: await this.renderPoolChoices(pools),
        message: 'Select the pool to update, or add a follower pool:',
        name: 'pool',
        type: 'list',
      })
    ).pool
    process.stderr.write('\n')
    this.selectedPoolOption = selectedPoolOption
    this.pool = pools.find(pool => pool.name === this.selectedPoolOption)
  }

  private renderDatabaseChoices(databases: Array<{attachment_names?: string[]} & pg.ExtendedAddonAttachment['addon']>) {
    const choices: Array<DistinctChoice<{ action: string }, ListChoiceMap<{ action: string }>>> = []

    databases.forEach(database => {
      choices.push(
        {name: `${database.name} (${database.attachment_names?.join(', ')})`, value: database.name},
      )
    })
    choices.push(
      new Separator(),
      {name: 'Exit', value: '__exit'},
    )
    return choices
  }

  private async renderPoolChoices(pools: PoolInfoResponse[]): Promise<Array<DistinctChoice<{ pool: string }, ListChoiceMap<{ pool: string }>>>> {
    const leaderPool = pools.find(pool => pool.name === 'leader')
    const followerPools = pools.filter(pool => pool.name !== 'leader').sort((a, b) => a.name.localeCompare(b.name))
    const choices: Array<DistinctChoice<{ pool: string }, ListChoiceMap<{ pool: string }>>> = []

    if (leaderPool) {
      const levelInfo = this.extendedLevelsInfo!.find(level => level.name === leaderPool.expected_level)
      choices.push({
        name: `Leader: ${levelInfo!.name}`
          + ` ${`${levelInfo!.vcpu} ${color.inverse('vCPU')}`}`
          + ` ${`${levelInfo!.memory_in_gb} GB ${color.inverse('MEM')}`}`
          + color.green(
            ` ${leaderPool.expected_count} instance${leaderPool.expected_count === 1 ? '' : 's'}`
            + ` ${`starting at ${renderPricingInfo(levelInfo!.pricing)}`}`
            + `${leaderPool.expected_count === 1 ? '' : ' each'}`,
          ),
        value: leaderPool.name,
      })
    }

    followerPools.forEach(pool => {
      const levelInfo = this.extendedLevelsInfo!.find(level => level.name === pool.expected_level)
      choices.push({
        name: `Follower ${color.bold(pool.name)}: ${levelInfo!.name}`
          + ` ${`${levelInfo!.vcpu} ${color.inverse('vCPU')}`}`
          + ` ${`${levelInfo!.memory_in_gb} GB ${color.inverse('MEM')}`}`
          + color.green(
            ` ${pool.expected_count} instance${pool.expected_count === 1 ? '' : 's'}`
            + ` ${`starting at ${renderPricingInfo(levelInfo!.pricing)}`}`
            + `${pool.expected_count === 1 ? '' : ' each'}`,
          ),
        value: pool.name,
      })
    })

    choices.push(
      new Separator(),
      {name: 'Add a follower pool', value: '__add_follower_pool'},
      {name: 'Exit', value: '__exit'},
    )

    return choices
  }
}
