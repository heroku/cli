"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fork = void 0;
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
// depending if this is being ran before or after compilation
// we need to check for `.ts` and `.js` extensions and use
// the appropriate one.
function getForemanScriptPath() {
    const file = 'run-foreman';
    const withJsExtension = path.join(__dirname, file + '.js');
    const withTsExtension = path.join(__dirname, file + '.ts');
    if (fs.existsSync(withJsExtension)) {
        return withJsExtension;
    }
    if (fs.existsSync(withTsExtension)) {
        return withTsExtension;
    }
    throw new Error(`Path to ${file} not found`);
}
function fork(argv) {
    const script = getForemanScriptPath();
    const nf = (0, child_process_1.fork)(script, argv, { stdio: 'inherit' });
    return new Promise(resolve => {
        nf.on('exit', function (code) {
            if (code !== 0)
                process.exit(code);
            resolve();
        });
    });
}
exports.fork = fork;
