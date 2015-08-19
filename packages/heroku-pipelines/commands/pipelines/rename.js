'use strict';

let cli = require('heroku-cli-util');
let disambiguate = require('../../lib/disambiguate');

module.exports = {
  topic: 'pipelines',
  command: 'rename',
  description: 'rename a pipeline',
  help: 'Rename a pipeline.',
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'current name of pipeline', optional: false},
    {name: 'name', description: 'new name of pipeline', optional: false}
  ],
  run: cli.command(function* (context, heroku) {
    let pipeline = yield disambiguate(heroku, context.args.pipeline);
    let promise = heroku.request({
      method: 'PATCH',
      path: `/pipelines/${pipeline.id}`,
      body: {name: context.args.name},
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.pipelines(pipeline).update(body);
    pipeline = yield cli.action(`Renaming ${pipeline.name} pipeline to ${context.args.name}`, promise);
  })
};
