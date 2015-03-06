var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var mkdirp = require('mkdirp');

const STATE_PATH = '.heroku/docker.json';

module.exports = {
  set: setState,
  get: getState
};

function setState(stateDir, newState) {
  var stateFile = path.join(stateDir, STATE_PATH);
  mkdirp.sync(path.dirname(stateFile));
  var state = _.extend(getState(stateDir), newState);
  fs.writeFileSync(stateFile, JSON.stringify(state), { encoding: 'utf8' });
}

function getState(stateDir) {
  var stateFile = path.join(stateDir, STATE_PATH);
  try {
    return JSON.parse(fs.readFileSync(stateFile, { encoding: 'utf8' }));
  }
  catch (e) {
    return {};
  }
}
