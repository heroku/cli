'use strict';

let cli = require('heroku-cli-util');

module.exports = {
  topic: 'pipelines',
  command: 'destroy',
  description: 'destroy a pipeline',
  help: 'Destroy a pipeline.',
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'current name of pipeline', optional: false}
  ],
  run: cli.command(function* (context, heroku) {
    let promise = heroku.request({
      method: 'DELETE',
      path: `/pipelines/${context.args.pipeline}`,
      body: {name: context.args.name},
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.pipelines(pipeline).destroy(body);
    let pipeline = yield cli.action(`Destroying ${context.args.pipeline} pipeline`, promise);
    cli.hush(pipeline);
  })
};
