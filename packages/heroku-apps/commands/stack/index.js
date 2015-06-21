'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function* run (context, heroku) {
  let app = yield heroku.apps(context.app).info();
  cli.header(`${app.name} Available Stacks`);
  let stacks = yield heroku.stacks().list();
  for (let stack of stacks) {
    if (stack.name === app.stack.name) {
      console.log(`* ${stack.name}`);
    } else {
      console.log(`  ${stack.name}`);
    }
  }
}

module.exports = {
  topic: '_stack',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
};
