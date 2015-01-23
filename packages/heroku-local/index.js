var spawn = require('child_process').spawn;

exports.topics = [{
  name: 'local',
  description: 'run heroku app locally'
}];

exports.commands = [
  {
    topic: 'local',
    command: 'start',
    description: 'run heroku app locally',
    help: 'TODO',
    run: function () {
      // TODO: console.log(process.cwd())
      spawn('forego', ['start'], {
        cwd: '/Users/jdickey/src/github.com/dickeyxxx/heroku-local',
        stdio: [0, 1, 2]
      });
    }
  }
];
