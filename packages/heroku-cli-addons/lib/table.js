'use strict';

let stripAnsi = require('heroku-cli-util').color.stripColor;
let printf    = require('printf');
let _         = require('lodash');

let defaults = {
    colSep:     '  ',
    after:      _.noop,
    headerAnsi: _.identity,
    printLine:  console.log,
    printRow:   function(cells) {
        this.printLine(cells.join(this.colSep));
    }
};

let colDefaults = {
    ansi:      _.identity,
    formatter: _.partialRight(_.result, 'toString'),
    width:     0,
    label:     function() { return this.key.toString(); },

    calcWidth: function(row) {
        return stripAnsi(this.get(row)).length;
    },

    get: function(row) {
        return this.formatter(_.get(row, _.result(this, 'key')));
    },
}


function table(data, options) {
    _.defaults(options, defaults);

    let columns = options.columns ||
        _.keys(data[0] || {})
        .map(function(k) {
            return {key: k};
        });

    for(let col of columns) {
        _.defaults(col, colDefaults);
    };

    // analytics about data
    for(let row of data) {
        for(let col of columns) {
            col.width = Math.max(col.label.length, col.width, col.calcWidth(row));
        };
    };

    // printing
    let headers = columns.map(function(col) {
        return printf('%-*s', _.result(col, 'label'), col.width);
    });

    options.printRow(headers.map(_.ary(options.headerAnsi, 1)));
    options.printRow(headers.map(function(hdr) { return hdr.replace(/./g, '─'); }));

    for(let row of data) {
        let rowToPrint = columns.map(function(col) {
            return col.ansi(printf('%-*s', col.get(row), col.width));
        });

        options.printRow(rowToPrint);
        options.after(row, options);
    };
}

module.exports = table;
