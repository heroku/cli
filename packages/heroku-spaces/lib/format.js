'use strict'

module.exports = function () {
  function CIDR (cidr) {
    if (!cidr || cidr.length === 0) return ''
    return cidr.join(', ')
  }

  return {
    CIDR
  }
}
