'use strict';

let cli = require('heroku-cli-util');

module.exports = function (heroku) {
  function getRules (space) {
    return heroku.request({
      path:    `/spaces/${space}/inbound-ruleset`,
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    });
  }

  function putRules (space, inboundrules) {
    return heroku.request({
      method:  'PUT',
      path:    `/spaces/${space}/inbound-ruleset`,
      body:    inboundrules,
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    });
  }

  function defaultAction (action) {
    switch (action) {
      case 'allow':
        return cli.color.green('allow only web requests to web dynos');
      case 'deny':
        return cli.color.red('deny traffic from all sources');
      default:
        return action;
    }
  }

  function displayRules (inboundrules) {
    if (inboundrules.rules.length > 0) {
      cli.table(inboundrules.rules, {
        columns: [
          {key: 'source', label: 'Source'},
          {key: 'action', label: 'Action'},
        ]
      });
    } else {
      cli.styledHeader(`Default Action: ${defaultAction(inboundrules.default_action)}`);
    }
    cli.styledObject({
      Version: inboundrules.version,
      'Created at': inboundrules.created_at,
      'Created by': inboundrules.created_by,
    });
  }


  return {
    getRules,
    putRules,
    displayRules,
  };
};
