#!/usr/bin/env node

import {spawn} from 'node:child_process'
import os from 'node:os'

if (os.platform() === 'win32' || os.platform() === 'windows') console.log('skipping on windows')
else spawn('npx bats test/acceptance/*.bats', {shell: true, stdio: 'inherit'})
