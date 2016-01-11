'use strict';

let moment = require('moment');

module.exports = function(date) {
  return moment.utc(date, "YYYY-MM-DD[T]HH:mm:ssZ", true).format("YYYY-MM-DD HH:mm z");
};


