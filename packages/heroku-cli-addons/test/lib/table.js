'use strict';

let _table       = require('../../lib/table');
let expectOutput = require('../util').expectOutput;

function table(data, options) {
    let out = '';
    options = (options || {});
    options.printLine = function(str) {
        out += str + '\n';
    };

    _table(data, options);

    return out;
}

describe('table()', function() {
    it('takes simple data', function() {
        let out = table([{Name: 'Jane Doe', Country: 'Australia'},
                         {Name: 'Bob Smith', Country: 'USA'}]);

        expectOutput(out, `
                     Name       Country
                     ─────────  ─────────
                     Jane Doe   Australia
                     Bob Smith  USA`);
    });

    it('takes a simple column list', function() {
        let out = table([{Name: 'Jane Doe', Country: 'Australia'},
                         {Name: 'Bob Smith', Country: 'USA'}],

                        {columns: ['Name']});
        expectOutput(out, `
                     Name
                     ─────────
                     Jane Doe
                     Bob Smith`);
    });

    it('takes a specific column key list', function() {
        let out = table([{n: 'Jane Doe', c: 'Australia'},
                         {n: 'Bob Smith', c: 'USA'}],

                        {columns: [{key: 'n'},
                                   {key: 'c'}]});

        expectOutput(out, `
                     n          c
                     ─────────  ─────────
                     Jane Doe   Australia
                     Bob Smith  USA`);
    });

    it('lets header names be customized', function() {
        let out = table([{n: 'Jane Doe', c: 'Australia'},
                         {n: 'Bob Smith', c: 'USA'}],

                        {columns: [{key: 'n', label: 'Name'},
                                   {key: 'c', label: 'Country'}]});

        expectOutput(out, `
                     Name       Country
                     ─────────  ─────────
                     Jane Doe   Australia
                     Bob Smith  USA`);
    });

    it('takes custom column separator', function() {
        let out = table([{Name: 'Jane Doe', Country: 'Australia'},
                         {Name: 'Bob Smith', Country: 'USA'}],

                        {colSep: ' | '});

        expectOutput(out, `
                     Name      | Country
                     ───────── | ─────────
                     Jane Doe  | Australia
                     Bob Smith | USA`);
    });

    it('takes custom column formatters', function() {
        function initials(name) {
            return name.match(/\b\w/g).join('. ') + '.';
        }

        function highlight(str) {
            return `[[${str.toUpperCase()}]]`;
        }

        let out = table([{Name: 'Jane Doe', Country: 'Australia'},
                         {Name: 'Bob Smith', Country: 'USA'}],

                        {columns: [{key: 'Name'},
                                   {key: 'Name', label: 'Initials', format: initials},
                                   {key: 'Country', format: highlight}]});

        expectOutput(out, `
                     Name       Initials  Country
                     ─────────  ────────  ─────────────
                     Jane Doe   J. D.     [[AUSTRALIA]]
                     Bob Smith  B. S.     [[USA]]`);
    });

    it('takes nested keys', function() {
        function fmtCountry(country) {
            return `${country.name} (${country.code})`;
        }

        let out = table([{name: {given: 'Jane', family: 'Doe'},
                          country: {name: 'Australia', code: 'AUS'}},
                         {name: {given: 'Bob', family: 'Smith'},
                          country: {name: 'United States of America', code: 'USA'}}],

                        {columns: [{key: 'name.given', label: 'Given name'},
                                   {key: 'name.family', label: 'Family name'},
                                   {key: 'country', label: 'Country', format: fmtCountry}]});

        expectOutput(out, `
                     Given name  Family name  Country
                     ──────────  ───────────  ──────────────────────────────
                     Jane        Doe          Australia (AUS)
                     Bob         Smith        United States of America (USA)`);
    });

    it('calls callback after each row', function() {
        let out = table([{Name: 'Jane Doe', Country: 'Australia', pets: ['Spot', 'Scruffy']},
                         {Name: 'Bob Smith', Country: 'USA', pets: []}],
                        {columns: ['Name'],
                         after: function(row, opts) {
                             row.pets.forEach(function(pet) {
                                 opts.printLine(`-> ${pet}`);
                             });
                         }});

        expectOutput(out, `
                     Name
                     ─────────
                     Jane Doe
                     -> Spot
                     -> Scruffy
                     Bob Smith`);
    });

    it('handles multi-line cells', function() {
        let out = table([{Name: 'Jane Doe', 'Favourite Pizza Toppings': "Garlic\nPepperoni\nHam\nPineapple"},
                         {Name: 'Bob Smith', 'Favourite Pizza Toppings': "Pumpkin\r\nSpinach\nGarlic"}]);

        expectOutput(out, `
                     Name       Favourite Pizza Toppings
                     ─────────  ────────────────────────
                     Jane Doe   Garlic
                                Pepperoni
                                Ham
                                Pineapple
                     Bob Smith  Pumpkin
                                Spinach
                                Garlic`);
    });
});
