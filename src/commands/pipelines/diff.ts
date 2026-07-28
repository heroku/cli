import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import type {OciImage, PipelineCoupling, Slug} from '../../lib/types/fir.js'
import type {Commit, GitHubDiff} from '../../lib/types/github.js'

import {
  getCoupling,
  getPipeline,
  getReleases,
  listPipelineApps,
  SDK_HEADER,
} from '../../lib/api.js'
import {GenerationKind, getGeneration} from '../../lib/apps/generation.js'

const REPOSITORIES_API_HEADER = 'application/vnd.heroku+json; version=3.repositories-api'

interface AppInfo {
  hash?: string;
  name: string;
  repo?: string;
}

const PROMOTION_ORDER = ['development', 'staging', 'production']

export default class PipelinesDiff extends Command {
  static description = 'compares the latest release of this app to its downstream app(s)'
  static examples = [
    color.command('heroku pipelines:diff -a my-app-staging'),
  ]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  getAppInfo = async (appName: string, appId: string, generation: GenerationKind): Promise<AppInfo> => {
    // Find GitHub connection for the app
    const githubApp = await this.heroku.get<{full_name: string}>(`/apps/${appId}/repo`, {
      headers: {Accept: REPOSITORIES_API_HEADER},
    }).then(res => res.body)
      .catch(() => ({full_name: undefined}))

    // Find the commit hash of the latest release for this app
    let slug: Slug
    let ociImages: Array<OciImage>
    let commit: string | undefined

    try {
      const {body: releases} = await getReleases(this.heroku, appId)
      const release = releases.find(r => r.status === 'succeeded')
      if (!release || !(release.slug || release.oci_image)) {
        throw new Error(`no release found for ${appName}`)
      }

      if (generation === 'cedar' && release.slug) {
        slug = await this.heroku.get<Slug>(`/apps/${appId}/slugs/${release.slug.id}`, {
          headers: {Accept: SDK_HEADER},
        }).then(res => res.body)
        commit = slug.commit!
      } else if (generation === 'fir' && release.oci_image) {
        ociImages = await this.heroku.get<Array<OciImage>>(`/apps/${appId}/oci-images/${release.oci_image.id}`, {
          headers: {Accept: SDK_HEADER},
        }).then(res => res.body)
        commit = ociImages[0]?.commit
      }
    } catch {
      return {hash: undefined, name: appName, repo: githubApp.full_name}
    }

    return {hash: commit, name: appName, repo: githubApp.full_name}
  }
  private diff = async (targetApp: AppInfo, downstreamApp: AppInfo, pipelineId: string) => {
    if (!downstreamApp.repo) {
      return ux.stdout(`\n${color.app(targetApp.name)} was not compared to ${color.app(downstreamApp.name)} as ${color.app(downstreamApp.name)} is not connected to GitHub`)
    }

    if (downstreamApp.repo !== targetApp.repo) {
      return ux.stdout(`\n${color.app(targetApp.name)} was not compared to ${color.app(downstreamApp.name)} as ${color.app(downstreamApp.name)} is not connected to the same GitHub repo as ${color.app(targetApp.name)}`)
    }

    if (!downstreamApp.hash) {
      return ux.stdout(`\n${color.app(targetApp.name)} was not compared to ${color.app(downstreamApp.name)} as ${color.app(downstreamApp.name)} does not have any releases`)
    }

    if (downstreamApp.hash === targetApp.hash) {
      return ux.stdout(`\n${color.app(targetApp.name)} is up to date with ${color.app(downstreamApp.name)}`)
    }

    // Do the actual GitHub diff via the repositories-api server-side proxy
    try {
      const {body: githubDiff} = await this.heroku.get<GitHubDiff>(`/pipelines/${pipelineId}/repo/compare?base=${downstreamApp.hash}&head=${targetApp.hash}`, {
        headers: {Accept: REPOSITORIES_API_HEADER},
      })

      ux.stdout('')
      hux.styledHeader(`${color.app(targetApp.name)} is ahead of ${color.app(downstreamApp.name)} by ${githubDiff.ahead_by} commit${githubDiff.ahead_by === 1 ? '' : 's'}`)
      /* eslint-disable perfectionist/sort-objects */
      const mapped = githubDiff.commits.map((commit: Commit) => ({
        sha: commit.sha.slice(0, 7),
        date: commit.commit.author.date,
        author: commit.commit.author.name,
        message: commit.commit.message.split('\n')[0],
      })).reverse()
      hux.table(mapped, {
        sha: {
          header: 'SHA',
        },
        date: {},
        author: {},
        message: {},
      })
      /* eslint-enable perfectionist/sort-objects */
      ux.stdout(`\n${color.info(`https://github.com/${targetApp.repo}/compare/${downstreamApp.hash}...${targetApp.hash}`)}`)
    } catch {
      ux.stdout(`\n${color.app(targetApp.name)} was not compared to ${color.app(downstreamApp.name)} because we were unable to perform a diff`)
      ux.stdout('are you sure you have pushed your latest commits to GitHub?')
    }
  }

  async run() {
    const {flags} = await this.parse(PipelinesDiff)
    const targetAppName = flags.app

    let coupling: PipelineCoupling | undefined
    try {
      ({body: coupling} = await getCoupling(this.heroku, targetAppName))
    } catch {
      ux.error(`This app (${targetAppName}) does not seem to be a part of any pipeline`)
      return
    }

    const {body: pipeline} = await getPipeline(this.heroku, coupling.pipeline!.id!)

    const targetAppId = coupling!.app!.id!
    const generation = getGeneration(pipeline)!
    const pipelineId = coupling!.pipeline!.id!

    ux.action.start('Fetching apps from pipeline')
    const allApps = await listPipelineApps(this.heroku, coupling!.pipeline!.id!)
    ux.action.stop()

    const sourceStage = coupling.stage

    if (!sourceStage) {
      return ux.error(`Unable to diff ${targetAppName}`)
    }

    const downstreamStage = PROMOTION_ORDER[PROMOTION_ORDER.indexOf(sourceStage) + 1]
    if (!downstreamStage || !PROMOTION_ORDER.includes(sourceStage)) {
      return ux.error(`Unable to diff ${targetAppName}`)
    }

    const downstreamApps = allApps.filter(app => app.pipelineCoupling.stage === downstreamStage)

    if (downstreamApps.length === 0) {
      return ux.error(`Cannot diff ${targetAppName} as there are no downstream apps configured`)
    }

    // Fetch GitHub repo/latest release hash for [target, downstream[0], .., downstream[n]] apps
    const appInfoPromises = [this.getAppInfo(targetAppName, targetAppId, generation)]
    for (const app of downstreamApps) {
      if (app.name && app.id) {
        appInfoPromises.push(this.getAppInfo(app.name, app.id, generation))
      }
    }

    ux.action.start('Fetching release info for all apps')
    const appInfo = await Promise.all(appInfoPromises)
    ux.action.stop()

    // Verify the target app
    const targetAppInfo = appInfo[0]
    if (!targetAppInfo.repo) {
      const command = `heroku pipelines:open ${coupling.pipeline!.name}`
      return ux.error(`${targetAppName} does not seem to be connected to GitHub!\nRun ${color.code(command)} and "Connect to GitHub".`)
    }

    if (!targetAppInfo.hash) {
      return ux.error(`No release was found for ${targetAppName}, unable to diff`)
    }

    // Diff [{target, downstream[0]}, {target, downstream[1]}, .., {target, downstream[n]}]
    const downstreamAppsInfo = appInfo.slice(1)
    for (const downstreamAppInfo of downstreamAppsInfo) {
      await this.diff(targetAppInfo, downstreamAppInfo, pipelineId)
    }
  }
}
