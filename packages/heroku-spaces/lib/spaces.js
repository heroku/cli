'use strict'

function displayNat (nat) {
  if (!nat) return
  if (nat.state !== 'enabled') return nat.state
  return nat.sources.join(', ')
}

function displayShieldState (space) {
  return space.shield ? 'on' : 'off'
}

exports.displayNat = displayNat
exports.displayShieldState = displayShieldState
