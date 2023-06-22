'use strict'
/* global before after context */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const bastion = require('../../../lib/bastion')
// const fetcher = require('../../../lib/fetcher')
const psql = require('../../../lib/psql')
let cmd

const fetcher = () => {
  return {
    database: () => {},
    addon: () => {},
  }
}

// let psql = () => {
//   return {
//     exec: () => {},
//   }
// }

// let bastion = () => {
//   return {
//     env: () => {},
//     getConfigs: () => {},
//   }
// }

describe.only('pg:bloat', () => {
  let processStub
  before(() => {
    processStub = sinon.stub(process.stdout, 'write').callsFake(() => {})
    cmd = proxyquire('../../../commands/bloat', {
      '../lib/fetcher': fetcher,
    //   '../lib/psql': psql,
    //   '../lib/bastion': bastion,
    })

    cli.mockConsole()
  })

  after(() => {
    // fetcher = null
    // psql = null
  })

  it('shows table and index bloat in your database ', () => {
    return cmd[0].run({app: 'myapp', args: {database: 'test-database'}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(''))
  })
})
