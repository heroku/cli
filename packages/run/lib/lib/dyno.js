"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = require("@heroku-cli/color");
const notifications_1 = require("@heroku-cli/notifications");
const child_process_1 = require("child_process");
const core_1 = require("@oclif/core");
const debug_1 = require("debug");
const https = require("https");
const net = require("net");
const stream_1 = require("stream");
const tls = require("tls");
const tty = require("tty");
const url_1 = require("url");
const helpers_1 = require("../lib/helpers");
const debug = (0, debug_1.default)('heroku:run');
const wait = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms));
class Dyno extends stream_1.Duplex {
    constructor(opts) {
        super();
        this.opts = opts;
        this.cork();
        this.opts = opts;
        this.heroku = opts.heroku;
        if (this.opts.showStatus === undefined) {
            this.opts.showStatus = true;
        }
    }
    get _useSSH() {
        if (this.uri) {
            /* tslint:disable:no-http-string */
            return this.uri.protocol === 'http:' || this.uri.protocol === 'https:';
            /* tslint:enable:no-http-string */
        }
    }
    /**
     * Starts the dyno
     */
    async start() {
        this._startedAt = Date.now();
        if (this.opts.showStatus) {
            core_1.CliUx.ux.action.start(`Running ${color_1.default.cyan.bold(this.opts.command)} on ${color_1.default.app(this.opts.app)}`);
        }
        await this._doStart();
    }
    async _doStart(retries = 2) {
        const command = this.opts['exit-code'] ? `${this.opts.command}; echo "\uFFFF heroku-command-exit-status: $?"` : this.opts.command;
        try {
            const dyno = await this.heroku.post(this.opts.dyno ? `/apps/${this.opts.app}/dynos/${this.opts.dyno}` : `/apps/${this.opts.app}/dynos`, {
                headers: {
                    Accept: this.opts.dyno ? 'application/vnd.heroku+json; version=3.run-inside' : 'application/vnd.heroku+json; version=3',
                },
                body: {
                    command,
                    attach: this.opts.attach,
                    size: this.opts.size,
                    type: this.opts.type,
                    env: this._env(),
                    force_no_tty: this.opts['no-tty'],
                },
            });
            this.dyno = dyno.body;
            if (this.opts.attach || this.opts.dyno) {
                if (this.dyno.name && this.opts.dyno === undefined) {
                    this.opts.dyno = this.dyno.name;
                }
                await this.attach();
            }
            else if (this.opts.showStatus) {
                core_1.CliUx.ux.action.stop(this._status('done'));
            }
        }
        catch (error) {
            // Currently the runtime API sends back a 409 in the event the
            // release isn't found yet. API just forwards this response back to
            // the client, so we'll need to retry these. This usually
            // happens when you create an app and immediately try to run a
            // one-off dyno. No pause between attempts since this is
            // typically a very short-lived condition.
            if (error.statusCode === 409 && retries > 0) {
                return this._doStart(retries - 1);
            }
            throw error;
        }
        finally {
            core_1.CliUx.ux.action.stop();
        }
    }
    // Attaches stdin/stdout to dyno
    attach() {
        this.pipe(process.stdout);
        if (this.dyno && this.dyno.attach_url) {
            this.uri = new url_1.URL(this.dyno.attach_url);
            this.legacyUri = (0, url_1.parse)(this.dyno.attach_url);
        }
        if (this._useSSH) {
            this.p = this._ssh();
        }
        else {
            this.p = this._rendezvous();
        }
        return this.p.then(() => {
            this.end();
        });
    }
    _rendezvous() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            if (this.opts.showStatus) {
                core_1.CliUx.ux.action.status = this._status('starting');
            }
            const c = tls.connect(parseInt(this.uri.port, 10), this.uri.hostname, {
                rejectUnauthorized: this.heroku.options.rejectUnauthorized,
            });
            c.setTimeout(1000 * 60 * 60);
            c.setEncoding('utf8');
            c.on('connect', () => {
                debug('connect');
                const pathnameWithSearchParams = this.uri.pathname + this.uri.search;
                c.write(pathnameWithSearchParams.substr(1) + '\r\n', () => {
                    if (this.opts.showStatus) {
                        core_1.CliUx.ux.action.status = this._status('connecting');
                    }
                });
            });
            c.on('data', this._readData(c));
            c.on('close', () => {
                debug('close');
                this.opts['exit-code'] ? this.reject('No exit code returned') : this.resolve();
                if (this.unpipeStdin) {
                    this.unpipeStdin();
                }
            });
            c.on('error', this.reject);
            c.on('timeout', () => {
                debug('timeout');
                c.end();
                this.reject(new Error('timed out'));
            });
            process.once('SIGINT', () => c.end());
        });
    }
    async _ssh(retries = 20) {
        const interval = 1000;
        try {
            const { body: dyno } = await this.heroku.get(`/apps/${this.opts.app}/dynos/${this.opts.dyno}`);
            this.dyno = dyno;
            core_1.CliUx.ux.action.stop(this._status(this.dyno.state));
            if (this.dyno.state === 'starting' || this.dyno.state === 'up') {
                return this._connect();
            }
            await wait(interval);
            return this._ssh();
        }
        catch (error) {
            // the API sometimes responds with a 404 when the dyno is not yet ready
            if (error.http.statusCode === 404 && retries > 0) {
                return this._ssh(retries - 1);
            }
            throw error;
        }
    }
    _connect() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            const options = this.legacyUri;
            options.headers = { Connection: 'Upgrade', Upgrade: 'tcp' };
            options.rejectUnauthorized = false;
            const r = https.request(options);
            r.end();
            r.on('error', this.reject);
            r.on('upgrade', (_, remote) => {
                const s = net.createServer(client => {
                    client.on('end', () => {
                        s.close();
                        this.resolve();
                    });
                    client.on('connect', () => s.close());
                    client.on('error', () => this.reject);
                    remote.on('error', () => this.reject);
                    client.setNoDelay(true);
                    remote.setNoDelay(true);
                    remote.on('data', data => client.write(data));
                    client.on('data', data => remote.write(data));
                });
                s.listen(0, 'localhost', () => this._handle(s));
                // abort the request when the local pipe server is closed
                s.on('close', () => {
                    r.abort();
                });
            });
        });
    }
    _handle(localServer) {
        const addr = localServer.address();
        const host = addr.address;
        const port = addr.port;
        let lastErr = '';
        // does not actually uncork but allows error to be displayed when attempting to read
        this.uncork();
        if (this.opts.listen) {
            core_1.CliUx.ux.log(`listening on port ${host}:${port} for ssh client`);
        }
        else {
            const params = [host, '-p', port.toString(), '-oStrictHostKeyChecking=no', '-oUserKnownHostsFile=/dev/null', '-oServerAliveInterval=20'];
            // Debug SSH
            if (this._isDebug()) {
                params.push('-vvv');
            }
            const stdio = [0, 1, 'pipe'];
            if (this.opts['exit-code']) {
                stdio[1] = 'pipe';
                if (process.stdout.isTTY) {
                    // force tty
                    params.push('-t');
                }
            }
            const sshProc = (0, child_process_1.spawn)('ssh', params, { stdio });
            // only receives stdout with --exit-code
            if (sshProc.stdout) {
                sshProc.stdout.setEncoding('utf8');
                sshProc.stdout.on('data', this._readData());
            }
            sshProc.stderr.on('data', data => {
                lastErr = data;
                // supress host key and permission denied messages
                if (this._isDebug() || (data.includes("Warning: Permanently added '[127.0.0.1]") && data.includes('Permission denied (publickey).'))) {
                    process.stderr.write(data);
                }
            });
            sshProc.on('close', () => {
                // there was a problem connecting with the ssh key
                if (lastErr.length > 0 && lastErr.includes('Permission denied')) {
                    const msgs = ['There was a problem connecting to the dyno.'];
                    if (process.env.SSH_AUTH_SOCK) {
                        msgs.push('Confirm that your ssh key is added to your agent by running `ssh-add`.');
                    }
                    msgs.push('Check that your ssh key has been uploaded to heroku with `heroku keys:add`.');
                    msgs.push(`See ${color_1.default.cyan('https://devcenter.heroku.com/articles/one-off-dynos#shield-private-spaces')}`);
                    core_1.CliUx.ux.error(msgs.join('\n'));
                }
                // cleanup local server
                localServer.close();
            });
            this.p
                .then(() => sshProc.kill())
                .catch(() => sshProc.kill());
        }
        this._notify();
    }
    _isDebug() {
        const debug = process.env.HEROKU_DEBUG;
        return debug && (debug === '1' || debug.toUpperCase() === 'TRUE');
    }
    _env() {
        const c = this.opts.env ? (0, helpers_1.buildEnvFromFlag)(this.opts.env) : {};
        c.TERM = process.env.TERM;
        if (tty.isatty(1)) {
            c.COLUMNS = process.stdout.columns;
            c.LINES = process.stdout.rows;
        }
        return c;
    }
    _status(status) {
        const size = this.dyno.size ? ` (${this.dyno.size})` : '';
        return `${status}, ${this.dyno.name || this.opts.dyno}${size}`;
    }
    _readData(c) {
        let firstLine = true;
        return data => {
            debug('input: %o', data);
            // discard first line
            if (c && firstLine) {
                if (this.opts.showStatus)
                    core_1.CliUx.ux.action.stop(this._status('up'));
                firstLine = false;
                this._readStdin(c);
                return;
            }
            this._notify();
            // carriage returns break json parsing of output
            if (!process.stdout.isTTY) {
                // eslint-disable-next-line no-control-regex
                data = data.replace(new RegExp('\r\n', 'g'), '\n');
            }
            const exitCode = data.match(/\uFFFF heroku-command-exit-status: (\d+)/m);
            if (exitCode) {
                debug('got exit code: %d', exitCode[1]);
                this.push(data.replace(/^\uFFFF heroku-command-exit-status: \d+$\n?/m, ''));
                const code = parseInt(exitCode[1], 10);
                if (code === 0) {
                    this.resolve();
                }
                else {
                    const err = new Error(`Process exited with code ${color_1.default.red(code.toString())}`);
                    err.exitCode = code;
                    this.reject(err);
                }
                return;
            }
            this.push(data);
        };
    }
    _readStdin(c) {
        this.input = c;
        const stdin = process.stdin;
        stdin.setEncoding('utf8');
        // without this the CLI will hang on rake db:migrate
        // until a character is pressed
        if (stdin.unref) {
            stdin.unref();
        }
        if (!this.opts['no-tty'] && tty.isatty(0)) {
            stdin.setRawMode(true);
            stdin.pipe(c);
            let sigints = [];
            stdin.on('data', function (c) {
                if (c === '\u0003') {
                    sigints.push(Date.now());
                }
                sigints = sigints.filter(d => d > Date.now() - 1000);
                if (sigints.length >= 4) {
                    core_1.CliUx.ux.error('forcing dyno disconnect', { exit: 1 });
                }
            });
        }
        else {
            stdin.pipe(new stream_1.Transform({
                objectMode: true,
                transform: (chunk, _, next) => c.write(chunk, next),
                // eslint-disable-next-line unicorn/no-hex-escape
                flush: done => c.write('\x04', done),
            }));
        }
        this.uncork();
    }
    _read() {
        if (this.useSSH) {
            throw new Error('Cannot read stream from ssh dyno');
        }
        // do not need to do anything to handle Readable interface
    }
    _write(chunk, encoding, callback) {
        if (this.useSSH) {
            throw new Error('Cannot write stream to ssh dyno');
        }
        if (!this.input)
            throw new Error('no input');
        this.input.write(chunk, encoding, callback);
    }
    _notify() {
        try {
            if (this._notified)
                return;
            this._notified = true;
            if (!this.opts.notify)
                return;
            // only show notifications if dyno took longer than 20 seconds to start
            if (Date.now() - this._startedAt < 1000 * 20)
                return;
            const notification = {
                title: this.opts.app,
                subtitle: `heroku run ${this.opts.command}`,
                message: 'dyno is up',
                // sound: true
            };
            (0, notifications_1.notify)(notification);
        }
        catch (error) {
            core_1.CliUx.ux.warn(error);
        }
    }
}
exports.default = Dyno;
