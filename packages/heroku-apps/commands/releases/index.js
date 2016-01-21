'use strict';

let cli  = require('heroku-cli-util');
let co   = require('co');
let _    = require('lodash');
let time = require('../../lib/time');

let width = () => process.stdout.columns > 80 ? process.stdout.columns : 80;
let trunc = s => _.trunc(s, {length: width()-60, omission: '…'});

function* run (context, heroku) {
  let url = `/apps/${context.app}/releases`;
  if (context.flags.extended) url = url + '?extended=true';
  let releases = yield heroku.request({
    path: url,
    partial: true,
    headers: { 'Range': `version ..; max=${context.flags.num || 15}, order=desc` },
  });
  if (context.flags.json) {
    cli.log(JSON.stringify(releases, null, 2));
  } else if (context.flags.extended) {
    cli.styledHeader(`${context.app} Releases`);
    cli.table(releases, {
      printHeader: false,
      columns: [
        {key: 'version',     format: v => cli.color.green('v'+v)},
        {key: 'description', format: trunc},
        {key: 'user',        format: u => cli.color.magenta(u.email)},
        {key: 'created_at',  format: t => time.ago(new Date(t))},
        {key: 'extended.slug_id'},
        {key: 'extended.slug_uuid'},
      ]
    });
  } else if (releases.length === 0) {
    cli.log(`${context.app} has no releases.`);
  } else {
    cli.styledHeader(`${context.app} Releases`);
    cli.table(releases, {
      printHeader: false,
      columns: [
        {key: 'version',     format: v => cli.color.green('v'+v)},
        {key: 'description', format: trunc},
        {key: 'user',        format: u => cli.color.magenta(u.email)},
        {key: 'created_at',  format: t => time.ago(new Date(t))},
      ]
    });
  }
}

module.exports = {
  topic: 'releases',
  description: 'display the releases for an app',
  help: `
Example:

 $ heroku releases
 === example Releases
 v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)
 v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)
 v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)`,
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'num', char: 'n', description: 'number of releases to show', hasValue: true},
    {name: 'json', description: 'output releases in json format'},
    {name: 'extended', char: 'x', hidden: true},
  ],
  run: cli.command(co.wrap(run))
};
