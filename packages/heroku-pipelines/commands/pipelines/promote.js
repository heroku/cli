'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'pipelines',
  command: 'promote',
  description: "promote an app's slug down the pipeline",
  help: "promote an app's slug down the pipeline",
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'stage', char: 's', description: 'stage of first app in pipeline', hasValue: true}
  ],
  run: cli.command(function* (context, heroku) {
    var stage;

    stage = context.flags.stage;
    let promise = heroku.request({
      method: 'GET',
      path: `/apps/${context.app}/pipeline-couplings`,
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    });
    let coupling = yield cli.action(`Fetching app info`, promise);

    promise = heroku.request({
      method: 'GET',
      path: `/pipelines/${coupling.pipeline.id}/apps`,
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.pipelines(pipeline_id).apps;
    let apps = yield cli.action(`Fetching apps from ${coupling.pipeline.id}`, promise);

    //let order = ["review", "development", "test", "qa", "staging", "production"];

    let next_apps = [];
    for (var app in apps) {
      if (apps.hasOwnProperty(app)) {
        if (apps[app].coupling.stage == stage) next_apps.push(app);
      }
    }
    cli.debug(next_apps);
    for (var app in next_apps) {
      if (keys.hasOwnProperty(app)) {
        cli.log(`Promoting ${context.app} to ${app.name} (${stage})... done, v2`);
      }
    }
  })
};
