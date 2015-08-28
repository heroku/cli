'use strict';

let expect = require('chai').expect;

function stripIndents(str) {
    return str.replace(/\A\n|^\s+|\s+$/mg, '');
}

module.exports = {
    expectOutput: function(actual, expected) {
        return expect(stripIndents(actual))
            .to.equal(stripIndents(expected));
    }
};

