#!/usr/bin/env node

const os = require('os')
const {spawn} = require('child_process')

if (os.platform() === 'win32' || os.platform() === 'windows') console.log('skipping on windows')
else spawn('npm run bats test/acceptance/*.bats', {stdio: 'inherit', shell: true})
