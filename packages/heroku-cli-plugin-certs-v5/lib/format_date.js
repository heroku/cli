'use strict';

let moment = require('moment');

module.exports = function(date) {
  let date_str = moment.utc(date, "YYYY-MM-DD[T]HH:mm:ssZ", true).format("YYYY-MM-DD HH:mm z");
  if (date_str === 'Invalid date') {
    return moment.utc(date, "YYYY/MM/DD HH:mm:ss ZZ", true).format("YYYY-MM-DD HH:mm z");
  } else {
    return date_str;
  }
};


