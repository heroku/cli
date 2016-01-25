'use strict';

let cli         = require('heroku-cli-util');
let co          = require('co');

function* run (context, heroku) {
  let regions = yield heroku.get(`/regions`);
  if (context.flags.json) {
    cli.log(JSON.stringify(regions, 0, 2));
  } else {
    cli.styledHeader('Regions');
    cli.table(regions, {
      printHeader: null,
      columns: [
        {key: 'name', format: n => cli.color.green(n)},
        {key: 'description'},
      ]
    });
  }
}

module.exports = {
  topic: 'regions',
  description: 'list available regions for deployment',
  needsAuth: true,
  flags: [
    {name: 'json', description: 'output config vars in json format'},
  ],
  run: cli.command(co.wrap(run))
};
