var fs = require('fs');
var path = require('path');
var child = require('child_process');

var _ = require('lodash');
var exists = require('is-there');
var cli = require('heroku-cli-util');
var YAML = require('yamljs');
var camelcase = require('camelcase');

var docker = require('../lib/docker');
var safely = require('../lib/safely');
var directory = require('../lib/directory');

const ADDONS = require('../lib/addons');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'init',
    description: 'create Dockerfile and docker-compose.yml',
    help: 'Creates a Dockerfile and docker-compose.yml for the app specified in app.json',
    flags: [],
    run: safely(init)
  };
};

function init(context) {
  var procfile = directory.readProcfile(context.cwd);
  if (!procfile) throw new Error('Procfile required. Aborting');

  createDockerfile(context.cwd);
  createDockerCompose(context.cwd);
}

function createDockerfile(dir) {
  var dockerfile = path.join(dir, docker.filename);
  var appJSON = JSON.parse(fs.readFileSync(path.join(dir, 'app.json'), { encoding: 'utf8' }));
  var image = appJSON.image || 'heroku/cedar:14';
  var contents = `FROM ${ image }\n`;

  try {
    fs.statSync(dockerfile);
    cli.log(`Overwriting existing '${ docker.filename }'`);
  }
  catch (e) {}

  fs.writeFileSync(dockerfile, contents, { encoding: 'utf8' });
  cli.log(`Wrote ${ docker.filename }`);
}

function createDockerCompose(dir) {
  var composeFile = path.join(dir, docker.composeFilename);
  var procfile = directory.readProcfile(dir);
  var appJSON = JSON.parse(fs.readFileSync(path.join(dir, 'app.json'), { encoding: 'utf8' }));
  var mountDir = directory.determineMountDir(dir);

  try {
    fs.statSync(composeFile);
    cli.log(`Overwriting existing '${ docker.composeFilename }'`);
  }
  catch (e) {}

  // read app.json to get the app's specification
  var appJSON = JSON.parse(fs.readFileSync(path.join(dir, 'app.json'), { encoding: 'utf8' }));

  // get the base addon name, ignoring plan types
  var addonNames = _.map(appJSON.addons, nameWithoutPlan);

  // process only the addons that we have mappings for
  var mappedAddons = _.filter(addonNames, _.has.bind(this, ADDONS));

  // hyphens are not valid in link names for docker-compose
  var links = _.map(mappedAddons || [], camelcase);

  // reduce all addon env vars into a single object
  var envs = _.reduce(mappedAddons, reduceEnv, {});

  // compile a list of process types from the procfile
  var processes = _.mapValues(procfile, processToService(mountDir, links, envs));

  // add a 'shell' process for persistent changes, one-off tasks
  processes.shell = _.extend(_.cloneDeep(processes.web), {
    command: 'bash',
    volumes: [`.:${mountDir}`]
  });

  // zip all the addons into an object
  var addons = _.zipObject(links, _.map(mappedAddons, addonToService));

  // combine processes and addons into a list of all services
  var services = _.extend({}, processes, addons);

  // create a docker-compose file from the list of services
  var composeContents = YAML.stringify(services, 4, 2);

  fs.writeFileSync(composeFile, composeContents, { encoding: 'utf8' });
  cli.log(`Wrote ${ docker.composeFilename }`);

  function nameWithoutPlan(addon) {
    return addon.split(':')[0];
  }

  function reduceEnv(env, addon) {
    _.extend(env, ADDONS[addon].env);
    return env;
  }

  function processToService(mountDir, links, envs) {
    return function(command, procName) {
      var port = procName === 'web' ? docker.port : undefined;
      return _.pick({
        build: '.',
        command: `bash -c '${command}'`,
        working_dir: mountDir,
        dockerfile: undefined,                          // TODO: docker.filename (once docker-compose 1.3.0 is released)
        environment: _.extend(port ? { PORT: port } : {}, envs),
        ports: port ? [`${ port }:${ port }`] : undefined,
        links: links.length ? links : undefined,
        envFile: undefined                              // TODO: detect an envFile?
      }, _.identity);
    };
  }

  function addonToService(addon) {
    return {
      image: ADDONS[addon].image
    };
  }
}
