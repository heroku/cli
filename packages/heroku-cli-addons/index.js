'use strict';

exports.topic = {
    name: 'addons',
    description: 'manage add-ons',
};

exports.commands = [
    require('./commands/addons'),
    require('./commands/addons/info'),
    require('./commands/addons/open'),
    require('./commands/addons/rename'),
];
