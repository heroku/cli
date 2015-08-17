'use strict';

let cli    = require('heroku-cli-util');
let co     = require('co');
let printf = require('printf');
let _      = require('lodash');

let cyan = cli.color.cyan,
    magenta = cli.color.magenta,
    green = cli.color.green;

function* addonGetter(api, app) {
    let attachments, addons;

    if(app) {
        attachments = api.apps(app).addonAttachments().listByApp();
    //     addons      = api.request({
    //         method:  'GET',
    //         path:    ['', 'apps', app, 'addons'].join('/'),
    //         headers: {'Accept-Expansion': 'addon_service,plan'}
    //     });
    } else {
        attachments = api.addonAttachments().list();
    }

    // have to get all for now because API only returns owned add-ons at the
    // /apps/:app/addons endpoint
    addons      = api.request({
        method:  'GET',
        path:    '/addons',
        headers: {'Accept-Expansion': 'addon_service,plan'}
    });

    // Get addons and attachments in parallel
    let items = yield [addons, attachments];

    attachments = _.groupBy(items[1], _.property('addon.id'));
    addons      = items[0].filter(function(addon) {
        return !!attachments[addon.id];
    });

    addons.forEach(function(addon) {
        addon.attachments = attachments[addon.id];
    });

    return addons;
}

function formatPrice(price) {
    if(!price.cents) { return 'free'; }

    let fmt = price.cents % 100 == 0 ? '$%.0f/%s' : '$%.02f/%s'
    return printf(fmt, price.cents / 100, price.unit);
};

function displayAll(addons) {
    let fmt = [

        magenta('%-30s'), // app
        cyan('%-40s'),    // addon
        '%-30s',          // plan
        '%-10s\n'         // price
    ].join(' ');

    printf(process.stdout, cli.color.bold(cli.color.stripColor(fmt)), 'App', 'Add-on', 'Plan', 'Price');
    console.log();
    addons.forEach(function(addon) {
        let displayApp = addon.app.name == app ? '' : addon.app.name
        printf(process.stdout, fmt, displayApp, addon.name, addon.plan.name, formatPrice(addon.plan.price));

        addon.attachments.forEach(function(attachment, idx) {
            let ch = (idx == addon.attachments.length - 1) ? '└' : '├';
            let attName = [cli.color.green(attachment.name)];

            if(app ? (attachment.app.name != app) : (attachment.app.name != addon.app.name)) {
                attName.unshift(magenta(attachment.app.name))
            }

            console.log(ch + '── ' + attName.join('::'));
        });

        console.log();
    });
}

function displayForApp(app, addons) {
    let fmt = [
        cyan('%-40s'),    // addon
        '%-30s',          // plan
        '%-10s\n'         // price
    ].join(' ');

    printf(process.stdout, cli.color.bold(cli.color.stripColor(fmt)), 'Add-on', 'Plan', 'Price');
    console.log();
    addons.forEach(function(addon) {
        printf(process.stdout, fmt, addon.name, addon.plan.name, formatPrice(addon.plan.price));

        addon.attachments.forEach(function(attachment, idx) {
            let ch = (idx == addon.attachments.length - 1) ? '└' : '├';
            let attName = [cli.color.green(attachment.name)];

            if(app ? (attachment.app.name != app) : (attachment.app.name != addon.app.name)) {
                attName.unshift(magenta(attachment.app.name))
            }

            console.log(ch + '── ' + attName.join('::'));
        });

        console.log();
    });
}

let run = cli.command(function(ctx, api) {
    return co(function*() {
        let addons = yield co(addonGetter(api, ctx.app));

        if(!ctx.flags.all && ctx.app) {
            displayForApp(ctx.app, addons);
        } else {
            displayAll(addons);
        }
    });
});

module.exports = {
    topic:     'addons',
    default:   true,
    needsAuth: true,
    preauth:   true,
    wantsApp:  true,
    args:      [{name: 'addon', optional: true}],
    flags:     [{
        name:        'all',
        char:        'A',
        hasValue:    false,
        description: 'Show add-ons and attachments for all accessible apps'
    }],

    run:         run,
    usage:       'heroku addons [--all|--app APP]',
    description: 'Lists your add-ons and attachments',
    help:        ``.replace(/^\s*/mg,''),
};
