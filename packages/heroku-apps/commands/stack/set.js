'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function map (stack) {
  return stack === 'cedar-10' ? 'cedar' : stack;
}

function* run (context, heroku) {
  let stack = map(context.args.stack);
  yield heroku.request({
    method: "PATCH",
    path: `/apps/${context.app}`,
    body: {build_stack: stack},
  });
  console.log(`Stack set. Next release on ${context.app} will use ${stack}.`);
  console.log(`Run \`git push heroku master\` to create a new release on ${context.app}.`);
}

module.exports = {
  topic: 'stack',
  command: 'set',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'stack'}],
  run: cli.command(co.wrap(run))
};
