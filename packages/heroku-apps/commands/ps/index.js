'use strict';

let cli      = require('heroku-cli-util');
let co       = require('co');
let _        = require('lodash');
let strftime = require('strftime');

let trunc = s => _.trunc(s, {length: 35, omission: '…'});

// gets the process number from a string like web.19 => 19
let getProcessNum = s => parseInt(s.split('.', 2)[1]);

function printJSON (data) {
  cli.log(JSON.stringify(data.dynos, null, 2));
}

function timeAgo (since) {
  let elapsed = Math.floor((new Date() - since)/1000);
  let message = strftime('%Y/%m/%d %H:%M:%S', since);
  if (elapsed < 60) return `${message} (~ ${Math.floor(elapsed)}s ago)`;
  else if (elapsed < 60*60) return `${message} (~ ${Math.floor(elapsed/60)}m ago)`;
  else if (elapsed < 60*60*25) return `${message} (~ ${Math.floor(elapsed/60/60)}h ago)`;
  else return message;
}

function timeRemaining (from, to) {
  let secs  = Math.floor(to/1000 - from/1000);
  let mins  = Math.floor(secs / 60);
  let hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  if (mins > 0)  return `${mins}m ${secs % 60}s`;
  if (secs > 0)  return `${secs}s`;
  return '';
}

function printQuota (quota) {
  if (!quota) return;
  let lbl;
  if (quota.allow_until) lbl = 'Free quota left';
  else if (quota.deny_until) lbl = 'Free quota exhausted. Unidle available in';
  if (lbl) {
    let timestamp = quota.allow_until ? new Date(quota.allow_until) : new Date(quota.deny_until);
    let time = timeRemaining(new Date(), timestamp);
    console.log(`${lbl}: ${time}`);
  }
}

function printExtended (dynos) {
  dynos = _.sortByAll(dynos, ['type'], a => getProcessNum(a.name));
  cli.table(dynos, {
    columns: [
      {key: 'id', label: 'ID'},
      {key: 'name', label: 'Process'},
      {key: 'state', label: 'State', format: (state, row) => `${state} ${timeAgo(new Date(row.updated_at))}`},
      {key: 'extended.region', label: 'Region'},
      {key: 'extended.instance', label: 'Instance'},
      {key: 'extended.port', label: 'Port'},
      {key: 'extended.az', label: 'AZ'},
      {key: 'release.version', label: 'Release'},
      {key: 'command', label: 'Command', format: trunc},
      {key: 'extended.route', label: 'Route'},
      {key: 'size', label: 'Size'},
    ]
  });
}

function printDynos (dynos) {
  let dynosByCommand = _.reduce(dynos, function (dynosByCommand, dyno) {
    let since = timeAgo(new Date(dyno.updated_at));
    let size = dyno.size || '1X';

    if (dyno.type === 'run') {
      let key = `run: one-off processes`;
      if (dynosByCommand[key] === undefined) dynosByCommand[key] = [];
      dynosByCommand[key].push(`${dyno.name} (${size}): ${dyno.state} ${since}: ${dyno.command}`);
    } else {
      let key = `${dyno.type} (${size}): ${dyno.command}`;
      if (dynosByCommand[key] === undefined) dynosByCommand[key] = [];
      let item = `${dyno.name}: ${dyno.state} ${since}`;
      dynosByCommand[key].push(item);
    }
    return dynosByCommand;
  }, {});
  _.forEach(dynosByCommand, function (dynos, key) {
    cli.styledHeader(key);
    dynos = dynos.sort((a, b) => getProcessNum(a) - getProcessNum(b));
    for (let dyno of dynos) cli.log(dyno);
    cli.log();
  });
}

function* run (context, heroku) {
  let suffix = context.flags.extended ? '?extended=true' : '';
  let data = yield {
    quota: heroku.request({
      path: `/apps/${context.app}/actions/get-quota${suffix}`,
      method: 'post', headers: {Accept: 'application/vnd.heroku+json; version=3.app-quotas'}
    }).catch(() => {}),
    dynos: heroku.request({path: `/apps/${context.app}/dynos${suffix}`}),
  };
  if (context.flags.json) {
    printJSON(data);
  } else if (context.flags.extended) {
    printExtended(data.dynos);
  } else {
    printQuota(data.quota);
    printDynos(data.dynos);
  }
}

module.exports = {
  topic: 'ps',
  description: 'list dynos for an app',
  flags: [
    {name: 'json', description: 'display as json'},
    {name: 'extended', char: 'x', hidden: true},
  ],
  help: `
Example:

 $ heroku ps
 === run: one-off dyno
 run.1: up for 5m: bash

 === web: bundle exec thin start -p $PORT
 web.1: created for 30s`,
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
};
