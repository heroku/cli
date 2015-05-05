var path = require('path');
var child = require('child_process');
var url = require('url');
var colors = require('colors');
var docker = require('../lib/docker');
var directory = require('../lib/directory');
var cli = require('heroku-cli-util');
var safely = require('../lib/safely');

var TEMPLATE_PATH = path.resolve(__dirname, '../templates/start-Dockerfile');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'start',
    description: 'start Docker app container',
    help: 'Start local Docker app container running Procfile-defined process. Default is `web` Procfile entry.',
    variableArgs: true,
    run: safely(start)
  };
};

function start(context) {
  var procfile = directory.readProcfile(context.cwd);
  if (!procfile) throw new Error('Procfile required. Aborting');

  var procName = context.args[0] || 'web';
  var command = procfile[procName];
  if (!command) throw new Error(`No '${procName}' process type declared in Procfile. Aborting`);

  var startImageId = docker.ensureStartImage(context.cwd);
  if (!startImageId) throw new Error('Unable to find or create docker image');

  cli.log('\nstarting container...');
  if (procName === 'web') {
    cli.log('web process will be available at', colors.yellow.underline(getURL()));
  }
  return docker.runImage(startImageId, context.cwd, command, false);
}

function getURL() {
  var host = url.parse(process.env.DOCKER_HOST || 'tcp://localhost').hostname;
  return `http://${host}:3000/`;
}
