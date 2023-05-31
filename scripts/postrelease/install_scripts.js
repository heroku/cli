#!/usr/bin/env node

const execa = require('execa')
const getHerokuS3Bucket = require('../utils/getHerokuS3Bucket')
const qq = require('qqjs')
const path = require('path')

const opts = {
  cwd: path.join(__dirname, '..', '..'),
  stdio: 'inherit'
}

qq.config.silent = false
qq.run(async () => {
  const {GITHUB_HEAD_REF, GITHUB_REF_NAME} = process.env

  // allow from running from merged release branch or workflow_dispatch
  const TARGET_BRANCH = GITHUB_HEAD_REF ? GITHUB_HEAD_REF.replace('refs/heads/', '') : GITHUB_REF_NAME
  if (TARGET_BRANCH.startsWith('release-')) {
    const HEROKU_S3_BUCKET = getHerokuS3Bucket()
    await execa.command(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-standalone.sh s3://${HEROKU_S3_BUCKET}/install-standalone.sh`, opts)
    await execa.command(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-standalone.sh s3://${HEROKU_S3_BUCKET}/install.sh`, opts)
    await execa.command(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-ubuntu.sh s3://${HEROKU_S3_BUCKET}/install-ubuntu.sh`, opts)
  } else {
    console.log('Not on stable release, skipping updating install scripts')
  }
})
