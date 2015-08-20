var fs = require("fs");
var path = require("path");

exports.topic = {
  name: 'pipelines',
  // this is the help text that shows up under `heroku help`
  description: 'manage collections of apps in pipelines'
};

var normalizedPath = path.join(__dirname, "commands/pipelines");

exports.commands = fs.readdirSync(normalizedPath).map(function(file) {
  return require("./commands/pipelines/" + file);
});
