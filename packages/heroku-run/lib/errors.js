'use strict';
let h = require('heroku-cli-util');

module.exports.handleErr = function handleErr(err) {
  h.error(err);
  if (err.stack) {
    console.error(err.stack);
  }
};
