"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventSource = require("@heroku/eventsource");
const core_1 = require("@oclif/core");
const http_call_1 = require("http-call");
const url_1 = require("url");
const colorize_1 = require("./colorize");
const line_transform_1 = require("./line-transform");
async function readLogsV1(logplexURL) {
    const { response } = await http_call_1.default.stream(logplexURL);
    return new Promise(function (resolve, reject) {
        response.setEncoding('utf8');
        line_transform_1.default.setEncoding('utf8');
        response.pipe(line_transform_1.default);
        line_transform_1.default.on('data', line => core_1.CliUx.ux.log((0, colorize_1.default)(line)));
        response.on('end', resolve);
        response.on('error', reject);
    });
}
function readLogsV2(logplexURL) {
    return new Promise(function (resolve, reject) {
        const u = new url_1.URL(logplexURL);
        const isTail = u.searchParams.get('tail') === 'true';
        const userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run';
        const proxy = process.env.https_proxy || process.env.HTTPS_PROXY;
        const es = new EventSource(logplexURL, {
            proxy,
            headers: {
                'User-Agent': userAgent,
            },
        });
        es.addEventListener('error', function (err) {
            if (err && (err.status || err.message)) {
                const msg = (isTail && (err.status === 404 || err.status === 403)) ?
                    'Log stream timed out. Please try again.' :
                    `Logs eventsource failed with: ${err.status} ${err.message}`;
                reject(msg);
                es.close();
            }
            if (!isTail) {
                resolve();
                es.close();
            }
            // should only land here if --tail and no error status or message
        });
        es.addEventListener('message', function (e) {
            e.data.trim().split(/\n+/).forEach(line => {
                core_1.CliUx.ux.log((0, colorize_1.default)(line));
            });
        });
    });
}
function readLogs(logplexURL) {
    const u = new url_1.URL(logplexURL);
    if (u.searchParams.has('srv')) {
        return readLogsV1(logplexURL);
    }
    return readLogsV2(logplexURL);
}
async function logDisplayer(heroku, options) {
    process.stdout.on('error', err => {
        if (err.code === 'EPIPE') {
            process.exit(0);
        }
        else {
            core_1.CliUx.ux.error(err.stack, { exit: 1 });
        }
    });
    const response = await heroku.post(`/apps/${options.app}/log-sessions`, {
        body: {
            tail: options.tail,
            dyno: options.dyno,
            source: options.source,
            lines: options.lines,
        },
    });
    return readLogs(response.body.logplex_url);
}
exports.default = logDisplayer;
