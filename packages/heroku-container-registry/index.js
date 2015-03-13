const TOPIC = 'docker';

module.exports = {
  topics: [{
    name: TOPIC,
    description: 'Develop for Heroku locally, with Docker'
  }],
  commands: [
    require('./commands/boot2docker')(TOPIC),
    require('./commands/create')(TOPIC),
    require('./commands/run')(TOPIC),
    require('./commands/start')(TOPIC),
    require('./commands/release')(TOPIC)
  ]
};
