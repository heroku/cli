#!/usr/bin/env node
/**
 * Simple test daemon to validate the approach
 */

import net from 'net';
import fs from 'fs';
import {execute} from '@oclif/core';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOCKET_PATH = '/tmp/heroku-test-daemon.sock';

console.log('Starting test daemon...');

// Clean up old socket
if (fs.existsSync(SOCKET_PATH)) {
  fs.unlinkSync(SOCKET_PATH);
}

// Pre-load oclif
console.log('Pre-loading oclif...');

const server = net.createServer(async (socket) => {
  console.log('Client connected');

  let buffer = '';
  socket.on('data', async (data) => {
    buffer += data.toString();

    if (!buffer.endsWith('\n')) return;

    const request = JSON.parse(buffer.trim());
    console.log('Command:', request.args);

    const start = Date.now();

    try {
      // Capture output
      let stdout = '';
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = (chunk) => {
        stdout += chunk.toString();
        return true;
      };

      // Set process.argv with the command
      const originalArgv = process.argv;
      process.argv = ['node', 'heroku', ...request.args];

      // Point to the CLI bin/run.js for oclif
      const binRun = new URL('../bin/run.js', import.meta.url);

      await execute({dir: binRun.href});

      process.argv = originalArgv;

      process.stdout.write = originalWrite;

      const duration = Date.now() - start;
      console.log(`Completed in ${duration}ms`);

      socket.write(JSON.stringify({
        exitCode: 0,
        stdout,
        duration
      }) + '\n');
    } catch (err) {
      console.error('Error:', err.message);
      socket.write(JSON.stringify({
        exitCode: 1,
        stderr: err.message,
        duration: Date.now() - start
      }) + '\n');
    }

    socket.end();
  });
});

server.listen(SOCKET_PATH, () => {
  console.log('Listening on', SOCKET_PATH);
  fs.chmodSync(SOCKET_PATH, 0o600);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close();
  if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
  process.exit(0);
});
