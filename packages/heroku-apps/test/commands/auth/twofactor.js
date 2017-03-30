'use strict'
/* globals commands describe it */

const expect = require('unexpected')

describe('twofactor alias', () => {
  it('twofactor is found', () => {
    const cmd = commands.find(c => c.topic === 'twofactor' && !c.command)
    expect(cmd, 'to have own properties', {
      topic: 'twofactor'
    })
    expect(cmd, 'not to have own properties', ['command'])
  })

  it('twofactor:disable is found', () => {
    const cmd = commands.find(c => c.topic === 'twofactor' && c.command === 'disable')
    expect(cmd, 'to have own properties', {
      topic: 'twofactor',
      command: 'disable'
    })
  })

  it('twofactor:generate-recovery-codes is found', () => {
    const cmd = commands.find(c => c.topic === 'twofactor' && c.command === 'generate-recovery-codes')
    expect(cmd, 'to have own properties', {
      topic: 'twofactor',
      command: 'generate-recovery-codes'
    })
  })
})
