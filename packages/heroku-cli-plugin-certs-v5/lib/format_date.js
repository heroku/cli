'use strict'

let moment = require('moment')

module.exports = function (date) {
  let dateStr = moment.utc(date, 'YYYY-MM-DD[T]HH:mm:ssZ', true).format('YYYY-MM-DD HH:mm z')
  if (dateStr === 'Invalid date') {
    return moment.utc(date, 'YYYY/MM/DD HH:mm:ss ZZ', true).format('YYYY-MM-DD HH:mm z')
  } else {
    return dateStr
  }
}
