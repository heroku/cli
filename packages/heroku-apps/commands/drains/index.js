'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');
let _   = require('lodash');

function* run (context, heroku) {
  let path = `/apps/${context.app}/log-drains`;
  if (context.flags.extended) path = path + '?extended=true';
  let drains = yield heroku.request({path});
  if (context.flags.json) {
    cli.styledJSON(drains);
  } else {
    drains = _.partition(drains, 'addon');
    if (drains[1].length > 0) {
      cli.styledHeader('Drains');
      drains[1].forEach(drain => {
        let output = `${drain.url} (${cli.color.green(drain.token)})`;
        if (drain.extended) output = output + ` drain_id=${drain.extended.drain_id}`;
        cli.log(output);
      });
    }
    if (drains[0].length > 0) {
      let addons = yield drains[0].map(d => heroku.get(`/apps/${context.app}/addons/${d.addon.name}`));
      cli.styledHeader('Add-on Drains');
      addons.forEach(addon => {
        cli.log(`${cli.color.yellow(addon.plan.name)} (${cli.color.green(addon.name)})`);
      });
    }
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
