'use strict';

let cli    = require('heroku-cli-util');
let co     = require('co');

let formatPrice = require('../../lib/util').formatPrice;

let run = cli.command(function(ctx, api) {
    return co(function*() {
        let addon = yield api.request({
            method:  'GET',
            path:    `/addons/${ctx.args.addon}`,
            headers: {'Accept-Expansion': 'addon_service,plan'},
        });

        addon.attachments = yield api.request({
            method: 'GET',
            path: `/addons/${addon.id}/addon-attachments`,
        });

        cli.styledHeader(addon.name);
        cli.styledHash({
            Plan: addon.plan.name,
            Price: formatPrice(addon.plan.price),
            Attachments: addon.attachments.map(function(att) {
                return `${att.app.name}::${att.name}`;
            }).sort(),
            'Owning app': addon.app.name,
            'Installed at': (new Date(addon.created_at)).toString(),
        });
    });
});

let topic = '_addons';
module.exports = {
    topic:       topic,
    command:     'info',
    wantsApp:    true,
    needsAuth:   true,
    preauth:     true,
    args:        [{name: 'addon'}],
    run:         run,
    usage:       `${topic}:info ADDON`,
    description: 'Show info about an add-on and its attachments.'
};
