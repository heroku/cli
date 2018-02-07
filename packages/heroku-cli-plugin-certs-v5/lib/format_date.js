'use strict'

const format = require('date-fns/format')

module.exports = function (date) {
  return format(new Date(date).toISOString(), 'YYYY-MM-DD HH:mm UTC')
}
