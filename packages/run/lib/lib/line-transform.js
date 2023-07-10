"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream = require("stream");
// this splits a stream into lines
const transform = new stream.Transform({ decodeStrings: false });
transform._transform = function (chunk, _encoding, next) {
    let data = chunk;
    if (this._lastLineData)
        data = this._lastLineData + data;
    const lines = data.split('\n');
    this._lastLineData = lines.splice(lines.length - 1, 1)[0];
    lines.forEach(this.push.bind(this));
    next();
};
transform._flush = function (done) {
    if (this._lastLineData)
        this.push(this._lastLineData);
    this._lastLineData = null;
    done();
};
exports.default = transform;
