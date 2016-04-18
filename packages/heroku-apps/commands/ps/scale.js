'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function* run (context, heroku) {
  let _   = require('lodash');
  let app = context.app;

  function parse (args) {
    return _.compact(args.map(arg => {
      let change = arg.match(/^([a-zA-Z0-9_]+)([=+-]\d+)(?::([\w-]+))?$/);
      if (!change) return;
      let quantity = change[2][0] === '=' ? change[2].substr(1) : change[2];
      return {type: change[1], quantity, size: change[3]};
    }));
  }

  let changes = parse(context.args);
  if (changes.length === 0) {
    let formation = yield heroku.get(`/apps/${app}/formation`);
    if (formation.length === 0) throw new Error(`No process types on ${cli.color.app(app)}.\nUpload a Procfile to add process types.\nhttps://devcenter.heroku.com/articles/procfile`);
    cli.log(formation.map(d => `${cli.color.green(d.type)}=${cli.color.yellow(d.quantity)}:${cli.color.cyan(d.size)}`).sort().join(' '));
  } else {
    yield cli.action('Scaling dynos', {success: false}, co(function* () {
      let formation = yield heroku.request({method: 'PATCH', path: `/apps/${app}/formation`, body: {updates: changes}});
      let output = formation.filter(f => changes.find(c => c.type === f.type))
      .map(d => `${cli.color.green(d.type)} at ${cli.color.yellow(d.quantity)}:${cli.color.cyan(d.size)}`);
      cli.console.error(`done, now running ${output.join(', ')}`);
    }));
  }
}

let cmd = {
  variableArgs: true,
  description: 'scale dyno count up or down',
  help: `appending a size (eg. web=2:2X) allows simultaneous scaling and resizing

omitting any arguments will display the app's current dyno formation, in a
format suitable for passing back into ps:scale

Examples:

  $ heroku ps:scale web=3:2X worker+1
  Scaling dynos... done, now running web at 3:2X, worker at 1:1X.

  $ heroku ps:scale
  web=3:2X worker=1:1X
`,
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
};

exports.ps   = Object.assign({}, cmd, {topic: 'ps',    command: 'scale'});
exports.root = Object.assign({}, cmd, {topic: 'scale', command: null});
