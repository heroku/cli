'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');
let _   = require('lodash');
let S   = require('string');

function* run (context, heroku) {
  let features = yield heroku.get(`/apps/${context.app}/features`);
  features = features.filter(f => f.state === 'general');
  features = _.sortBy(features, 'name');

  if (context.flags.json) {
    cli.styledJSON(features);
  } else {
    cli.styledHeader(`App Features ${cli.color.app(context.app)}`);
    let longest = Math.max.apply(null, features.map(f => f.name.length));
    for (let f of features) {
      let line = `${f.enabled ? '[+]' : '[ ]'} ${S(f.name).padRight(longest)}`;
      if (f.enabled) line = cli.color.green(line);
      line = `${line}  ${f.description}`;
      cli.log(line);
    }
  }
}

module.exports = {
  topic: 'features',
  description: 'list available app features',
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(co.wrap(run))
};
