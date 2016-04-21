'use strict';

let cli         = require('heroku-cli-util');
let co          = require('co');
let _           = require('lodash');
let shellescape = require('shell-escape');

function* run (context, heroku) {
  // TODO: find out how to get config vars and addons data in apiv3 or deprecate this command
  let id = (context.args.release || 'current').toLowerCase();
  id = id.startsWith('v') ? id.slice(1) : id;
  let release;
  if (id === 'current') {
    let releases = yield heroku.request({
      path: `/apps/${context.app}/releases`,
      partial: true,
      headers: {Range: `version ..; max=2, order=desc`},
    });
    id = releases[0].version;
  }
  release = yield heroku.request({
    path:    `/apps/${context.app}/releases/${id}`,
    headers: {Accept: 'application/json'},
  });
  if (context.flags.json) {
    cli.styledJSON(release);
  } else {
    cli.styledHeader(`Release ${cli.color.cyan(release.name)}`);
    cli.styledObject({
      'Add-ons': release.addons,
      Change: release.descr,
      By:     release.user,
      When:   release.created_at,
    });
    cli.log();
    if (release.env) {
      cli.styledHeader(`${cli.color.cyan(release.name)} Config vars`);
      if (context.flags.shell) {
        _.forEach(release.env, (v, k) => cli.log(`${k}=${shellescape([v])}`));
      } else {
        cli.styledObject(release.env);
      }
    }
  }
}

module.exports = {
  topic: 'releases',
  command: 'info',
  description: 'view detailed information for a release',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'release', optional: true}],
  flags: [
    {name: 'json', description: 'output in json format'},
    {name: 'shell', char: 's', description: 'output in shell format'},
  ],
  run: cli.command(co.wrap(run))
};
