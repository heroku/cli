'use strict'

const cli = require('heroku-cli-util')

let styles = {
  app: 'cyan',
  attachment: 'green',
  addon: 'magenta'
}

module.exports = {
  // style given text or return a function that styles text according to provided style
  style: function style (s, t) {
    if (!t) return (text) => style(s, text)
    return cli.color[styles[s] || s](t)
  },

  table: function (data, options) {
    const merge = require('lodash.merge')

    return cli.table(data, merge(options, {
      printLine: cli.log
    }))
  },

  formatPrice: function (price) {
    const printf = require('printf')

    if (!price) return
    if (price.cents === 0) return 'free'

    let fmt = price.cents % 100 === 0 ? '$%.0f/%s' : '$%.02f/%s'
    return printf(fmt, price.cents / 100, price.unit)
  }
}
