import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Dyno, Release} from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class Wait extends Command {
  static description = 'wait for all dynos to be running latest version after a release'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    type: flags.string({
      char: 't',
      description: 'wait for one specific dyno type',
    }),
    'wait-interval': flags.integer({
      char: 'w',
      default: 10,
      description: 'how frequently to poll in seconds (to avoid hitting Heroku API rate limits)',
      async parse(input) {
        const w = Number.parseInt(input, 10)
        if (w < 10) {
          ux.error('wait-interval must be at least 10', {exit: 1})
        }

        return w
      },
    }),
    'with-run': flags.boolean({
      char: 'R',
      description: 'whether to wait for one-off run dynos',
      exclusive: ['type'],
    }),
  }

  static topic = 'ps'

  async run() {
    const {flags} = await this.parse(Wait)

    const {body: releases} = await this.heroku.request<Release[]>(`/apps/${flags.app}/releases`, {
      headers: {
        Range: 'version ..; max=1, order=desc',
      },
      partial: true,
    })

    if (releases.length === 0) {
      this.warn(`App ${color.app(flags.app)} has no releases`)
      return
    }

    const latestRelease = releases[0]

    let released = true
    const interval = flags['wait-interval'] as number

    while (1 as any) {
      const {body: dynos} = await this.heroku.get<Dyno[]>(`/apps/${flags.app}/dynos`)
      const relevantDynos = dynos
        .filter(dyno => dyno.type !== 'release')
        .filter(dyno => flags['with-run'] || dyno.type !== 'run')
        .filter(dyno => !flags.type || dyno.type === flags.type)

      const onLatest = relevantDynos.filter((dyno: Dyno) => (
        dyno.state === 'up'
        && latestRelease.version !== undefined
        && dyno.release !== undefined
        && dyno.release.version !== undefined
        && dyno.release.version >= latestRelease.version
      ))
      const releasedFraction = `${onLatest.length} / ${relevantDynos.length}`
      if (onLatest.length === relevantDynos.length) {
        if (!released) {
          ux.action.stop(`${releasedFraction}, done`)
        }

        break
      }

      if (released) {
        released = false
        ux.action.start(`Waiting for every dyno to be running v${latestRelease.version}`)
      }

      ux.action.status = releasedFraction

      await hux.wait(interval * 1000)
    }
  }
}
