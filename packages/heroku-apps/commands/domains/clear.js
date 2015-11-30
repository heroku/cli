'use strict';

let cli           = require('heroku-cli-util');
let co            = require('co');
let BluebirdQueue = require('bluebird-queue');

function* run (context, heroku) {
  let queue = new BluebirdQueue({concurrency: 5});
  let p = heroku.request({path: `/apps/${context.app}/domains`})
  .then(function (domains) {
    domains = domains.filter(d => d.kind === 'custom');
    if (domains.length === 0) return;
    for (let domain of domains) {
      queue.add(heroku.request({path: `/apps/${context.app}/domains/${domain.hostname}`, method: 'DELETE'}));
    }
    return queue.start();
  });
  yield cli.action(`Removing all domains from ${cli.color.cyan(context.app)}`, p);
}

module.exports = {
  topic: 'domains',
  command: 'clear',
  description: 'remove all domains from an app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
};
