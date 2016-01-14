'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function* run (context, heroku) {
  let lib = require('../../lib/inboundrules')(heroku);
  let space = context.flags.space;
  let rules = yield lib.getRules(space);
  rules.rules = rules.rules || [];
  if (rules.rules.find(rs => rs.source === context.args.source)) throw new Error(`A rule already exists for ${context.args.source}.`);
  if (rules.rules.length === 0) yield cli.confirmApp(space, context.flags.confirm, `Traffic from ${cli.color.red(context.args.source)} will be allowed to make web requests to web dynos, all other inbound traffic denied.`);
  rules.rules.push({action: 'allow', source: context.args.source});
  rules = yield lib.putRules(space, rules);
  lib.displayRules(rules);
  cli.warn('It may take a few moments for the changes to take effect.');
}

module.exports = {
  topic: 'spaces',
  command: 'inboundrules:add',
  description: 'add rule to inbound whitelist',
  help: `
The default action only applies to a whitelist with no sources.
Uses CIDR notation.

Example:
  $ heroku spaces:inboundrules:add --space my-space 192.168.2.0/24
  Source          Action
  ──────────────  ──────
  192.168.0.1/24  allow
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
    {name: 'space', char: 's', hasValue: true, description: 'space to add rule to'},
    {name: 'confirm', hasValue: true, description: 'set to space name to bypass confirm prompt'},
  ],
  run: cli.command(co.wrap(run))
};
