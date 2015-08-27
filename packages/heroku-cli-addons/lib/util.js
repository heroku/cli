'use strict';

let printf = require('printf');

module.exports = {
    formatPrice: function(price) {
        if(!price.cents)       { return 'free'; }
        if(price.cents === '?') { return '?'; }

        let fmt = price.cents % 100 === 0 ? '$%.0f/%s' : '$%.02f/%s';
        return printf(fmt, price.cents / 100, price.unit);
    },
};
