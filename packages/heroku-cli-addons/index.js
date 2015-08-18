'use strict';

exports.topic = {
    name: '_addons',
    description: 'manage add-ons',
};

exports.commands = [
    require('./commands/addons')
];
