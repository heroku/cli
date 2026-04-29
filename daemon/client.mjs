#!/usr/bin/env node
/**
 * Heroku CLI Daemon Client
 *
 * Communicates with the daemon server for fast command execution.
 * Falls back to direct execution if daemon is not available.
 */

const net = require('net');
const fs = require('fs');
const {spawn} = require('child_process');

const SOCKET_PATH = '/tmp/heroku-daemon.sock';
const PID_FILE = '/tmp/heroku-daemon.pid';
const DAEMON_SCRIPT = require.resolve('./server.js');

class HerokuDaemonClient {
  constructor() {
    this.useDaemon = !process.env.HEROKU_NO_DAEMON;
  }

  async execute(args) {
    // Check if daemon is preferred and available
    if (this.useDaemon) {
      if (this.isDaemonRunning()) {
        return await this.executeViaDaemon(args);
      } else if (this.shouldAutoStart()) {
        await this.startDaemon();
        return await this.executeViaDaemon(args);
      }
    }

    // Fall back to direct execution
    return await this.executeDirect(args);
  }

  isDaemonRunning() {
    if (!fs.existsSync(SOCKET_PATH)) {
      return false;
    }

    if (!fs.existsSync(PID_FILE)) {
      return false;
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  shouldAutoStart() {
    // Only auto-start for interactive terminals
    return process.stdout.isTTY && !process.env.CI;
  }

  async startDaemon() {
    if (process.env.DEBUG) {
      console.error('[client] Starting daemon...');
    }

    // Start daemon in detached mode
    const daemon = spawn(process.execPath, [DAEMON_SCRIPT], {
      detached: true,
      stdio: 'ignore',
    });

    daemon.unref();

    // Wait for daemon to be ready (max 2 seconds)
    const timeout = Date.now() + 2000;
    while (Date.now() < timeout) {
      if (this.isDaemonRunning()) {
        if (process.env.DEBUG) {
          console.error('[client] Daemon started');
        }
        return;
      }
      await this.sleep(50);
    }

    throw new Error('Failed to start daemon');
  }

  async executeViaDaemon(args) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const socket = net.connect(SOCKET_PATH);

      let response = '';

      socket.on('connect', () => {
        // Send request
        const request = {
          args,
          cwd: process.cwd(),
          env: {
            // Pass through important env vars
            HEROKU_API_KEY: process.env.HEROKU_API_KEY,
            HEROKU_HEADERS: process.env.HEROKU_HEADERS,
            HEROKU_HOST: process.env.HEROKU_HOST,
            DEBUG: process.env.DEBUG,
            NODE_ENV: process.env.NODE_ENV,
          },
        };

        socket.write(JSON.stringify(request) + '\n');
      });

      socket.on('data', (data) => {
        response += data.toString();
      });

      socket.on('end', () => {
        try {
          const result = JSON.parse(response);

          // Write output
          if (result.stdout) {
            process.stdout.write(result.stdout);
          }
          if (result.stderr) {
            process.stderr.write(result.stderr);
          }

          if (process.env.DEBUG) {
            const duration = Date.now() - startTime;
            console.error(`[client] Command completed via daemon in ${duration}ms (server: ${result.duration}ms)`);
          }

          process.exit(result.exitCode);
        } catch (err) {
          reject(new Error(`Failed to parse daemon response: ${err.message}`));
        }
      });

      socket.on('error', (err) => {
        if (process.env.DEBUG) {
          console.error(`[client] Daemon connection error: ${err.message}`);
        }
        // Fall back to direct execution
        this.executeDirect(args).then(resolve, reject);
      });

      socket.setTimeout(30000, () => {
        socket.destroy();
        reject(new Error('Daemon request timeout'));
      });
    });
  }

  async executeDirect(args) {
    if (process.env.DEBUG) {
      console.error('[client] Executing directly (no daemon)');
    }

    const startTime = Date.now();

    // Execute via node directly
    const binPath = require.resolve('../bin/run.js');
    const child = spawn(process.execPath, [binPath, ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });

    return new Promise((resolve, reject) => {
      child.on('exit', (code) => {
        if (process.env.DEBUG) {
          const duration = Date.now() - startTime;
          console.error(`[client] Direct execution completed in ${duration}ms`);
        }
        process.exit(code || 0);
      });

      child.on('error', reject);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute command
const args = process.argv.slice(2);
const client = new HerokuDaemonClient();

client.execute(args).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
