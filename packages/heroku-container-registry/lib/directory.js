var fs = require('fs');
var dotenv = require('dotenv');
var path = require('path');
var yaml = require('yamljs');

module.exports = {
  getFormattedEnvArgComponent: getFormattedEnvArgComponent,
  readProcfile: readProcfile
};

function getFormattedEnvArgComponent(cwd) {
  var envParameters = [];

  try {
    var dotenvPath = path.join(cwd, '.env');
    var dotenvEntries = dotenv.parse(fs.readFileSync(dotenvPath));
    envParameters = Object.keys(dotenvEntries).map(function(key) {
      return '-e ' + key + '=' + dotenvEntries[key];
    });
  }
  catch (e) {
    if (e.code === 'ENOENT') {
      // no .env file
    }
    else {
      throw e;
    }
  }

  return envParameters.join(' ');
}

function readProcfile(cwd) {
  try {
    var procfilePath = path.join(cwd, 'Procfile');
    return yaml.load(procfilePath);
  }
  catch (e) {}
}
