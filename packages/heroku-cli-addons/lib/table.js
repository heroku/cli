'use strict';

let printf = require('printf');
let _      = require('lodash');

function table(data, options) {
    options     = options || {};
    let colSep  = options.colSep || ' ';
    let printRow = function(cells) {
        console.log(cells.join(colSep));
    };

    let columns = options.columns ||
        _.keys(data[0] || {})
        .map(function(k) {
            return {key: k};
        });

    for(let col of columns) {
        col.label     = col.label     || col.key.toString();
        col.after     = col.after     || function() {};
        col.formatter = col.formatter || function(cell) { return cell.toString(); };
        col.calcWidth = col.calcWidth || function(row) {
            return col.get(row).length;
        };

        col.get = function(row) {
            let getValue = typeof col.key === 'string'
                ? _.property(col.key)
                : col.key;
            return col.formatter(getValue(row));
        };
    };

    let afterFn = options.after || function(){};

    // analytics about data
    for(let row of data) {
        for(let col of columns) {
            col.width = Math.max(col.label.length, col.width || 0, col.calcWidth(row));
        };
    };

    // printing
    let headers = columns.map(function(col) { return printf('%-*s', col.label, col.width);});
    printRow(headers);
    printRow(headers.map(function(hdr) { return hdr.replace(/./g, '-'); }));

    for(let row of data) {
        let rowToPrint = columns.map(function(col) {
            return printf('%-*s', col.get(row), col.width);
        });

        printRow(rowToPrint);
    };
}


module.exports = table;
