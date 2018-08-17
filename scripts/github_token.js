#!/usr/bin/env node

// gets a github auth token for a github app

const jwt = require('jsonwebtoken')
const {HTTP} = require('http-call')
const exp = new Date()
exp.setMinutes(exp.getMinutes() + 10)
const env = k => {
  if (process.env[k]) return process.env[k]
  else throw new Error(`Must set ${k}`)
}

const token = jwt.sign(
  {},
  new Buffer(env('GITHUB_APP_PEM'), 'base64').toString('utf8'), {
  issuer: env('GITHUB_APP_ID'),
  algorithm: 'RS256',
  expiresIn: '10m'
})

const installation = process.argv[2]

async function run () {
  const {body} = await HTTP.post(`https://api.github.com/app/installations/${installation}/access_tokens`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.machine-man-preview+json"'
    }
  })
  console.log(body.token)
}

run()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
