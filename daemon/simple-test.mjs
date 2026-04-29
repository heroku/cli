#!/usr/bin/env node
import {execute} from '@oclif/core';

console.log('Testing oclif execute...');

const binRun = new URL('../bin/run.js', import.meta.url);
console.log('CLI root:', binRun.href);

try {
  // Set process.argv to include the command
  process.argv = ['node', 'heroku', '--version'];

  await execute({dir: binRun.href});
  console.log('Success!');
} catch (err) {
  console.error('Error:', err.message);
  console.error(err.stack);
}
