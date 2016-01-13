'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function map (stack) {
  if (stack === 'cedar') {
    return 'cedar-10';
  }
  return stack;
}

function* run (context, heroku) {
  let app = yield heroku.apps(context.app).info();
  cli.styledHeader(`${app.name} Available Stacks`);
  let stacks = yield heroku.stacks().list();
  for (let stack of stacks) {
    if (stack.name === app.stack.name) {
      process.stdout.write('*');
    } else {
      process.stdout.write(' ');
    }
    process.stdout.write(` ${map(stack.name)}`);
    console.log();
  }
}

module.exports = {
  topic: 'stack',
  description: 'show the list of available stacks',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
};
