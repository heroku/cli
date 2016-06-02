'use strict';

const co              = require('co');
const cli             = require('heroku-cli-util');
const disambiguate    = require('../../lib/disambiguate');
const stageNames      = require('../../lib/stages').names;
const listPipelineApps = require('../../lib/api').listPipelineApps;

module.exports = {
  topic: 'pipelines',
  command: 'info',
  description: 'show list of apps in a pipeline',
  help: 'Example:\n  $ heroku pipelines:info example\n  === example\n  Staging:     example-staging\n  Production:  example\n               example-admin',
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'pipeline to show', optional: false}
  ],
  flags: [
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    const pipeline = yield disambiguate(heroku, context.args.pipeline);

    const apps = yield listPipelineApps(heroku, pipeline.id);

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

    if (context.flags.json) {
      cli.styledJSON({pipeline, apps});
    } else {
      cli.styledHeader(pipeline.name);
      cli.styledHash(stages, stageNames);
    }
  }))
};
