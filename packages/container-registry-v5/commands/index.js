const pkg = require('../package.json')

function showVersion (context) {
  console.log(pkg.version)
}

module.exports = {
  topic: pkg.topic,
  description: pkg.description,
  run: showVersion
}
