'use strict';

let cli     = require('heroku-cli-util');
let co      = require('co');

function* run () {
  cli.error(`orgs:default is no longer in the CLI.\nUse the HEROKU_ORGANIZATION environment variable instead.\nSee ${cli.color.cyan('https://devcenter.heroku.com/articles/develop-orgs#default-org')} for more info.`);
}

module.exports = {
  topic:        'orgs',
  command:      'default',
  hidden:       true,
  run:          cli.command(co.wrap(run))
};
