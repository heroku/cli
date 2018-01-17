#!/usr/bin/env node

const path = require('path')
const sh = require('shelljs')
const {expect} = require('chai')
const _ = require('lodash')

const bin = path.join(__dirname, '../../bin/run')

function run(args='') {
  console.log(`$ heroku ${args}`)
  return sh.exec([bin, args].join(' '))
}
