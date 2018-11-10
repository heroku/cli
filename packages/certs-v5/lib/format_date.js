'use strict'

const format = require('date-fns/format')

function getUTCDate (dateString = Date.now()) {
  const date = new Date(dateString);

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
};

module.exports = function (date) {
  return format(getUTCDate(date), 'YYYY-MM-DD HH:mm UTC')
}
