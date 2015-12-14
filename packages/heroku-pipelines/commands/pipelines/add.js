'use strict';

let cli = require('heroku-cli-util');
let infer = require('../../lib/infer');
let disambiguate = require('../../lib/disambiguate');
let prompt = require('../../lib/prompt');
let stageNames = require('../../lib/stages').names;

module.exports = {
  topic: 'pipelines',
  command: 'add',
  description: 'add this app to a pipeline',
  help: 'Add this app to a pipeline. The app and pipeline names must be specified. The stage of the app will be guessed based on its name if not specified.\n\n Example:\n  $ heroku pipelines:add example -a example-admin -s production\n  Adding example-admin to example pipeline as production... done',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'name of pipeline', optional: false}
  ],
  flags: [
    {name: 'stage', char: 's', description: 'stage of first app in pipeline', hasValue: true}
  ],
  run: cli.command(function* (context, heroku) {
    var stage;
    let guesses = infer(context.app);
    let questions = [];

    let pipeline = yield disambiguate(heroku, context.args.pipeline);

    if (context.flags.stage) {
      stage = context.flags.stage;
    } else {
      questions.push({
        type: "list",
        name: "stage",
        message: `Stage of ${context.app}`,
        choices: stageNames,
        default: guesses[1]
      });
    }
    let answers = yield prompt(questions);
    if (answers.stage) stage = answers.stage;
    let promise = heroku.request({
      method: 'POST',
      path: `/apps/${context.app}/pipeline-couplings`,
      body: {pipeline: {id: pipeline.id}, stage: stage},
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.apps(app_id).pipline_couplings().create(body);
    yield cli.action(`Adding ${context.app} to ${pipeline.name} pipeline as ${stage}`, promise);
  })
};
