var cli = require('heroku-cli-util');

module.exports = function safely(fn) {
  return function(context) {
    if (context.debug) {
      return fn(context);
    }
    else {
      try {
        var result = fn(context);
        if (result && result.catch) result.catch(onError);
        return result;
      }
      catch (e) {
        onError(e);
      }
    }
  }
};

function onError(e) {
  cli.error(e);
}
