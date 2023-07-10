"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLORS = void 0;
const color_1 = require("@heroku-cli/color");
const core_1 = require("@oclif/core");
exports.COLORS = [
    s => color_1.default.yellow(s),
    s => color_1.default.green(s),
    s => color_1.default.cyan(s),
    s => color_1.default.magenta(s),
    s => color_1.default.blue(s),
    s => color_1.default.bold.green(s),
    s => color_1.default.bold.cyan(s),
    s => color_1.default.bold.magenta(s),
    s => color_1.default.bold.yellow(s),
    s => color_1.default.bold.blue(s),
];
const assignedColors = {};
function getColorForIdentifier(i) {
    i = i.split('.')[0];
    if (assignedColors[i])
        return assignedColors[i];
    assignedColors[i] = exports.COLORS[Object.keys(assignedColors).length % exports.COLORS.length];
    return assignedColors[i];
}
// get initial colors so they are the same every time
getColorForIdentifier('run');
getColorForIdentifier('router');
getColorForIdentifier('web');
getColorForIdentifier('postgres');
getColorForIdentifier('heroku-postgres');
const lineRegex = /^(.*?\[([\w-]+)([\d.]+)?]:)(.*)?$/;
const red = color_1.default.red;
const dim = i => color_1.default.dim(i);
const other = dim;
const path = i => color_1.default.green(i);
const method = i => color_1.default.bold.magenta(i);
const status = code => {
    if (code < 200)
        return code;
    if (code < 300)
        return color_1.default.green(code);
    if (code < 400)
        return color_1.default.cyan(code);
    if (code < 500)
        return color_1.default.yellow(code);
    if (code < 600)
        return color_1.default.red(code);
    return code;
};
const ms = (s) => {
    const ms = Number.parseInt(s, 10);
    if (!ms)
        return s;
    if (ms < 100)
        return color_1.default.greenBright(s);
    if (ms < 500)
        return color_1.default.green(s);
    if (ms < 5000)
        return color_1.default.yellow(s);
    if (ms < 10000)
        return color_1.default.yellowBright(s);
    return color_1.default.red(s);
};
function colorizeRouter(body) {
    const encodeColor = ([k, v]) => {
        switch (k) {
            case 'at': return [k, v === 'error' ? red(v) : other(v)];
            case 'code': return [k, red.bold(v)];
            case 'method': return [k, method(v)];
            case 'dyno': return [k, getColorForIdentifier(v)(v)];
            case 'status': return [k, status(v)];
            case 'path': return [k, path(v)];
            case 'connect': return [k, ms(v)];
            case 'service': return [k, ms(v)];
            default: return [k, other(v)];
        }
    };
    try {
        const tokens = body.split(/\s+/).map(sub => {
            const parts = sub.split('=');
            if (parts.length === 1) {
                return parts;
            }
            if (parts.length === 2) {
                return encodeColor(parts);
            }
            return encodeColor([parts[0], parts.splice(1).join('=')]);
        });
        return tokens.map(([k, v]) => {
            if (v === undefined) {
                return other(k);
            }
            return other(k + '=') + v;
        }).join(' ');
    }
    catch (error) {
        core_1.CliUx.ux.warn(error);
        return body;
    }
}
const state = (s) => {
    switch (s) {
        case 'down': return red(s);
        case 'up': return color_1.default.greenBright(s);
        case 'starting': return color_1.default.yellowBright(s);
        case 'complete': return color_1.default.greenBright(s);
        default: return s;
    }
};
function colorizeRun(body) {
    try {
        if (body.match(/^Stopping all processes with SIGTERM$/))
            return color_1.default.red(body);
        const starting = body.match(/^(Starting process with command )(`.+`)(by user )?(.*)?$/);
        if (starting) {
            return [
                starting[1],
                color_1.default.cmd(starting[2]),
                starting[3] || '',
                color_1.default.green(starting[4] || ''),
            ].join('');
        }
        const stateChange = body.match(/^(State changed from )(\w+)( to )(\w+)$/);
        if (stateChange) {
            return [
                stateChange[1],
                state(stateChange[2]),
                stateChange[3] || '',
                state(stateChange[4] || ''),
            ].join('');
        }
        const exited = body.match(/^(Process exited with status )(\d+)$/);
        if (exited) {
            return [
                exited[1],
                exited[2] === '0' ? color_1.default.greenBright(exited[2]) : color_1.default.red(exited[2]),
            ].join('');
        }
    }
    catch (error) {
        core_1.CliUx.ux.warn(error);
    }
    return body;
}
function colorizeWeb(body) {
    try {
        if (body.match(/^Unidling$/))
            return color_1.default.yellow(body);
        if (body.match(/^Restarting$/))
            return color_1.default.yellow(body);
        if (body.match(/^Stopping all processes with SIGTERM$/))
            return color_1.default.red(body);
        const starting = body.match(/^(Starting process with command )(`.+`)(by user )?(.*)?$/);
        if (starting) {
            return [
                (starting[1]),
                color_1.default.cmd(starting[2]),
                (starting[3] || ''),
                color_1.default.green(starting[4] || ''),
            ].join('');
        }
        const exited = body.match(/^(Process exited with status )(\d+)$/);
        if (exited) {
            return [
                exited[1],
                exited[2] === '0' ? color_1.default.greenBright(exited[2]) : color_1.default.red(exited[2]),
            ].join('');
        }
        const stateChange = body.match(/^(State changed from )(\w+)( to )(\w+)$/);
        if (stateChange) {
            return [
                stateChange[1],
                state(stateChange[2]),
                stateChange[3],
                state(stateChange[4]),
            ].join('');
        }
        const apache = body.match(/^(\d+\.\d+\.\d+\.\d+ -[^-]*- \[[^\]]+] ")(\w+)( )([^ ]+)( HTTP\/\d+\.\d+" )(\d+)( .+$)/);
        if (apache) {
            const [, ...tokens] = apache;
            return [
                other(tokens[0]),
                method(tokens[1]),
                other(tokens[2]),
                path(tokens[3]),
                other(tokens[4]),
                status(tokens[5]),
                other(tokens[6]),
            ].join('');
        }
        const route = body.match(/^(.* ")(\w+)(.+)(HTTP\/\d+\.\d+" .*)$/);
        if (route) {
            return [
                route[1],
                method(route[2]),
                path(route[3]),
                route[4],
            ].join('');
        }
    }
    catch (error) {
        core_1.CliUx.ux.warn(error);
    }
    return body;
}
function colorizeAPI(body) {
    if (body.match(/^Build succeeded$/))
        return color_1.default.greenBright(body);
    // eslint-disable-next-line unicorn/prefer-starts-ends-with
    if (body.match(/^Build failed/))
        return color_1.default.red(body);
    const build = body.match(/^(Build started by user )(.+)$/);
    if (build) {
        return [
            build[1],
            color_1.default.green(build[2]),
        ].join('');
    }
    const deploy = body.match(/^(Deploy )([\w]+)( by user )(.+)$/);
    if (deploy) {
        return [
            deploy[1],
            color_1.default.cyan(deploy[2]),
            deploy[3],
            color_1.default.green(deploy[4]),
        ].join('');
    }
    const release = body.match(/^(Release )(v[\d]+)( created by user )(.+)$/);
    if (release) {
        return [
            release[1],
            color_1.default.magenta(release[2]),
            release[3],
            color_1.default.green(release[4]),
        ].join('');
    }
    const starting = body.match(/^(Starting process with command )(`.+`)(by user )?(.*)?$/);
    if (starting) {
        return [
            (starting[1]),
            color_1.default.cmd(starting[2]),
            (starting[3] || ''),
            color_1.default.green(starting[4] || ''),
        ].join('');
    }
    return body;
}
function colorizeRedis(body) {
    if (body.match(/source=\w+ sample#/)) {
        body = dim(body);
    }
    return body;
}
function colorizePG(body) {
    const create = body.match(/^(\[DATABASE].*)(CREATE TABLE)(.*)$/);
    if (create) {
        return [
            other(create[1]),
            color_1.default.magenta(create[2]),
            color_1.default.cyan(create[3]),
        ].join('');
    }
    if (body.match(/source=\w+ sample#/)) {
        body = dim(body);
    }
    return body;
}
function colorize(line) {
    if (process.env.HEROKU_LOGS_COLOR === '0')
        return line;
    const parsed = line.match(lineRegex);
    if (!parsed)
        return line;
    const header = parsed[1];
    const identifier = parsed[2];
    let body = (parsed[4] || '').trim();
    switch (identifier) {
        case 'api':
            body = colorizeAPI(body);
            break;
        case 'router':
            body = colorizeRouter(body);
            break;
        case 'run':
            body = colorizeRun(body);
            break;
        case 'web':
            body = colorizeWeb(body);
            break;
        case 'heroku-redis':
            body = colorizeRedis(body);
            break;
        case 'heroku-postgres':
        case 'postgres':
            body = colorizePG(body);
    }
    return getColorForIdentifier(identifier)(header) + ' ' + body;
}
exports.default = colorize;
