#!/usr/bin/env node
const whyIsNodeRunning = require('why-is-node-running')
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

function exit(exitCode) {
  process.nextTick(() => {
    setTimeout(function() {
      process.abort(exitCode)
    }, process.env.CI ? 5000: 1000)
    process.exit(exitCode);
  })
}

async function run() {
  const SIGINT_HANDLER = () => {
    console.log('Received ctrl+c. Stopping scripts/test-all.js');
    process.stdout.write('\n');
    exit(1);
  }
  let exitCode = 0;
  try {
    process.once('SIGINT', SIGINT_HANDLER);
    await concurrently(commands, {
      maxProcesses: process.env.CI ? os.cpus() : 4,
      killOthers: ['failure']
    })
    console.log('scripts/test-all: done running concurrently')
    whyIsNodeRunning()
  } catch (err) {
    console.log('scripts/test-all: catch')
    console.log('Error running tests: ', err);
    exitCode = 1;
    whyIsNodeRunning()
  } finally {
    console.log('scripts/test-all: finally')
    process.removeListener('SIGINT', SIGINT_HANDLER);
    whyIsNodeRunning()
    exit(exitCode)
  }
}

run()

