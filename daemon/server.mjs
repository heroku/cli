#!/usr/bin/env node
/**
 * Heroku CLI Daemon Server
 *
 * Keeps the CLI loaded in memory for instant command execution.
 * Pre-loads all oclif framework code and dependencies.
 */

const net = require('net');
const fs = require('fs');
const path = require('path');
const {execute, settings, flush} = require('@oclif/core');

const SOCKET_PATH = '/tmp/heroku-daemon.sock';
const PID_FILE = '/tmp/heroku-daemon.pid';
const LOG_FILE = '/tmp/heroku-daemon.log';
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

class HerokuDaemon {
  constructor() {
    this.commandCount = 0;
    this.lastCommandTime = Date.now();
    this.startTime = Date.now();
    this.server = null;
    this.idleTimer = null;

    this.setupLogging();
  }

  setupLogging() {
    // Redirect stdout/stderr to log file
    const logStream = fs.createWriteStream(LOG_FILE, {flags: 'a'});

    this.log = (msg) => {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] ${msg}\n`;
      logStream.write(line);
      // Also write to console if in debug mode
      if (process.env.DEBUG) {
        process.stdout.write(line);
      }
    };

    this.error = (msg) => {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] ERROR: ${msg}\n`;
      logStream.write(line);
      process.stderr.write(line);
    };
  }

  async start() {
    this.log('Starting Heroku CLI daemon...');

    // Check if already running
    if (this.isDaemonRunning()) {
      this.error('Daemon already running');
      process.exit(1);
    }

    // Clean up old socket
    this.cleanup();

    // Pre-load oclif framework
    this.log('Pre-loading oclif framework and dependencies...');
    const preloadStart = Date.now();

    // Enable performance tracking
    if (process.env.DEBUG?.includes('oclif:perf')) {
      settings.performanceEnabled = true;
    }

    this.log(`Pre-load completed in ${Date.now() - preloadStart}ms`);

    // Create Unix socket server
    this.server = net.createServer((socket) => this.handleConnection(socket));

    this.server.listen(SOCKET_PATH, () => {
      this.log(`Daemon ready! Listening on ${SOCKET_PATH}`);
      this.log(`PID: ${process.pid}`);

      // Make socket accessible
      fs.chmodSync(SOCKET_PATH, 0o600);

      // Write PID file
      fs.writeFileSync(PID_FILE, process.pid.toString());
    });

    this.server.on('error', (err) => {
      this.error(`Server error: ${err.message}`);
      this.shutdown();
    });

    // Setup idle timeout
    this.resetIdleTimer();

    // Setup signal handlers
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
    process.on('uncaughtException', (err) => {
      this.error(`Uncaught exception: ${err.stack}`);
      this.shutdown();
    });
  }

  async handleConnection(socket) {
    this.commandCount++;
    const commandId = this.commandCount;

    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();

      // Check if we have a complete message (ends with newline)
      if (!buffer.endsWith('\n')) {
        return;
      }

      const startTime = Date.now();

      try {
        const request = JSON.parse(buffer.trim());
        const {args, cwd, env} = request;

        this.log(`[${commandId}] Command: ${args.join(' ')}`);

        // Change working directory if specified
        const originalCwd = process.cwd();
        if (cwd) {
          process.chdir(cwd);
        }

        // Merge environment variables
        const originalEnv = {...process.env};
        if (env) {
          Object.assign(process.env, env);
        }

        // Capture stdout/stderr
        const output = {stdout: '', stderr: ''};
        const originalStdoutWrite = process.stdout.write.bind(process.stdout);
        const originalStderrWrite = process.stderr.write.bind(process.stderr);

        process.stdout.write = (chunk) => {
          output.stdout += chunk.toString();
          return true;
        };

        process.stderr.write = (chunk) => {
          output.stderr += chunk.toString();
          return true;
        };

        let exitCode = 0;
        let error = null;

        try {
          // Execute oclif command
          await execute(args, {dir: import.meta.url});
          await flush();
        } catch (err) {
          exitCode = err.exitCode || 1;
          error = err.message;
          this.log(`[${commandId}] Error: ${err.message}`);
        } finally {
          // Restore stdout/stderr
          process.stdout.write = originalStdoutWrite;
          process.stderr.write = originalStderrWrite;

          // Restore environment
          process.env = originalEnv;

          // Restore working directory
          if (cwd) {
            process.chdir(originalCwd);
          }
        }

        const duration = Date.now() - startTime;
        this.log(`[${commandId}] Completed in ${duration}ms (exit code: ${exitCode})`);

        // Send response
        const response = {
          exitCode,
          stdout: output.stdout,
          stderr: output.stderr,
          error,
          duration,
        };

        socket.write(JSON.stringify(response) + '\n');
      } catch (err) {
        this.error(`[${commandId}] Failed to process request: ${err.message}`);

        const response = {
          exitCode: 1,
          stdout: '',
          stderr: `Daemon error: ${err.message}\n`,
          error: err.message,
          duration: Date.now() - startTime,
        };

        socket.write(JSON.stringify(response) + '\n');
      }

      socket.end();
      this.lastCommandTime = Date.now();
      this.resetIdleTimer();
    });

    socket.on('error', (err) => {
      this.error(`Socket error: ${err.message}`);
    });
  }

  resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      const uptime = Math.round((Date.now() - this.startTime) / 1000);
      this.log(`Idle timeout reached after ${uptime}s (${this.commandCount} commands executed)`);
      this.shutdown();
    }, IDLE_TIMEOUT);
  }

  isDaemonRunning() {
    if (!fs.existsSync(PID_FILE)) {
      return false;
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      this.cleanup();
      return false;
    }
  }

  cleanup() {
    try {
      if (fs.existsSync(SOCKET_PATH)) {
        fs.unlinkSync(SOCKET_PATH);
      }
      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
      }
    } catch (err) {
      this.error(`Cleanup error: ${err.message}`);
    }
  }

  shutdown() {
    this.log('Shutting down daemon...');

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    if (this.server) {
      this.server.close();
    }

    this.cleanup();

    const uptime = Math.round((Date.now() - this.startTime) / 1000);
    this.log(`Daemon stopped (uptime: ${uptime}s, commands: ${this.commandCount})`);

    process.exit(0);
  }
}

// Start daemon
const daemon = new HerokuDaemon();
daemon.start().catch(err => {
  console.error('Failed to start daemon:', err);
  process.exit(1);
});
