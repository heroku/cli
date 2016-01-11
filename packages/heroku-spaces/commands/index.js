'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');
let _   = require('lodash');

function display (spaces) {
  cli.table(spaces, {
    columns: [
      {key: 'name', label: 'Name'},
      {key: 'organization.name', label: 'Organization'},
      {key: 'region.name', label: 'Region'},
      {key: 'state', label: 'State'},
      {key: 'created_at', label: 'Created At'},
    ]
  });
}

function displayJSON (spaces) {
  cli.log(JSON.stringify(spaces, null, 2));
}

function* run(context, heroku) {
  let spaces = yield heroku.get('/spaces');
  if (context.flags.org) {
    spaces = spaces.filter(s => s.organization.name === context.flags.org);
  }
  spaces = _.sortByAll(spaces, 'name');
  if (context.flags.json) displayJSON(spaces);
  else if (spaces.length === 0) {
    if (context.flags.org) throw new Error(`No spaces in ${cli.color.cyan(context.flags.org)}.`);
    else throw new Error('You do not have access to any spaces.');
  }
  else display(spaces);
}

module.exports = {
  topic: 'spaces',
  description: 'list available spaces',
  needsApp: false,
  needsAuth: true,
  flags: [
    {name: 'org', char: 'o', hasValue: true, description: 'filter by org'},
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(co.wrap(run))
};
