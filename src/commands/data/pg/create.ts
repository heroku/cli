import {color, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import inquirer from 'inquirer'
import tsheredoc from 'tsheredoc'

import createAddon from '../../../lib/addons/create_addon.js'
import BaseCommand from '../../../lib/data/baseCommand.js'
import createPool from '../../../lib/data/createPool.js'
import {parseProvisionOpts} from '../../../lib/data/parseProvisionOpts.js'
import PoolConfig from '../../../lib/data/poolConfig.js'
import {ExtendedPostgresLevelInfo} from '../../../lib/data/types.js'
import {fetchLevelsAndPricing} from '../../../lib/data/utils.js'
import notify from '../../../lib/notify.js'

const heredoc = tsheredoc.default
// eslint-disable-next-line import/no-named-as-default-member
const {prompt} = inquirer

export default class DataPgCreate extends BaseCommand {
  static baseFlags = BaseCommand.baseFlagsWithoutPrompt()
  static description = 'create a Postgres Advanced database'
  static examples = ['<%= config.bin %> <%= command.id %> --level 4G-Performance -a example-app']

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

  private addon: Heroku.AddOn | undefined
  private extendedLevelsInfo: ExtendedPostgresLevelInfo[] | undefined
  private followerInstanceCount: number = 0
  private highAvailability: boolean | undefined
  private leaderLevel: string | undefined

  public async prompt<T extends inquirer.Answers>(...args: Parameters<typeof inquirer.prompt<T>>): Promise<T> {
    return prompt<T>(...args)
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DataPgCreate)
    const {app, as, confirm, name, network, 'provision-option': provisionOpts, version, wait} = flags
    const {followers, 'high-availability': highAvailability, level} = flags
    const service = utils.pg.addonService()

    const plan = `advanced${network ? `-${network}` : ''}`
    const servicePlan = `${service}:${plan}`

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

    // Database cluster provisioning (leader pool)
    const config: Record<string, boolean | string | undefined> = {
      'high-availability': this.highAvailability,
      level: this.leaderLevel,
      version,
      ...provisionConfig,
    }

    try {
      this.addon = await createAddon(this.heroku, app, servicePlan, confirm, wait, {
        actionStartMessage: `Creating a ${color.cyan(this.leaderLevel)} database on ${color.app(app)}`,
        actionStopMessage: 'done',
        as, config, name,
      })

      if (wait) {
        notify('heroku data:pg:create', 'We successfully provisioned the database')
      }
    } catch (error) {
      ux.action.stop()

      if (wait) {
        notify(
          'heroku data:pg:create',
          'We can’t provision the database. Try again or open a ticket with Heroku Support: https://help.heroku.com/.',
          false,
        )
      }

      throw error
    }

    // Follower Pool(s) Configuration Stage

    if (!level) {
      // Interactive mode
      await this.followerPoolConfigLoop()
      process.stderr.write(
        `Running ${color.code(`heroku data:pg:info ${this.addon.name!} --app=${app}`)}...\n\n`,
      )
      await this.runCommand('data:pg:info', [this.addon.name!, `--app=${app}`])
    } else if (followers && followers > 0) {
      const poolInfo = await createPool(this.dataApi, this.addon!, {
        count: followers,
        level: this.leaderLevel!,
      })
      ux.stdout(heredoc`
        ${color.green('Success:')} we're provisioning ${color.bold(poolInfo.name)} follower pool on ${color.addon(this.addon.name!)}.
        Run ${color.code(`heroku data:pg:info ${this.addon!.name} -a ${this.addon!.app?.name}`)} to check creation progress.
      `)
    }
  }

  public async runCommand(command: string, args: string[]): Promise<void> {
    await this.config.runCommand(command, args)
  }

  private async followerPoolConfigLoop(): Promise<void> {
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
          const poolInfo = await createPool(this.dataApi, this.addon!, {count, level, name})
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
        if (this.followerInstanceCount >= 13) {
          oneMore = false
        } else {
          oneMore = (await this.prompt<{oneMore: boolean}>({
            default: false,
            message: 'Configure another follower pool?',
            name: 'oneMore',
            type: 'confirm',
          })).oneMore
        }
      } else {
        oneMore = false
      }
    } while (oneMore)
  }

  private async leaderPoolConfig(): Promise<void> {
    const poolConfig = new PoolConfig(this.extendedLevelsInfo!, this.followerInstanceCount)

    process.stderr.write(heredoc`

      Create a Heroku Postgres Advanced database
      ${color.dim('Press Ctrl+C to cancel')}

    `)

    process.stderr.write(heredoc`
      → Configure Leader Pool
      ${color.dim('  Configure Follower Pool(s)')}\n
    `)

    const {highAvailability, level} = await poolConfig.leaderInteractiveConfig()
    this.leaderLevel = level
    this.highAvailability = highAvailability
  }
}
