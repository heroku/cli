'use strict';

let cli    = require('heroku-cli-util');
let co     = require('co');
let printf = require('printf');
let _      = require('lodash');
let table  = require('../lib/table');

let cyan = cli.color.cyan,
    magenta = cli.color.magenta,
    green = cli.color.green,
    dim = cli.color.dim;


// Gets *all* attachments and add-ons and filters locally because the API
// returns *owned* items not associated items.
function* addonGetter(api, app) {
    let attachments, addons;

    attachments = api.addonAttachments().list();
    addons = api.request({
        method:  'GET',
        path:    '/addons',
        headers: {'Accept-Expansion': 'addon_service,plan'}
    });

    // Get addons and attachments in parallel
    let items = yield [addons, attachments];

    function isRelevantToApp(addon) {
        return !app
            || addon.app.name == app
            || _.any(addon.attachments, function(att) { return att.app.name == app });
    }

    attachments = _.groupBy(items[1], _.property('addon.id'));

    addons = [];
    items[0].forEach(function(addon) {
        addon.attachments = attachments[addon.id];

        // TODO: display remaining attachments (i.e., for which we can't access
        //       add-on details)
        delete attachments[addon.id];

        if(isRelevantToApp(addon)) {
            addons.push(addon);
        }
    });

    _.values(attachments).forEach(function(atts) {
        let inaccessibleAddon = {
            app: atts[0].addon.app,
            name: atts[0].addon.name,
            plan: {name: '?', price: {cents: '?', unit: 'month'}},
            attachments: atts
        };

        if(isRelevantToApp(inaccessibleAddon)) {
            addons.push(inaccessibleAddon);
        }
    });

    return addons;
}

function formatPrice(price) {
    if(!price.cents)       { return 'free'; }
    if(price.cents == '?') { return '?'; }

    let fmt = price.cents % 100 == 0 ? '$%.0f/%s' : '$%.02f/%s'
    return printf(fmt, price.cents / 100, price.unit);
};

function displayAll(addons) {
    addons = _.sortByAll(addons, 'app.name', 'plan.name', 'addon.name')

    table(addons, {
        headerAnsi: cli.color.bold,
        columns: [{
            key:   'app.name',
            label: 'Owning App',
            ansi:  magenta,
        }, {
            key:   'name',
            label: 'Add-on',
            ansi:  cyan,
        }, {
            key:   'plan.name',
            label: 'Plan',
            ansi:  function(s) { return _.trimRight(s) == '?' ? dim(s) : s; },
        }, {
            key:       'plan.price',
            label:     'Price',
            formatter: formatPrice,
            ansi:  function(s) { return _.trimRight(s) == '?' ? dim(s) : s; },
        }],
    });
}

function formatAttachment(attachment, app, isFirst) {
    let ch = isFirst ? '└' : '├';
    let attName = [green(attachment.name)];

    if(attachment.app.name != app) {
        attName = dim(magenta(attachment.app.name) + '::') + attName;
    }

    return printf(' %s─ %s', ch, attName);
}

function displayForApp(app, addons) {
    let nestedCalcWidther = function(path, nestedPath, fn) {
        return function(row) {
            let nestedWidth = _.max(_.get(row, nestedPath).map(_.compose(_.property('length'),
                                                                         cli.color.stripColor,
                                                                         fn)));
            return Math.max(_.get(row, path).length, nestedWidth);
        }
    };

    table(addons, {
        headerAnsi: cli.color.bold,
        columns: [{
            key:   'name',
            label: 'Add-on',
            ansi:  cyan,

            // customize column width to factor in the attachment list
            calcWidth: nestedCalcWidther('name',
                                         'attachments',
                                         _.partial(formatAttachment, _, app)),
        }, {
            key:   'plan.name',
            label: 'Plan',
            ansi:  function(s) { return _.trimRight(s) == '?' ? dim(s) : s; }
        }, {
            label:     'Price',
            get: function(addon) {
                if(addon.app.name == app) {
                    return formatPrice(addon.plan.price);
                } else {
                    return dim(printf('(billed to %s app)', magenta(addon.app.name)));
                }
            },
        }],

        after: function(addon, options) {
            addon.attachments.forEach(function(attachment, idx) {
                let isFirst = (idx == addon.attachments.length - 1)
                console.log(formatAttachment(attachment, app, isFirst));
            });
        }
    })
}

let run = cli.command(function(ctx, api) {
    return co(function*() {
        if(!ctx.flags.all && ctx.app) {
            displayForApp(ctx.app, yield co(addonGetter(api, ctx.app)));
        } else {
            displayAll(yield co(addonGetter(api)));
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
