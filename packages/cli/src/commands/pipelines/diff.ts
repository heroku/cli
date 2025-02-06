import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import HTTP from '@heroku/http-call'

import {getCoupling, getPipeline, getReleases, listPipelineApps, SDK_HEADER} from '../../lib/api'
import KolkrabbiAPI from '../../lib/pipelines/kolkrabbi-api'
import type {OciImage, Slug, PipelineCoupling} from '../../lib/types/fir'
import type {Commit, GitHubDiff} from '../../lib/types/github'
import {GenerationKind, getGeneration} from '../../lib/apps/generation'

interface AppInfo {
  name: string;
  repo?: string;
  hash?: string;
}

const PROMOTION_ORDER = ['development', 'staging', 'production']

async function diff(targetApp: AppInfo, downstreamApp: AppInfo, githubToken: string, herokuUserAgent: string) {
  if (!downstreamApp.repo) {
    return ux.log(`\n${color.app(targetApp.name)} was not compared to ${color.app(downstreamApp.name)} as ${color.app(downstreamApp.name)} is not connected to GitHub`)
  }

  if (downstreamApp.repo !== targetApp.repo) {
    return ux.log(`\n${color.app(targetApp.name)} was not compared to ${color.app(downstreamApp.name)} as ${color.app(downstreamApp.name)} is not connected to the same GitHub repo as ${color.app(targetApp.name)}`)
  }

  if (!downstreamApp.hash) {
    return ux.log(`\n${color.app(targetApp.name)} was not compared to ${color.app(downstreamApp.name)} as ${color.app(downstreamApp.name)} does not have any releases`)
  }

  if (downstreamApp.hash === targetApp.hash) {
    return ux.log(`\n${color.app(targetApp.name)} is up to date with ${color.app(downstreamApp.name)}`)
  }

  // Do the actual GitHub diff
  try {
    const path = `${targetApp.repo}/compare/${downstreamApp.hash}...${targetApp.hash}`
    const headers = {
      authorization: 'token ' + githubToken,
      'Content-Type': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    if (herokuUserAgent) {
      Reflect.set(headers, 'user-agent', herokuUserAgent)
    }

    const {body: githubDiff} = await HTTP.get<GitHubDiff>(`https://api.github.com/repos/${path}`, {headers})

    ux.log('')
    ux.styledHeader(`${color.app(targetApp.name)} is ahead of ${color.app(downstreamApp.name)} by ${githubDiff.ahead_by} commit${githubDiff.ahead_by === 1 ? '' : 's'}`)
    const mapped = githubDiff.commits.map((commit: Commit) => {
      return {
        sha: commit.sha.slice(0, 7),
        date: commit.commit.author.date,
        author: commit.commit.author.name,
        message: commit.commit.message.split('\n')[0],
      }
    }).reverse()
    ux.table(mapped, {
      sha: {
        header: 'SHA',
      },
      date: {},
      author: {},
      message: {},
    })
    ux.log(`\nhttps://github.com/${path}`)
  } catch {
    ux.log(`\n${color.app(targetApp.name)} was not compared to ${color.app(downstreamApp.name)} because we were unable to perform a diff`)
    ux.log('are you sure you have pushed your latest commits to GitHub?')
  }
}

export default class PipelinesDiff extends Command {
  static description = 'compares the latest release of this app to its downstream app(s)'

  static examples = [
    '$ heroku pipelines:diff -a my-app-staging',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  kolkrabbi: KolkrabbiAPI = new KolkrabbiAPI(this.config.userAgent, () => this.heroku.auth)

  getAppInfo = async (appName: string, appId: string, generation: GenerationKind): Promise<AppInfo> => {
    // Find GitHub connection for the app
    const githubApp = await this.kolkrabbi.getAppLink(appId)
      .catch(() => {
        return {name: appName, repo: null, hash: null}
      })

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
      return {name: appName, repo: githubApp.repo, hash: undefined}
    }

    return {name: appName, repo: githubApp.repo, hash: commit}
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
    downstreamApps.forEach(app => {
      if (app.name && app.id) {
        appInfoPromises.push(this.getAppInfo(app.name, app.id, generation))
      }
    })
    ux.action.start('Fetching release info for all apps')
    const appInfo = await Promise.all(appInfoPromises)
    ux.action.stop()

    // Verify the target app
    const targetAppInfo = appInfo[0]
    if (!targetAppInfo.repo) {
      const command = `heroku pipelines:open ${coupling.pipeline!.name}`
      return ux.error(`${targetAppName} does not seem to be connected to GitHub!\nRun ${color.cyan(command)} and "Connect to GitHub".`)
    }

    if (!targetAppInfo.hash) {
      return ux.error(`No release was found for ${targetAppName}, unable to diff`)
    }

    // Fetch GitHub token for the user
    const githubAccount = await this.kolkrabbi.getAccount()
    // Diff [{target, downstream[0]}, {target, downstream[1]}, .., {target, downstream[n]}]
    const downstreamAppsInfo = appInfo.slice(1)
    for (const downstreamAppInfo of downstreamAppsInfo) {
      await diff(
        targetAppInfo, downstreamAppInfo, githubAccount.github.token, this.config.userAgent,
      )
    }
  }
}
