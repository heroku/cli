import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import {Dyno, Release} from '@heroku-cli/schema'

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
      description: 'how frequently to poll in seconds (to avoid hitting Heroku API rate limits)',
      parse: input => {
        const w = parseInt(input, 10)
        if (w < 10) {
          cli.error('wait-interval must be at least 10', {exit: 1})
        }
        return w
      },
      default: 10,
    }),
    'with-run': flags.boolean({
      char: 'R',
      description: 'whether to wait for one-off run dynos',
      exclusive: ['type'],
    }),
  }

  async run() {
    const {flags} = this.parse(Wait)

    const {body: releases} = await this.heroku.request<Release[]>(`/apps/${flags.app}/releases`, {
      partial: true,
      headers: {
        Range: 'version ..; max=1, order=desc',
      },
    })

    if (releases.length === 0) {
      this.warn(`App ${flags.app} has no releases`)
      return
    }

    const latestRelease = releases[0]

    let released = true
    const interval = flags['wait-interval'] as number

    while (1 as any) {
      // eslint-disable-next-line no-await-in-loop
      const {body: dynos} = await this.heroku.get<Dyno[]>(`/apps/${flags.app}/dynos`)
      const relevantDynos = dynos
      .filter(dyno => dyno.type !== 'release')
      .filter(dyno => flags['with-run'] || dyno.type !== 'run')
      .filter(dyno => !flags.type || dyno.type === flags.type)

      const onLatest = relevantDynos.filter((dyno: Dyno) => {
        return dyno.state === 'up' &&
          latestRelease.version !== undefined &&
          dyno.release !== undefined &&
          dyno.release.version !== undefined &&
          dyno.release.version >= latestRelease.version
      })
      const releasedFraction = `${onLatest.length} / ${relevantDynos.length}`
      if (onLatest.length === relevantDynos.length) {
        if (!released) {
          cli.action.stop(`${releasedFraction}, done`)
        }
        break
      }

      if (released) {
        released = false
        cli.action.start(`Waiting for every dyno to be running v${latestRelease.version}`)
      }

      cli.action.status = releasedFraction

      // eslint-disable-next-line no-await-in-loop
      await cli.wait(interval * 1000)
    }
  }
}
