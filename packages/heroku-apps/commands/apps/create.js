'use strict';

let co     = require('co');
let cli    = require('heroku-cli-util');
let extend = require('util')._extend;

function* run (context, heroku) {
  let git = require('../../lib/git')(context);
  let name = context.flags.app || context.args.app || process.env.HEROKU_APP;

  function createApp () {
    let params = {
      name,
      organization:  context.org,
      region:        context.flags.region,
      space:         context.flags.space,
      stack:         context.flags.stack,
      kernel:        context.flags.kernel,
      locked:        context.flags.locked,
    };

    return heroku.request({
      method: 'POST',
      path:   (params.space || context.org) ? '/organizations/apps' : '/apps',
      body:   params,
    });
  }

  let addAddons = co.wrap(function* (app, addons) {
    for (let addon of addons) {
      addon = addon.trim();
      let request = heroku.apps(app.name).addons().create({plan: addon});
      yield cli.action(`Adding ${cli.color.green(addon)}`, request);
    }
  });

  function addBuildpack (app, buildpack) {
    return cli.action(`Setting buildpack to ${cli.color.cyan(buildpack)}`, heroku.request({
      method:  'PUT',
      path:    `/apps/${app.name}/buildpack-installations`,
      headers: {Range: ''},
      body:    {updates: [{buildpack: buildpack}]},
    }));
  }

  let app = yield cli.action(`Creating ${name ? cli.color.magenta(name) : 'app'}`, {success: false}, createApp());

  if (context.flags.region) cli.console.error(`done, region is ${cli.color.yellow(app.region.name)}`);
  else                      cli.console.error(`done, stack is ${app.stack.name}`);

  if (context.flags.addons)    yield addAddons(app, context.flags.addons.split(','));
  if (context.flags.buildpack) yield addBuildpack(app, context.flags.buildpack);

  let remoteUrl = context.flags['ssh-git'] ? git.sshGitUrl(app.name) : git.gitUrl(app.name);
  if (git.inGitRepo() && !context.flags['no-remote']) yield git.createRemote(context.flags.remote || 'heroku', remoteUrl);
  cli.log(`${cli.color.cyan(app.web_url)} | ${cli.color.green(remoteUrl)}`);
}

let cmd = {
  topic: 'apps',
  command: 'create',
  description: 'create a new app',
  help: `Examples:

 $ heroku apps:create
 Creating app... done, stack is cedar-14
 https://floating-dragon-42.heroku.com/ | https://git.heroku.com/floating-dragon-42.git

 # or just
 $ heroku create

 # specify a buildpack
 $ heroku apps:create --buildpack https://github.com/some/buildpack.git

 # specify a name
 $ heroku apps:create example

 # create a staging app
 $ heroku apps:create example-staging --remote staging

 # create an app in the eu region
 $ heroku apps:create --region eu
 `,
  needsAuth: true,
  wantsOrg:  true,
  args: [{name: 'app', optional: true}],
  flags: [
    {name: 'app', char: 'a', hasValue: true, hidden: true},
    {name: 'addons', hasValue: true, description: 'comma-delimited list of addons to install'},
    {name: 'buildpack', char: 'b', hasValue: true, description: 'buildpack url to use for this app'},
    {name: 'no-remote', char: 'n', description: 'do not create a git remote'},
    {name: 'remote', char: 'r', hasValue: true, description: 'the git remtoe to create, default "heroku"'},
    {name: 'stack', char: 's', hasValue: true, description: 'the stack to create the app on'},
    {name: 'space', hasValue: true, description: 'the private space to create the app in'},
    {name: 'region', hasValue: true, description: 'specify region for the app to run in'},
    {name: 'ssh-git', description: 'use SSH git protocol for local git remote'},
    {name: 'kernel', hidden: true, hasValue: true},
    {name: 'locked', hidden: true},
  ],
  run: cli.command(co.wrap(run))
};

module.exports.apps = cmd;
module.exports.root = extend({}, cmd);
module.exports.root.topic = 'create';
delete module.exports.root.command;
