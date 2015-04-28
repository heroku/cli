var fs = require('fs');
var dotenv = require('dotenv');
var path = require('path');

module.exports = {
  getFormattedEnvArgComponent: getFormattedEnvArgComponent 
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
