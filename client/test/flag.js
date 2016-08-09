'use strict'

/* globals describe context it */

const flag = require('../lib/flag')

describe('flag', () => {
  context('wantsOrg', () => {
    let command = {wantsOrg: true}
    it('takes an org', () => {
      flag.addHerokuFlags(command)
      command.flags[0].should.have.property('name', 'org')
    })
  })
  context('needsOrg', () => {
    let command = {needsOrg: true}
    it('takes an org', () => {
      flag.addHerokuFlags(command)
      command.flags[0].should.have.property('name', 'org')
      command.flags[0].should.have.property('required', true)
    })
  })
  context('wantsApp', () => {
    let command = {wantsApp: true}
    flag.addHerokuFlags(command)
    it('takes an app', () => {
      command.flags[0].should.have.property('name', 'app')
      command.flags[1].should.have.property('name', 'remote')
    })
  })
})
