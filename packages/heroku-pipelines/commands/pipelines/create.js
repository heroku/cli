'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');
let inquirer = require("inquirer");
let infer = require('../../lib/infer');

module.exports = {
  topic: 'pipelines',
  command: 'create',
  description: 'create a new pipeline',
  help: 'Create a new pipeline. Pipeline name will be inferred from the app name if not specified. The stage of the app will be guessed based on it\'s name if not specified.\n\nExample:\n  $ heroku pipelines:create -a example-staging\n  Creating example pipeline... done\n  Adding example-staging to example pipeline as staging... done',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'name', description: 'name of pipeline, defaults to basename of app', optional: true}
  ],
  flags: [
    {name: 'stage', char: 's', description: 'stage of first app in pipeline', hasValue: true}
  ],
  run: cli.command(function* (context, heroku) {
    var name, stage;
    let guesses = infer(context.app);
    let questions = [];

    if (context.args.name) {
      name = context.args.name;
    } else {
      questions.push({
        type: "input",
        name: "name",
        message: "Pipeline name",
        default: guesses[0]
      });
    }
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
      if (answers.name) name = answers.name;
      if (answers.stage) stage = answers.stage;
      co(function* () {
        let promise = Promise.resolve(); // heroku.pipelines().create({name: name});
        let pipeline = yield cli.action(`Creating ${name} pipeline`, promise);
        //cli.debug(pipeline);
        promise = Promise.resolve(); // heroku.app(context.app).update({pipeline: pipeline});
        let app = yield cli.action(`Adding ${context.app} to ${name} pipeline as ${stage}`, promise);
        //cli.debug(app);
      });
    });
  })
};
