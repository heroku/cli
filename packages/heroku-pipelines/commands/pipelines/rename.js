'use strict';

const co = require('co');
const cli = require('heroku-cli-util');
const disambiguate = require('../../lib/disambiguate');

module.exports = {
  topic: 'pipelines',
  command: 'rename',
  description: 'rename a pipeline',
  help: 'Example:\n  $ heroku pipelines:rename example www\n  Renaming example pipeline to www... done',
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'current name of pipeline', optional: false},
    {name: 'name', description: 'new name of pipeline', optional: false}
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    const pipeline = yield disambiguate(heroku, context.args.pipeline);

    const promise = heroku.request({
      method: 'PATCH',
      path: `/pipelines/${pipeline.id}`,
      body: {name: context.args.name},
      headers: { 'Accept': 'application/vnd.heroku+json; version=3' }
    }); // heroku.pipelines(pipeline).update(body);

    yield cli.action(`Renaming ${pipeline.name} pipeline to ${context.args.name}`, promise);
  }))
};
