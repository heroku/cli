#!/usr/bin/env node
const utils = require('util')
const glob = require('glob')
const concurrently = require('concurrently')
const path = require('path')
const os = require('os')

const root = path.join(__dirname, '..')
const packages = glob.sync(`${root}/packages/*`)

const commands = packages.map(packagePath => {
  const packageName = path.relative(root, path.basename(packagePath));
  return {
    name: `packages/${packageName}`,
    command: `yarn --cwd="${path.normalize(packagePath)}" test`,
    env: {
      FORCE_COLOR: '0'
    },
    prefixColor: 'white'
  }
});

async function exit(exitCode) {
  process.exitCode = exitCode;
  // for some reason, Windows does not clean up listeners for subprocesses
  // launched by the child_process properly.
  // If any file descriptors, events, etc are still open, then node.js will not close until they are cleaned up.
  // Even though concurrently logs all the processes as closed, Node thinks they are still open
  // (if you use the why-is-node-running-module in this file) and hangs/times out on Windows.
  // While it doesn't feel great to know for sure, or have something to point to in upstream Node.js issues
  // that clearly identifies a problem in Node.js or Windows,
  // this will at least prevent the build from hanging on CircleCI.
  // Using process.abort instead of process.exit will not wait for cleanup to happen in Node.js
  if (os.platform() === 'win32') {
    setTimeout(() => {
      process.abort(exitCode)
    }, 10000)
  }
}

async function run() {
  let exitCode = 1;

  const SIGINT_HANDLER = () => {
    console.log('Received ctrl+c. Stopping scripts/test-all.js');
    process.stdout.write('\n');
    exit(1);
  }
  try {
    process.once('SIGINT', SIGINT_HANDLER);
    await concurrently(commands, {
      maxProcesses: process.env.CI ? os.cpus() : 4,
      killOthers: ['failure']
    })
    console.log('scripts/test-all: done running concurrently')
    exitCode = 0;
  } catch (err) {
    console.log('scripts/test-all: catch')
    console.log('Error running tests: ', err);
    exitCode = 1;
  } finally {
    console.log('scripts/test-all: finally')
    process.removeListener('SIGINT', SIGINT_HANDLER);
    exit(exitCode)
  }
}

