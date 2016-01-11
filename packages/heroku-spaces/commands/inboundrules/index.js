'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function displayJSON (rules) {
  cli.log(JSON.stringify(rules, null, 2));
}

function* run(context, heroku) {
  let lib = require('../../lib/inboundrules')(heroku);
  let space = context.flags.space || context.args.space;
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:inboundrules my-space');
  let rules = yield lib.getRules(space);
  if (context.flags.json) displayJSON(rules);
  else lib.displayRules(rules);
}

module.exports = {
  topic: 'spaces',
  command: 'inboundrules',
  description: 'list inbound connection rules',
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get inbound rules from'},
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(co.wrap(run))
};
