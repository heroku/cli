var url = require('url');
var child = require('child_process');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'open',
    description: 'load web app in browser',
    help: 'Open default web browser and load app started with `start`',
    run: open
  }
};

function open(context) {
  var host = url.parse(process.env.DOCKER_HOST).hostname;
  var web = `http://${host}:3000`;
  console.log(`opening ${web}...`);
  child.execSync(`open "${web}"`);
}
