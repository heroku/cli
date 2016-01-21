'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function* run (context, heroku) {
  let path = `/apps/${context.app}/log-drains`;
  if (context.flags.extended) path = path + '?extended=true';
  let drains = yield heroku.request({path});
  if (context.flags.json) {
    cli.log(JSON.stringify(drains, null, 2));
  } else {
    drains.forEach(function (drain) {
      let output = `${cli.color.cyan(drain.url)} (${cli.color.green(drain.token)})`;
      if (drain.extended) output = output + ` drain_id=${drain.extended.drain_id}`;
      cli.log(output);
    });
  }
}

module.exports = {
  topic: 'drains',
  description: 'display the log drains of an app',
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'json', description: 'output in json format'},
    {name: 'extended', char: 'x', hidden: true},
  ],
  run: cli.command(co.wrap(run))
};
