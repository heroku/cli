var url = require('url');
var child = require('child_process');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'open',
    description: 'open the local web process in a web browser',
    help: `help text for ${topic}:open`,
    run: open
  }
};

function open(context) {
  var host = url.parse(process.env.DOCKER_HOST).hostname;
  var web = `http://${host}:3000`;
  console.log(`opening ${web}...`);
  child.execSync(`open "${web}"`);
}
