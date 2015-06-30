'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');
let inquirer = require("inquirer");
let infer = require('../../lib/infer');

module.exports = {
  topic: 'pipelines',
  command: 'add',
  description: 'add an app to a pipeline',
  help: 'Add an app to a pipeline. The stage of the app will be guessed based on it\'s name if not specified.',
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

    if (context.flags.stage) {
      stage = context.flags.stage;
    } else {
      questions.push({
        type: "list",
        name: "stage",
        message: `Stage of ${context.app}`,
        choices: ["review", "development", "test", "qa", "staging", "production"],
        default: guesses[1]
      });
    }
    inquirer.prompt( questions, function ( answers ) {
      if (answers.stage) stage = answers.stage;
      co(function* () {
        let promise = heroku.request({
          method: 'POST',
          path: `/apps/${context.app}/pipeline-couplings`,
          body: {pipeline: {id: context.args.pipeline}, stage: stage},
          headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
        }); // heroku.apps(app_id).pipline_couplings().create(body);

        let app = yield cli.action(`Adding ${context.app} to ${context.args.pipeline} pipeline as ${stage}`, promise);
        cli.hush(app);
      });
    });
  })
};
