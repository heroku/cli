#!/usr/bin/env node

import os from 'os'
import {spawn} from 'child_process'

if (os.platform() === 'win32' || os.platform() === 'windows') console.log('skipping on windows')
else spawn('yarn bats test/acceptance/*.bats', {stdio: 'inherit', shell: true})
