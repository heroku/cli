var cli = require('heroku-cli-util');

module.exports = function safely(fn) {
  return function() {
    try {
      var result = fn.apply(this, arguments);
      if (result && result.catch) result.catch(onError);
      return result;
    }
    catch (e) {
      onError(e);
    }
  }
};

function onError(e) {
  cli.error(e);
}
