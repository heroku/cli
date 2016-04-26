'use strict';

let co      = require('co');
let cli     = require('heroku-cli-util');
let _       = require('lodash');
let inquirer = require('inquirer');

let error               = require('../../lib/error.js');
let readFile            = require('../../lib/read_file.js');
let findMatch           = require('../../lib/find_match.js');
let endpoints           = require('../../lib/endpoints.js');
let ssl_doctor          = require('../../lib/ssl_doctor.js');
let displayTable        = require('../../lib/display_table.js');
let display_warnings    = require('../../lib/display_warnings.js');
let certificate_details = require('../../lib/certificate_details.js');

function* getMeta(context, heroku) {
  if (context.flags.type === 'endpoint') {
    return endpoints.meta(context.app, 'ssl');
  } else if (context.flags.type === 'sni' || ! (yield endpoints.hasAddon(context.app, heroku))) {
    return endpoints.meta(context.app, 'sni');
  } else {
    error.exit(1, 'Must pass either --type with either \'endpoint\' or \'sni\'');
  }
}

function* getFiles(context) {
  let files = yield {
    crt: readFile(context.args.CRT),
    key: readFile(context.args.KEY)
  };

  let crt, key;
  if (context.flags.bypass) {
    crt = files.crt;
    key = files.key;
  } else {
    let res = JSON.parse(yield ssl_doctor('resolve-chain-and-key', [files.crt, files.key]));
    crt = res.pem;
    key = res.key;
  }

  return {crt, key};
}

function getFlagChoices(context, cert_domains, existingDomains) {
  let choices = _.difference(context.flags.domains.split(',').map(str => str.trim()), existingDomains);

  let bad_choices = _.remove(choices, choice => (!_.find(cert_domains, cert_domain => cert_domain === choice)));
  bad_choices.forEach(function(choice) {
    cli.warn(`Not adding ${choice} because it is not listed in the certificate`);
  });

  return choices;
}

function* getPromptChoices(context, cert_domains, existingDomains, newDomains) {
  let resp = yield inquirer.prompt([{
    type: 'checkbox',
    name: 'domains',
    message: 'Select domains you would like to add',
    choices: newDomains.map(function(domain) {
      return {name: domain};
    })
  }]);
  return resp.domains;
}

function* addDomains(context, heroku, meta, promises_result) {
  let cert_domains = promises_result.cert.ssl_cert.cert_domains;
  let api_domains  = promises_result.domains;

  let existingDomains = [];
  let newDomains = [];

  cert_domains.forEach(function(cert_domain) {
    let matches = findMatch(cert_domain, api_domains);
    if (matches) {
      existingDomains.push(cert_domain);
    } else {
      newDomains.push(cert_domain);
    }
  });

  if (existingDomains.length > 0) {
    cli.log();
    cli.styledHeader('The following common names already have domain entries');
    existingDomains.forEach(domain => cli.log(domain));
  }

  let addedDomains;
  if (newDomains.length > 0) {
    let choices;
    if (context.flags.domains) {
      choices = getFlagChoices(context, cert_domains, existingDomains);
    } else {
      choices = yield getPromptChoices(context, cert_domains, existingDomains, newDomains);
    }

    // Add a newline between the existing and adding messages
    if (choices.length > 0) {
      cli.console.error();
    }

    addedDomains = new Array(choices.length);
    for (let i = 0; i < choices.length; i++) {
      let cert_domain = choices[i];

      addedDomains[i] = yield cli.action(`Adding domain ${cert_domain} to ${context.app}`, {}, heroku.request({
        path: `/apps/${context.app}/domains`,
        method: 'POST',
        body: {'hostname': cert_domain}
      }));
    }
  } else {
    addedDomains = [];
  }

  cli.log();
  cli.styledHeader('The following domains are set up for this certificate');
  displayTable([promises_result.cert], api_domains.concat(addedDomains));
}

function* run(context, heroku) {
  let meta = yield getMeta(context, heroku);

  let files = yield getFiles(context);

  let promises = {};
  promises.cert = cli.action(`Adding SSL certificate to ${context.app}`, {}, heroku.request({
    path: meta.path,
    method: 'POST',
    body: {certificate_chain: files.crt, private_key: files.key},
    headers: {'Accept': `application/vnd.heroku+json; version=3.${meta.variant}`}
  }));

  if (meta.type === 'SNI') {
    promises.domains = heroku.request({
      path: `/apps/${context.app}/domains`,
    });
  }

  let promises_result = yield promises;

  let cert = promises_result.cert;
  cert._meta = meta;

  let stable_cname = meta.type === 'SNI' && ! cert.cname;

  // Remove the warning for SNI endpoints because we will provide our own error
  if (stable_cname && cert.warnings && cert.warnings.ssl_cert) {
    _.pull(cert.warnings.ssl_cert, 'provides no domain(s) that are configured for this Heroku app');
  }

  if (stable_cname) {
    certificate_details(cert);

    yield addDomains(context, heroku, meta, promises_result);
  } else {
    cli.log(`${context.app} now served by ${cert.cname}`);
    certificate_details(cert);
  }

  display_warnings(cert);
}

module.exports = {
  topic: '_certs',
  command: 'add',
  args: [
    {name: 'CRT', optional: false},
    {name: 'KEY', optional: false},
  ],
  flags: [
    {name: 'bypass', description: 'bypass the trust chain completion step', hasValue: false},
    {name: 'type', description: 'type to create, either \'sni\' or \'endpoint\'', hasValue: true},
    {name: 'domains', description: 'domains to create after certificate upload', hasValue: true},
  ],
  description: 'Add an SSL certificate to an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run)),
};
