'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const bluebird = require('bluebird')

const api = require('../../lib/api')
const listPipelineApps = api.listPipelineApps
const V3_HEADER = api.V3_HEADER

const PROMOTION_ORDER = ['development', 'staging', 'production']
const KOLKRABBI_BASE_URL = 'https://kolkrabbi.heroku.com'

// Helper functions

function kolkrabbiRequest (url, token) {
  return cli.got.get(KOLKRABBI_BASE_URL + url, {
    headers: {
      authorization: 'Bearer ' + token
    },
    json: true
  })
    .then(res => res.body)
    .catch(err => {
      switch (err.statusCode) {
        case 404:
          err = new Error(`404 ${url}`)
          err.name = 'NOT_FOUND'
          throw err
        default:
          throw err
      }
    })
}

function * getAppInfo (heroku, appName, appId) {
  // Find GitHub connection for the app
  let githubApp
  try {
    githubApp = yield kolkrabbiRequest(`/apps/${appId}/github`, heroku.options.token)
  } catch (err) {
    cli.hush(err)
    return { name: appName, repo: null, hash: null }
  }

  // Find the commit hash of the latest release for this app
  let slug
  try {
    const releases = yield heroku.request({
      method: 'GET',
      path: `/apps/${appId}/releases`,
      headers: { 'Accept': V3_HEADER, 'Range': 'version ..; order=desc' },
      partial: true
    })
    const release = releases.find((r) => r.status === 'succeeded')
    if (!release || !release.slug) {
      throw new Error(`no release found for ${appName}`)
    }
    slug = yield heroku.request({
      method: 'GET',
      path: `/apps/${appId}/slugs/${release.slug.id}`,
      headers: { 'Accept': V3_HEADER }
    })
  } catch (err) {
    cli.hush(err)
    return { name: appName, repo: githubApp.repo, hash: null }
  }
  return { name: appName, repo: githubApp.repo, hash: slug.commit }
}

function * diff (targetApp, downstreamApp, githubToken, herokuUserAgent) {
  if (downstreamApp.repo === null) {
    return cli.log(`\n${cli.color.app(targetApp.name)} was not compared to ${cli.color.app(downstreamApp.name)} as ${cli.color.app(downstreamApp.name)} is not connected to GitHub`)
  } else if (downstreamApp.repo !== targetApp.repo) {
    return cli.log(`\n${cli.color.app(targetApp.name)} was not compared to ${cli.color.app(downstreamApp.name)} as ${cli.color.app(downstreamApp.name)} is not connected to the same GitHub repo as ${cli.color.app(targetApp.name)}`)
  } else if (downstreamApp.hash === null) {
    return cli.log(`\n${cli.color.app(targetApp.name)} was not compared to ${cli.color.app(downstreamApp.name)} as ${cli.color.app(downstreamApp.name)} does not have any releases`)
  } else if (downstreamApp.hash === targetApp.hash) {
    return cli.log(`\n${cli.color.app(targetApp.name)} is up to date with ${cli.color.app(downstreamApp.name)}`)
  }

  // Do the actual Github diff
  try {
    const path = `${targetApp.repo}/compare/${downstreamApp.hash}...${targetApp.hash}`
    const headers = { authorization: 'token ' + githubToken }

    if (herokuUserAgent) headers['user-agent'] = herokuUserAgent

    const res = yield cli.got.get(`https://api.github.com/repos/${path}`, {
      headers,
      json: true
    })
    cli.log('')
    cli.styledHeader(`${cli.color.app(targetApp.name)} is ahead of ${cli.color.app(downstreamApp.name)} by ${res.body.ahead_by} commit${res.body.ahead_by === 1 ? '' : 's'}`)
    let mapped = res.body.commits.map(function (commit) {
      return {
        sha: commit.sha.substring(0, 7),
        date: commit.commit.author.date,
        author: commit.commit.author.name,
        message: commit.commit.message.split('\n')[0]
      }
    }).reverse()
    cli.table(mapped, {
      columns: [
        { key: 'sha', label: 'SHA' },
        { key: 'date', label: 'Date' },
        { key: 'author', label: 'Author' },
        { key: 'message', label: 'Message' }
      ]
    })
    cli.log(`\nhttps://github.com/${path}`)
  } catch (err) {
    cli.hush(err)
    cli.log(`\n${cli.color.app(targetApp.name)} was not compared to ${cli.color.app(downstreamApp.name)} because we were unable to perform a diff`)
    cli.log(`are you sure you have pushed your latest commits to GitHub?`)
  }
}

function * run (context, heroku) {
  // jshint maxstatements:65
  const targetAppName = context.app
  let coupling
  try {
    coupling = yield heroku.request({
      method: 'GET',
      path: `/apps/${targetAppName}/pipeline-couplings`,
      headers: { 'Accept': V3_HEADER }
    })
  } catch (err) {
    return cli.error(`This app (${targetAppName}) does not seem to be a part of any pipeline`)
  }
  const targetAppId = coupling.app.id

  const allApps = yield cli.action(`Fetching apps from pipeline`,
    listPipelineApps(heroku, coupling.pipeline.id))

  const sourceStage = coupling.stage
  const downstreamStage = PROMOTION_ORDER[PROMOTION_ORDER.indexOf(sourceStage) + 1]
  if (downstreamStage === null || PROMOTION_ORDER.indexOf(sourceStage) < 0) {
    return cli.error(`Unable to diff ${targetAppName}`)
  }
  const downstreamApps = allApps.filter(function (app) {
    return app.coupling.stage === downstreamStage
  })

  if (downstreamApps.length < 1) {
    return cli.error(`Cannot diff ${targetAppName} as there are no downstream apps configured`)
  }

  // Fetch GitHub repo/latest release hash for [target, downstream[0], .., downstream[n]] apps
  const wrappedGetAppInfo = co.wrap(getAppInfo)
  const appInfoPromises = [wrappedGetAppInfo(heroku, targetAppName, targetAppId)]
  downstreamApps.forEach(function (app) {
    appInfoPromises.push(wrappedGetAppInfo(heroku, app.name, app.id))
  })
  const appInfo = yield cli.action(`Fetching release info for all apps`,
    bluebird.all(appInfoPromises))

  // Verify the target app
  let targetAppInfo = appInfo[0]
  if (targetAppInfo.repo === null) {
    let command = `heroku pipelines:open ${coupling.pipeline.name}`
    return cli.error(`${targetAppName} does not seem to be connected to GitHub!\nRun ${cli.color.cyan(command)} and "Connect to GitHub".`)
  } else if (targetAppInfo.hash === null) {
    return cli.error(`No release was found for ${targetAppName}, unable to diff`)
  }

  // Fetch GitHub token for the user
  const githubAccount = yield kolkrabbiRequest(`/account/github/token`, heroku.options.token)

  // Diff [{target, downstream[0]}, {target, downstream[1]}, .., {target, downstream[n]}]
  const downstreamAppsInfo = appInfo.slice(1)
  for (let downstreamAppInfo of downstreamAppsInfo) {
    yield diff(
      targetAppInfo, downstreamAppInfo, githubAccount.github.token, heroku.options.userAgent)
  }
}

module.exports = {
  topic: 'pipelines',
  command: 'diff',
  description: 'compares the latest release of this app to its downstream app(s)',
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run)),
  examples: '$ heroku pipelines:diff --app murmuring-headland-14719'
}
