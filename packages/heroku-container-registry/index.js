var pkg = require('./package.json');

const TOPIC = 'docker';
const DESCRIPTION = 'Use Docker to build and deploy Heroku apps';

module.exports = {
  topics: [{
    name: TOPIC,
    description: DESCRIPTION
  }],
  commands: [{
      topic: TOPIC,
      description: DESCRIPTION,
      help: DESCRIPTION,
      run: function(context) {
        console.log(pkg.version);
      }
    },

    require('./commands/init')(TOPIC),
    require('./commands/exec')(TOPIC),
    require('./commands/start')(TOPIC),
    require('./commands/release')(TOPIC),
    require('./commands/clean')(TOPIC)
  ]
};
