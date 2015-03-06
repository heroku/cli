var fs = require('fs');
var path = require('path');
var _ = require('lodash');

module.exports = {
  set: setState,
  get: getState
};

function setState(stateDir, newState) {
  var state = getState(stateDir);
  var statePath = path.join(stateDir, 'docker.json');
  _.extend(state, newState);
  fs.writeFileSync(statePath, JSON.stringify(state), { encoding: 'utf8' });
}

function getState(stateDir) {
  var statePath = path.join(stateDir, 'docker.json');
  try {
    return JSON.parse(fs.readFileSync(statePath, { encoding: 'utf8' }));
  }
  catch (e) {
    return {};
  }
}
