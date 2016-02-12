'use strict';

let cli          = require('heroku-cli-util');
let disambiguate = require('../../lib/disambiguate');
let stageNames   = require('../../lib/stages').names;

module.exports = {
  topic: 'pipelines',
  command: 'info',
  description: 'show list of apps in a pipeline',
  help: 'Example:\n  $ heroku pipelines:info example\n  === example\n  Staging:     example-staging\n  Production:  example\n               example-admin',
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'pipeline to show', optional: false}
  ],
  run: cli.command(function* (context, heroku) {
    let pipeline = yield disambiguate(heroku, context.args.pipeline);
    let apps = yield heroku.request({
      method: 'GET',
      path: `/pipelines/${pipeline.id}/apps`,
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.pipelines(pipeline_id).apps();
    cli.styledHeader(pipeline.name);
    // Sort Apps by stage, name
    // Display in table
    let stages={};
    for (let app in apps) {
      if (apps.hasOwnProperty(app)) {
        let stage = apps[app].coupling.stage;
        if(stages[stage]) {
          stages[apps[app].coupling.stage].push(apps[app].name);
        } else {
          stages[apps[app].coupling.stage] = [apps[app].name];
        }
      }
    }
    // Pass in sort order for stages
    cli.styledHash(stages, stageNames);
  })
};
