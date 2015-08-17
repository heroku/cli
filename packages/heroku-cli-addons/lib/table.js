'use strict';

let stripAnsi = require('heroku-cli-util').color.stripColor;
let printf    = require('printf');
let _         = require('lodash');

function table(data, options) {
    options        = options             || {};
    let colSep     = options.colSep      || '  ';
    let after      = options.after       || _.noop;
    let headerAnsi = _.ary(options.headerAnsi || _.identity, 1);
    let printRow   = function(cells) {
        console.log(cells.join(colSep));
    };

    let columns = options.columns ||
        _.keys(data[0] || {})
        .map(function(k) {
            return {key: k};
        });

    for(let col of columns) {
        col.label     = col.label     || col.key.toString();
        col.formatter = col.formatter || function(cell) { return cell.toString(); };
        col.ansi      = col.ansi      || _.identity;
        col.calcWidth = col.calcWidth || function(row) {
            return stripAnsi(col.get(row)).length;
        };

        col.get = col.get || function(row) {
            let getValue = typeof col.key === 'string'
                ? _.property(col.key)
                : col.key;
            return col.formatter(getValue(row));
        };
    };

    // analytics about data
    for(let row of data) {
        for(let col of columns) {
            col.width = Math.max(col.label.length, col.width || 0, col.calcWidth(row));
        };
    };

    // printing
    let headers = columns.map(function(col) { return printf('%-*s', col.label, col.width);});
    printRow(headers.map(headerAnsi));
    printRow(headers.map(function(hdr) { return hdr.replace(/./g, '─'); }));

    for(let row of data) {
        let rowToPrint = columns.map(function(col) {
            return col.ansi(printf('%-*s', col.get(row), col.width));
        });

        printRow(rowToPrint);
        after(row, options);
    };
}


module.exports = table;
