'use strict';

let cli          = require('heroku-cli-util');
let co           = require('co');
let bluebird     = require('bluebird');
let request      = bluebird.promisify(require('request'));

const PROMOTION_ORDER = ['development', 'staging', 'production'];
const V3_HEADER = 'application/vnd.heroku+json; version=3';
const PIPELINES_HEADER = V3_HEADER + '.pipelines';
const KOLKRABBI_BASE_URL = 'https://kolkrabbi.heroku.com';

// Helper functions

function kolkrabbiRequest(url, token) {
  return request({
    method: 'GET',
    url: KOLKRABBI_BASE_URL + url,
    headers: {
      authorization: 'Bearer ' + token
    },
    json: true
  }).spread(function (res, body) {
    if (res.statusCode === 404) {
      let err = new Error('404');
      err.name = 'NOT_FOUND';
      throw err;
    } else if (res.statusCode >= 400) {
      // TODO: This could potentially catch some 4xx errors that we might want to handle with a
      // specific error message
      throw new Error('failed to fetch diff because of an internal server error.');
    }
    return body;
  });
}

function* getAppInfo(heroku, appName, appId) {
  // Find GitHub connection for the app
  let githubApp;
  try {
    githubApp = yield kolkrabbiRequest(`/apps/${appId}/github`, heroku.options.token);
  } catch (err) {
    cli.hush(err);
    return { name: appName, repo: null, hash: null };
  }

  // Find the commit hash of the latest release for this app
  let slug;
  try {
    const release = yield heroku.request({
      method: 'GET',
      path: `/apps/${appId}/releases`,
      headers: { 'Accept': V3_HEADER, 'Range': 'version ..; order=desc,max=1' },
      partial: true
    });
    if (release[0].slug === null) {
      throw new Error(`no release found for ${appName}`);
    }
    slug = yield heroku.request({
      method: 'GET',
      path: `/apps/${appId}/slugs/${release[0].slug.id}`,
      headers: { 'Accept': V3_HEADER }
    });
  } catch (err) {
    cli.hush(err);
    return { name: appName, repo: githubApp.repo, hash: null };
  }
  return { name: appName, repo: githubApp.repo, hash: slug.commit };
}

function* diff(targetApp, downstreamApp, githubToken, herokuUserAgent) {
  if (downstreamApp.repo === null) {
    return cli.log(`\n${targetApp.name} was not compared to ${downstreamApp.name} as ${downstreamApp.name} is not connected to GitHub`);
  } else if (downstreamApp.repo !== targetApp.repo) {
    return cli.log(`\n${targetApp.name} was not compared to ${downstreamApp.name} as ${downstreamApp.name} is not connected to the same GitHub repo as ${targetApp.name}`);
  } else if (downstreamApp.hash === null) {
    return cli.log(`\n${targetApp.name} was not compared to ${downstreamApp.name} as ${downstreamApp.name} does not have any releases`);
  } else if (downstreamApp.hash === targetApp.hash) {
    return cli.log(`\n${targetApp.name} is up to date with ${downstreamApp.name}`);
  }

  // Do the actual Github diff
  const githubDiff = yield request({
    url: `https://api.github.com/repos/${targetApp.repo}/compare/${downstreamApp.hash}...${targetApp.hash}`,
    headers: {
      authorization: 'token ' + githubToken,
      'user-agent': herokuUserAgent
    },
    json: true
  });
  const res = githubDiff[0];
  const body = githubDiff[1];
  if (res.statusCode !== 200) {
    cli.hush({ statusCode: res.statusCode, body: body });
    cli.log(`\n${targetApp.name} was not compared to ${downstreamApp.name} because we were unable to perform a diff`);
    cli.log(`are you sure you have pushed your latest commits to GitHub?`);
    return;
  }

  cli.log(`\n${targetApp.name} is ahead of ${downstreamApp.name} by ${body.ahead_by} commit${body.ahead_by === 1 ? '' : 's'}:`);
  for (let i = body.commits.length - 1; i >= 0; i--) {
    let commit = body.commits[i];
    let abbreviatedHash = commit.sha.substring(0, 7);
    let authoredDate = commit.commit.author.date;
    let authorName = commit.commit.author.name;
    let message = commit.commit.message.split('\n')[0];
    cli.log(`  ${abbreviatedHash}  ${authoredDate}  ${message} (${authorName})`);
  }
}

module.exports = {
  topic: 'pipelines',
  command: 'diff',
  description: 'compares the latest release of this app its downstream app(s)',
  needsAuth: true,
  needsApp: true,
  run: cli.command(function* (context, heroku) {
    const targetAppName = context.app;
    let coupling;
    try {
      coupling = yield heroku.request({
        method: 'GET',
        path: `/apps/${targetAppName}/pipeline-couplings`,
        headers: { 'Accept': PIPELINES_HEADER }
      });
    } catch (err) {
      return cli.error(`This app (${targetAppName}) does not seem to be a part of any pipeline`);
    }
    const targetAppId = coupling.app.id;

    const allApps = yield cli.action(`Fetching apps from pipeline`,
      heroku.request({
        method: 'GET',
        path: `/pipelines/${coupling.pipeline.id}/apps`,
        headers: { 'Accept': PIPELINES_HEADER }
      }));

    const sourceStage = coupling.stage;
    const downstreamStage = PROMOTION_ORDER[PROMOTION_ORDER.indexOf(sourceStage) + 1];
    if (downstreamStage === null || PROMOTION_ORDER.indexOf(sourceStage) < 0) {
      return cli.error(`Unable to diff ${targetAppName}`);
    }
    const downstreamApps = allApps.filter(function(app) {
      return app.coupling.stage === downstreamStage;
    });

    if (downstreamApps.length < 1) {
      return cli.error(`Cannot diff ${targetAppName} as there are no downstream apps configured`);
    }

    // Fetch GitHub repo/latest release hash for [target, downstream[0], .., downstream[n]] apps
    const wrappedGetAppInfo = co.wrap(getAppInfo);
    const appInfoPromises = [wrappedGetAppInfo(heroku, targetAppName, targetAppId)];
    downstreamApps.forEach(function (app) {
      appInfoPromises.push(wrappedGetAppInfo(heroku, app.name, app.id));
    });
    const appInfo = yield cli.action(`Fetching release info for all apps`,
      bluebird.all(appInfoPromises));

    // Verify the target app
    let targetAppInfo = appInfo[0];
    if (targetAppInfo.repo === null) {
      return cli.error(`${targetAppName} does not seem to be connected to GitHub!`);
    } else if (targetAppInfo.hash === null) {
      return cli.error(`No release was found for ${targetAppName}, unable to diff`);
    }

    // Fetch GitHub token for the user
    const githubAccount = yield kolkrabbiRequest(`/account/github/token`, heroku.options.token);

    // Diff [{target, downstream[0]}, {target, downstream[1]}, .., {target, downstream[n]}]
    const downstreamAppsInfo = appInfo.slice(1);
    for (let downstreamAppInfo of downstreamAppsInfo) {
      yield diff(
        targetAppInfo, downstreamAppInfo, githubAccount.github.token, heroku.options.userAgent);
    }
  })
};
