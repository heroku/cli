'use strict';

let cli = require('heroku-cli-util');
//let co  = require('co');

module.exports = {
  topic: 'pipelines',
  command: 'info',
  description: 'show detailed pipeline info',
  help: 'show detailed pipeline info',
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'pipeline to show', optional: false}
  ],
  run: cli.command(function* (context, heroku) {
    let pipeline_id = context.args.pipeline;
    let path = `/pipelines/${pipeline_id}`;
    let pipeline = yield heroku.request({
      method: 'GET',
      path: path,
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.pipelines(pipeline_id);
    cli.hush(pipeline);
    let apps = yield heroku.request({
      method: 'GET',
      path: `/pipelines/${pipeline_id}/apps`,
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.pipelines(pipeline_id).apps;
    cli.hush(apps);
    cli.log(`=== ${pipeline.name} Apps`)
    for (var app in apps) {
      cli.log(`${apps[app].name} (${apps[app].coupling.stage})`);
    }
    // Sort Apps by stage, name
    // Display in table
    if(0) {
    let stages={};
    for (var app in apps) {
      let stage = apps[app].coupling.stage;
      if(stages[stage]) {
        stages[apps[app].coupling.stage].push(apps[app].name);
      } else {
        stages[apps[app].coupling.stage] = [apps[app].name];
      }
    }
    for (var stage in stages) {
      cli.log(`${stage}: ${stages[stage]}`)
    }
    }


//    let pipeline = context.args.pipeline || "example";
//    cli.log(`=== ${pipeline}`);
//    cli.log("Source type: github");
//    cli.log("Source repo: heroku/example");
//    cli.log("Staging:     example-staging");
//    cli.log("Production:  example");
//    cli.log("             example-admin");
//    cli.log("Flow:        example-staging —> example, example-admin");
  })
};
