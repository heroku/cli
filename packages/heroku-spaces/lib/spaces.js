'use strict'

module.exports = function () {
  function displayNat (nat) {
    if (!nat) return
    if (nat.state !== 'enabled') return nat.state
    return nat.sources.join(', ')
  }

  return {
    displayNat
  }
}
