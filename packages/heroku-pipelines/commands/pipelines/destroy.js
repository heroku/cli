'use strict';

let cli = require('heroku-cli-util');
let disambiguate = require('../../lib/disambiguate');

module.exports = {
  topic: 'pipelines',
  command: 'destroy',
  description: 'destroy a pipeline',
  help: 'Destroy a pipeline.',
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'name of pipeline', optional: false}
  ],
  run: cli.command(function* (context, heroku) {
    let pipeline = yield disambiguate(heroku, context.args.pipeline);
    let promise = heroku.request({
      method: 'DELETE',
      path: `/pipelines/${pipeline.id}`,
      body: {name: context.args.name},
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.pipelines(pipeline).destroy(body);
    pipeline = yield cli.action(`Destroying ${context.args.pipeline} pipeline`, promise);
  })
};
