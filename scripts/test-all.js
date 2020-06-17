#!/usr/bin/env node

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
    command: `yarn --cwd="${path.normalize(packagePath)}" test`
  }
});

async function run() {
  try {
    await concurrently(commands, {
      maxProcesses: process.env.CI ? os.cpus() : 4,
      killOthers: ['failure']
    })
  } catch (err) {
    console.log('Error running tests: ', err);
    process.exit(1);
  }
}

run()

