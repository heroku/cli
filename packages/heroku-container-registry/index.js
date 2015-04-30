var pkg = require('./package.json');

const TOPIC = 'docker';

module.exports = {
  topics: [{
    name: TOPIC,
    description: 'Develop for Heroku locally, with Docker'
  }],
  commands: [{
      topic: TOPIC,
      description: 'Develop for Heroku locally, with Docker',
      help: `help text for ${TOPIC}`,
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
