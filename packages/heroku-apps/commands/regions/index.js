'use strict';

let cli         = require('heroku-cli-util');
let co          = require('co');

function* run (context, heroku) {
  let regions = yield heroku.request({path: `/regions`});
  if (context.flags.json) {
    cli.log(JSON.stringify(regions, 0, 2));
  } else {
    cli.styledHeader('Regions');
    for (let region of regions) {
      cli.log(`${cli.color.green(region.name)}  ${region.description}`);
    }
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
