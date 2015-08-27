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
    },
    printHeader: function(cells) {
        this.printRow(cells.map(_.ary(this.headerAnsi, 1)));
        this.printRow(cells.map(function(hdr) { return hdr.replace(/./g, '─'); }));
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
};

/**
 * Generates a Unicode table and feeds it into configured printer.
 *
 * Top-level arguments:
 *
 * @arg {Object[]} data - the records to format as a table.
 * @arg {Object} options - configuration for the table.
 *
 * @arg {Object[]} [options.columns] - Options for formatting and finding values for table columns.
 * @arg {function(string)} [options.headerAnsi] - Zero-width formattter for entire header.
 * @arg {string} [options.colSep] - Separator between columns.
 * @arg {function(row, options)} [options.after] - Function called after each row is printed.
 * @arg {function(string)} [options.printLine] - Function responsible for printing to terminal.
 * @arg {function(cells)} [options.printHeader] - Function to print header cells as a row.
 * @arg {function(cells)} [options.printRow] - Function to print cells as a row.
 *
 * @arg {function(row)|string} [options.columns[].key] - Path to the value in the row or function to retrieve the pre-formatted value for the cell.
 * @arg {function(string)} [options.columns[].label] - Header name for column.
 * @arg {function(string)} [options.columns[].ansi] - Zero-width formatter (e.g. ANSI coloring).
 * @arg {function(string)} [options.columns[].formatter] - Formatter for column value.
 * @arg {function(row)} [options.columns[].calcWidth] - Given the row whole; should return the width for the current column.
 * @arg {function(row)} [options.columns[].get] - Function to return a value to be presented in cell without formatting.
 *
 */
function table(data, options) {
    _.defaults(options, defaults);

    let columns = options.columns || _.keys(data[0] || {});

    if(typeof columns[0] === 'string') {
        columns = columns.map(function(k) { return {key: k}; });
    }

    let defaultsApplied = false;
    for(let row of data) {
        for(let col of columns) {
            if(!defaultsApplied) { _.defaults(col, colDefaults); }

            col.width = Math.max(
                col.label.length,
                col.width,
                col.calcWidth(row)
            );
        }
        defaultsApplied = true;
    }

    options.printHeader(columns.map(function(col) {
        return printf('%-*s', _.result(col, 'label'), col.width);
    }));

    for(let row of data) {
        let rowToPrint = columns.map(function(col) {
            return col.ansi(printf('%-*s', col.get(row), col.width));
        });

        options.printRow(rowToPrint);
        options.after(row, options);
    }
}

module.exports = table;
