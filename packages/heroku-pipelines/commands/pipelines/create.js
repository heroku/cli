'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');
let infer = require('../../lib/infer');
let prompt = require('../../lib/prompt');
let stages = require('../../lib/stages').inferrableStageNames;

const createCoupling = require('../../lib/api').createCoupling;

function* run(context, heroku) {
  var name, stage;
  let guesses = infer(context.app);
  let questions = [];

  const app = context.app;

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
      message: `Stage of ${app}`,
      choices: stages,
      default: guesses[1]
    });
  }
  let answers = yield prompt(questions);
  if (answers.name) name = answers.name;
  if (answers.stage) stage = answers.stage;
  let promise = heroku.request({
    method: 'POST',
    path: '/pipelines',
    body: {name: name},
    headers: { 'Accept': 'application/vnd.heroku+json; version=3' }
  }); // heroku.pipelines().create({name: name});
  let pipeline = yield cli.action(`Creating ${name} pipeline`, promise);

  yield cli.action(`Adding ${app} to ${pipeline.name} pipeline as ${stage}`,
                  createCoupling(heroku, pipeline, app, stage));
}

module.exports = {
  topic: 'pipelines',
  command: 'create',
  description: 'create a new pipeline',
  help: 'An existing app must be specified as the first app in the pipeline.\nThe pipeline name will be inferred from the app name if not specified.\nThe stage of the app will be guessed based on its name if not specified.\n\nExample:\n  $ heroku pipelines:create -a example-staging\n  ? Pipeline name: example\n  ? Stage of example-staging: staging\n  Creating example pipeline... done\n  Adding example-staging to example pipeline as staging... done',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'name', description: 'name of pipeline, defaults to basename of app', optional: true}
  ],
  flags: [
    {name: 'stage', char: 's', description: 'stage of first app in pipeline', hasValue: true}
  ],
  run: cli.command(co.wrap(run))
};
