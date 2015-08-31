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
    flags: [
      { name: 'image', char: 'i', description: 'the Docker image from which to inherit', hasValue: true },
      { name: 'force', char: 'f', description: 'overwrite existing Dockerfile and docker-compose.yml', hasValue: false }
    ],
    run: safely(init)
  };
};

function init(context) {
  // Check preconditions
  abortOnMissing(context.cwd, 'Procfile');
  abortOnClobber(context.cwd, docker.filename, context.flags.force);
  abortOnClobber(context.cwd, docker.composeFilename, context.flags.force);

  // Inputs (Procfile & app.json)
  var procfile = readFile(context.cwd, 'Procfile', YAML.parse);
  var appJSON = exists(path.join(context.cwd, 'app.json')) ?
    readFile(context.cwd, 'app.json', JSON.parse) :
    createAppJSON(context.cwd, context.flags.image);

  // Outputs (app.json & Dockerfile & docker-compose.yml)
  appJSON.image = context.flags.image || appJSON.image;
  var dockerfile = createDockerfile(appJSON.image);
  var dockerCompose = createDockerCompose(procfile, appJSON.addons, appJSON.mount_dir);

  // All went well; write all files
  writeFile(context.cwd, 'app.json', JSON.stringify(appJSON, null, '  '));
  writeFile(context.cwd, docker.filename, dockerfile);
  writeFile(context.cwd, docker.composeFilename, dockerCompose);
}

function abortOnMissing(dir, filename) {
  if (!exists(path.join(dir, filename))) {
    throw new Error(`${ filename } required; aborting`);
  }
}

function abortOnClobber(dir, filename, force) {
  if (exists(path.join(dir, filename)) && !force) {
    throw new Error(`${ filename } already exists; use --force to overwrite`);
  }
}

function createAppJSON(dir, image) {
  return {
    name: path.basename(dir),
    image: image,
    addons: []
  };
}

function createDockerfile(image) {
  if (!image) {
    throw new Error(`docker image required: provide an --image flag or 'image' key in app.json`);
  }
  return `FROM ${ image }\n`;
}

function createDockerCompose(procfile, addons, mountDir) {
  var volumeMount = path.join('/app/user', mountDir || '');

  // get the base addon name, ignoring plan types
  var addonNames = _.map(addons, nameWithoutPlan);

  // process only the addons that we have mappings for
  var mappedAddons = _.filter(addonNames, _.has.bind(this, ADDONS));

  // hyphens are not valid in link names for docker-compose
  var links = _.map(mappedAddons || [], camelcase);

  // reduce all addon env vars into a single object
  var envs = _.reduce(mappedAddons, reduceEnv, {});

  // compile a list of process types from the procfile
  var processServices = _.mapValues(procfile, processToService(volumeMount, links, envs));

  // add a 'shell' process for persistent changes, one-off tasks
  processServices.shell = _.extend(_.cloneDeep(processServices.web), {
    command: 'bash',
    volumes: [`.:${ volumeMount }`]
  });

  // zip all the addons into an object
  var addonServices = _.zipObject(links, _.map(mappedAddons, addonToService));

  // combine processes and addons into a list of all services
  var services = _.extend({}, processServices, addonServices);

  // create docker-compose contents from the list of services
  return YAML.stringify(services, 4, 2);

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

function readFile(dir, filename, transform) {
  try {
    var contents = fs.readFileSync(path.join(dir, filename), { encoding: 'utf8' });
    return transform ? transform(contents) : contents;
  }
  catch (e) {
    throw new Error(`Error reading ${ filename } (${ e.message })`);
  }
}

function writeFile(dir, filename, contents) {
  try {
    var file = path.join(dir, filename);
    fs.writeFileSync(file, contents + "\n", { encoding: 'utf8' });
    `Wrote ${ filename }`
  }
  catch (e) {
    throw new Error(`Error writing ${ filename }: (${ e.message })`);
  }
}
