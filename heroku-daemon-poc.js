#!/usr/bin/env node
/**
 * Proof of Concept: Heroku CLI Daemon
 *
 * This keeps the CLI loaded in memory for instant responses.
 *
 * Usage:
 *   node heroku-daemon-poc.js start  # Start daemon
 *   node heroku-daemon-poc.js stop   # Stop daemon
 *   echo "version" | nc -U /tmp/heroku-daemon.sock  # Execute command
 */

const net = require('net');
const fs = require('fs');
const {spawn} = require('child_process');

const SOCKET_PATH = '/tmp/heroku-daemon.sock';
const PID_FILE = '/tmp/heroku-daemon.pid';

// Daemon server
function startDaemon() {
  // Remove old socket if exists
  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
  }

  console.log('[daemon] Starting Heroku CLI daemon...');

  // Pre-load everything into memory
  console.log('[daemon] Pre-loading oclif and dependencies...');
  const {execute} = require('@oclif/core');

  console.log('[daemon] Ready! Listening on', SOCKET_PATH);

  let commandCount = 0;
  let lastCommandTime = Date.now();

  const server = net.createServer((socket) => {
    socket.on('data', async (data) => {
      commandCount++;
      const startTime = Date.now();

      try {
        const command = data.toString().trim();
        console.log(`[daemon] Command #${commandCount}: ${command}`);

        // Split command into args
        const args = command.split(' ');

        // Execute via oclif (everything already in memory!)
        // Note: This is simplified - real implementation would need proper stdout capture
        const result = await execute(args, {dir: import.meta.url});

        const duration = Date.now() - startTime;
        console.log(`[daemon] Completed in ${duration}ms`);

        socket.write(`Success (${duration}ms)\n`);
      } catch (error) {
        console.error('[daemon] Error:', error.message);
        socket.write(`Error: ${error.message}\n`);
      }

      socket.end();
      lastCommandTime = Date.now();
    });
  });

  server.listen(SOCKET_PATH);

  // Write PID file
  fs.writeFileSync(PID_FILE, process.pid.toString());

  // Auto-shutdown after 5 minutes idle
  setInterval(() => {
    const idleTime = Date.now() - lastCommandTime;
    if (idleTime > 5 * 60 * 1000) {
      console.log('[daemon] Idle for 5 minutes, shutting down...');
      cleanup();
      process.exit(0);
    }
  }, 60 * 1000);
}

function stopDaemon() {
  if (!fs.existsSync(PID_FILE)) {
    console.log('Daemon not running');
    return;
  }

  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
  console.log(`Stopping daemon (PID ${pid})...`);

  try {
    process.kill(pid, 'SIGTERM');
    cleanup();
    console.log('Daemon stopped');
  } catch (error) {
    console.error('Failed to stop daemon:', error.message);
    cleanup();
  }
}

function cleanup() {
  if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
}

function isDaemonRunning() {
  if (!fs.existsSync(PID_FILE)) return false;

  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
  try {
    process.kill(pid, 0); // Check if process exists
    return true;
  } catch {
    cleanup();
    return false;
  }
}

// Handle signals
process.on('SIGTERM', () => {
  console.log('[daemon] Received SIGTERM, shutting down...');
  cleanup();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[daemon] Received SIGINT, shutting down...');
  cleanup();
  process.exit(0);
});

// CLI
const command = process.argv[2];

switch (command) {
  case 'start':
    if (isDaemonRunning()) {
      console.log('Daemon already running');
    } else {
      startDaemon();
    }
    break;

  case 'stop':
    stopDaemon();
    break;

  case 'status':
    console.log(isDaemonRunning() ? 'Daemon is running' : 'Daemon is not running');
    break;

  default:
    console.log('Usage: heroku-daemon-poc.js {start|stop|status}');
    process.exit(1);
}
