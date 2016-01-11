'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function* run (context, heroku) {
  let lib = require('../../lib/inboundrules')(heroku);
  let space = context.flags.space;
  let rules = yield lib.getRules(space);
  rules.rules = rules.rules || [];
  if (rules.rules.length === 0) throw new Error('No rules exist. Nothing to do.');
  let originalLength = rules.rules.length;
  rules.rules = rules.rules.filter(r => r.source !== context.args.source);
  if (rules.rules.length === originalLength) throw new Error(`No rule matching ${context.args.source} was found.`);
  if (rules.rules.length === 0) {
    yield cli.confirmApp(
      space,
      context.flags.confirm,
      `You are removing the last whitelisted source and the default action is ${cli.color.red(rules.default_action)}.
Traffic from any source will ${rules.default_action === 'allow' ? 'be' : 'not'} able to access the apps in this space.`);
  }
  rules = yield lib.putRules(space, rules);
  lib.displayRules(rules);
  cli.warn('It may take a few moments for the changes to take effect.');
}

module.exports = {
  topic: 'spaces',
  command: 'inboundrules:remove',
  description: 'remove rule from inbound whitelist',
  help: `
Uses CIDR notation.

Example:
  $ heroku spaces:inboundrules:remove --space my-space 192.168.2.0/24
  Source          Action
  ──────────────  ──────
  Created at:     2016-01-06T05:20:46Z
  Created by:     jeff@heroku.com
  Default action: allow
  `,
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'source'},
  ],
  flags: [
    {name: 'space', hasValue: true, optional: false, description: 'space to remove rule from'},
    {name: 'confirm', hasValue: true, description: 'set to space name to bypass confirm prompt'},
  ],
  run: cli.command(co.wrap(run))
};
