#!/usr/bin/env node
/**
 * Heroku Daemon Management CLI
 *
 * Commands to control the Heroku CLI daemon.
 */

const fs = require('fs');
const {spawn, execFileSync} = require('child_process');

const SOCKET_PATH = '/tmp/heroku-daemon.sock';
const PID_FILE = '/tmp/heroku-daemon.pid';
const LOG_FILE = '/tmp/heroku-daemon.log';
const DAEMON_SCRIPT = require.resolve('./server.cjs');

class DaemonCLI {
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

  getPid() {
    if (!fs.existsSync(PID_FILE)) {
      return null;
    }
    return parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
  }

  cleanup() {
    try {
      if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
      if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    } catch (err) {
      console.error('Cleanup error:', err.message);
    }
  }

  start() {
    if (this.isDaemonRunning()) {
      console.log('Daemon is already running (PID:', this.getPid() + ')');
      return;
    }

    console.log('Starting Heroku CLI daemon...');

    const daemon = spawn(process.execPath, [DAEMON_SCRIPT], {
      detached: true,
      stdio: 'ignore',
    });

    daemon.unref();

    // Wait for daemon to start
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;

      if (this.isDaemonRunning()) {
        clearInterval(checkInterval);
        console.log('✓ Daemon started (PID:', this.getPid() + ')');
        console.log('  Socket:', SOCKET_PATH);
        console.log('  Log:', LOG_FILE);
      } else if (attempts > 40) {
        clearInterval(checkInterval);
        console.error('✗ Failed to start daemon');
        process.exit(1);
      }
    }, 50);
  }

  stop() {
    if (!this.isDaemonRunning()) {
      console.log('Daemon is not running');
      return;
    }

    const pid = this.getPid();
    console.log('Stopping daemon (PID:', pid + ')...');

    try {
      process.kill(pid, 'SIGTERM');

      // Wait for shutdown
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;

        if (!this.isDaemonRunning()) {
          clearInterval(checkInterval);
          console.log('✓ Daemon stopped');
        } else if (attempts > 20) {
          clearInterval(checkInterval);
          console.log('Force killing daemon...');
          try {
            process.kill(pid, 'SIGKILL');
            this.cleanup();
            console.log('✓ Daemon killed');
          } catch (err) {
            console.error('✗ Failed to kill daemon:', err.message);
          }
        }
      }, 100);
    } catch (err) {
      console.error('Error stopping daemon:', err.message);
      this.cleanup();
    }
  }

  restart() {
    console.log('Restarting daemon...');
    this.stop();

    // Wait a bit for cleanup
    setTimeout(() => {
      this.start();
    }, 500);
  }

  status() {
    if (this.isDaemonRunning()) {
      const pid = this.getPid();
      console.log('✓ Daemon is running');
      console.log('  PID:', pid);
      console.log('  Socket:', SOCKET_PATH);
      console.log('  Log:', LOG_FILE);

      // Get memory usage (macOS)
      try {
        const ps = execFileSync('ps', ['-o', 'rss=', '-p', pid.toString()]).toString().trim();
        const memoryMB = Math.round(parseInt(ps) / 1024);
        console.log('  Memory:', memoryMB + ' MB');
      } catch {
        // Can't get memory info
      }
    } else {
      console.log('✗ Daemon is not running');
    }
  }

  logs() {
    if (!fs.existsSync(LOG_FILE)) {
      console.log('No log file found');
      return;
    }

    // Tail the log file
    const tail = spawn('tail', ['-f', LOG_FILE], {
      stdio: 'inherit',
    });

    process.on('SIGINT', () => {
      tail.kill();
      process.exit(0);
    });
  }

  showHelp() {
    console.log(`
Heroku CLI Daemon Management

Usage:
  heroku daemon:start    Start the daemon
  heroku daemon:stop     Stop the daemon
  heroku daemon:restart  Restart the daemon
  heroku daemon:status   Show daemon status
  heroku daemon:logs     Show daemon logs (tail -f)

Environment Variables:
  HEROKU_NO_DAEMON=1     Disable daemon and use direct execution
  DEBUG=1                Show debug output

Files:
  Socket: ${SOCKET_PATH}
  PID:    ${PID_FILE}
  Log:    ${LOG_FILE}
    `.trim());
  }
}

// Main
const cli = new DaemonCLI();
const command = process.argv[2];

switch (command) {
  case 'start':
    cli.start();
    break;
  case 'stop':
    cli.stop();
    break;
  case 'restart':
    cli.restart();
    break;
  case 'status':
    cli.status();
    break;
  case 'logs':
    cli.logs();
    break;
  case 'help':
  case '--help':
  case '-h':
    cli.showHelp();
    break;
  default:
    console.error('Unknown command:', command);
    cli.showHelp();
    process.exit(1);
}
