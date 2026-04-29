#!/usr/bin/env node
import net from 'net';

const socket = net.connect('/tmp/heroku-test-daemon.sock');

socket.on('connect', () => {
  const args = process.argv.slice(2);
  // Default to 'version' if no args provided
  const request = {
    args: args.length > 0 ? args : ['version']
  };
  socket.write(JSON.stringify(request) + '\n');
});

socket.on('data', (data) => {
  const response = JSON.parse(data.toString());
  console.log('[client] Response:', response);
  if (response.stdout) {
    process.stdout.write(response.stdout);
  }
  socket.end();
  process.exit(response.exitCode);
});

socket.on('error', (err) => {
  console.error('[client] Error:', err.message);
  process.exit(1);
});
