/* eslint-disable no-await-in-loop */
import type {AddOn} from '@heroku/types/3.sdk'

import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {postgresExtensions} from '@heroku/sdk/extensions/data'
import {ux} from '@oclif/core'
import inquirer from 'inquirer'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../lib/data/base-command.js'
import {parseProvisionOpts} from '../../../lib/data/parse-provision-opts.js'
import PoolConfig from '../../../lib/data/pool-config.js'
import provisionInteractively from '../../../lib/data/provision-interactively.js'
import {ExtendedPostgresLevelInfo} from '../../../lib/data/types.js'
import {fetchLevelsAndPricing} from '../../../lib/data/utils.js'
import notify from '../../../lib/notify.js'
import {createSDK} from '../../../lib/sdk.js'

const heredoc = tsheredoc
const {prompt} = inquirer

type Data = ReturnType<typeof createSDK<readonly [typeof postgresExtensions]>>['data']

export default class DataPgCreate extends BaseCommand {
  static baseFlags = BaseCommand.baseFlagsWithoutPrompt()
  static description = 'create a Postgres Advanced database'
  static examples = ['<%= config.bin %> <%= command.id %> --level 4G-Performance --app example-app']
  static flags = {
    app: Flags.app({
      required: true,
    }),
    as: Flags.string({description: 'name for the initial database attachment'}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    followers: Flags.integer({
      dependsOn: ['level'],
      description: 'provision a follower instance pool with the specified number of instances',
      max: 13,
      min: 1,
    }),
    'high-availability': Flags.boolean({
      allowNo: true,
      dependsOn: ['level'],
      description: 'enable or disable high availability on the leader pool by provisioning a warm standby instance',
    }),
    level: Flags.string({
      description: 'set compute scale',
    }),
    name: Flags.string({description: 'name for the database'}),
    network: Flags.string({description: 'set network for the database', options: ['private', 'shield']}),
    'provision-option': Flags.string({
      description: 'additional options for provisioning in KEY:VALUE or KEY format, and VALUE defaults to "true" (example: \'foo:bar\' or \'foo\')',
      multiple: true,
    }),
    remote: Flags.remote(),
    version: Flags.string({description: 'Postgres version for the database'}),
    wait: Flags.boolean({
      dependsOn: ['level'],
      description: 'watch database creation status and exit when complete',
    }),
  }
  static promptFlagActive = false
  private addon: AddOn | undefined
  private extendedLevelsInfo: ExtendedPostgresLevelInfo[] | undefined
  private followerInstanceCount: number = 0
  private highAvailability: boolean | undefined
  private leaderLevel: string | undefined

  public async notify(message: string, success = true): Promise<void> {
    notify('heroku data:pg:create', message, success)
  }

  public async prompt<T extends inquirer.Answers>(...args: Parameters<typeof inquirer.prompt<T>>): Promise<T> {
    return prompt<T>(...args)
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DataPgCreate)
    const {app, as, confirm, name, network, 'provision-option': provisionOpts, version, wait} = flags
    const {followers, 'high-availability': highAvailability, level} = flags

    const {data} = createSDK(this.heroku, {extensions: [postgresExtensions]})

    const plan = `advanced${network ? `-${network}` : ''}`

    // Parse provision options
    let provisionConfig: Record<string, string> = {}
    if (provisionOpts) {
      try {
        provisionConfig = parseProvisionOpts(provisionOpts)
      } catch (error) {
        ux.error(error instanceof Error ? error.message : String(error))
      }
    }

    // Leader Pool Configuration Stage

    if (level) {
      this.leaderLevel = level
      this.highAvailability = highAvailability
    } else {
      // Fetch the information on levels and pricing for rendering choices
      const {extendedLevelsInfo} = await fetchLevelsAndPricing(plan, this.dataApi)
      this.extendedLevelsInfo = extendedLevelsInfo

      // Start the interactive mode
      await this.leaderPoolConfig()
    }

    // Database cluster provisioning (leader pool, and bundled follower pool in
    // non-interactive mode). The SDK's provisionAdvanced owns create + optional
    // wait-poll + follower-pool create; the helper owns the CLI UX.
    let pool
    try {
      const result = await provisionInteractively(
        {
          actionStartMessage: `Creating a ${color.addon(this.leaderLevel || '')} database on ${color.app(app)}`,
          actionStopMessage: 'done',
          app,
          confirm,
          wait: Boolean(wait),
        },
        (confirmValue, hooks) => data.postgres.provisionAdvanced(app, {
          as,
          config: provisionConfig,
          confirm: confirmValue,
          followers,
          highAvailability: this.highAvailability,
          level: this.leaderLevel!,
          name,
          network: network as 'private' | 'shield' | undefined,
          version,
        }, hooks),
      )
      this.addon = result.addon
      pool = result.pool

      if (wait) {
        this.notify('We successfully provisioned the database')
      }
    } catch (error) {
      if (wait) {
        this.notify(
          'We can’t provision the database. Try again or open a ticket with Heroku Support: https://help.heroku.com/.',
          false,
        )
      }

      throw error
    }

    // Follower Pool(s) Configuration Stage

    if (!level) {
      // Interactive mode
      await this.followerPoolConfigLoop(data)
      process.stderr.write(`Running ${color.code(`heroku data:pg:info ${this.addon.name!} --app=${app}`)}...\n\n`)
      await this.runCommand('data:pg:info', [this.addon.name!, `--app=${app}`])
    } else if (pool) {
      ux.stdout(heredoc`
        ${color.green('Success:')} we're provisioning ${color.bold(pool.name)} follower pool on ${color.addon(this.addon.name!)}.
        Run ${color.code(`heroku data:pg:info ${this.addon.name} -a ${this.addon.app?.name}`)} to check creation progress.
      `)
    }
  }

  public async runCommand(command: string, args: string[]): Promise<void> {
    await this.config.runCommand(command, args)
  }

  private async followerPoolConfigLoop(data: Data): Promise<void> {
    process.stderr.write('\n')
    const {action} = await this.prompt<{action: string}>({
      choices: [
        {name: 'Configure a follower pool', value: 'configure'},
        {name: 'Exit', value: 'exit'},
      ],
      message: 'You can configure a follower pool while the leader pool is being configured.',
      name: 'action',
      type: 'list',
    })

    let oneMore: boolean = false
    do {
      process.stderr.write('\n')
      if (action === 'configure') {
        const poolConfig = new PoolConfig(this.extendedLevelsInfo!, this.followerInstanceCount)
        const {count, level, name} = await poolConfig.followerInteractiveConfig()
        try {
          ux.action.start('Configuring follower pool')
          const poolInfo = await data.postgresPool.create(this.addon!.id!, {count, level, name})
          ux.action.stop()
          ux.stdout(heredoc`
            ${color.green('Success:')} we're provisioning ${color.bold(poolInfo.name)} follower pool on ${color.addon(this.addon!.name!)}.
            Run ${color.code(`heroku data:pg:info ${this.addon!.name} -a ${this.addon!.app?.name}`)} to check creation progress.
          `)
        } catch (error) {
          ux.action.stop()
          throw error
        }

        process.stderr.write('\n')
        this.followerInstanceCount += count
        oneMore = this.followerInstanceCount >= 13
          ? false
          : (await this.prompt<{oneMore: boolean}>({
            default: false,
            message: 'Configure another follower pool?',
            name: 'oneMore',
            type: 'confirm',
          })).oneMore
      } else {
        oneMore = false
      }
    } while (oneMore)
  }

  private async leaderPoolConfig(): Promise<void> {
    const poolConfig = new PoolConfig(this.extendedLevelsInfo!, this.followerInstanceCount)

    process.stderr.write(heredoc`

      Create a Heroku Postgres Advanced database
      ${color.gray('Press Ctrl+C to cancel')}

    `)

    process.stderr.write(heredoc`
      → Configure Leader Pool
      ${color.gray('  Configure Follower Pool(s)')}\n
    `)

    const {highAvailability, level} = await poolConfig.leaderInteractiveConfig()
    this.leaderLevel = level
    this.highAvailability = highAvailability
  }
}
