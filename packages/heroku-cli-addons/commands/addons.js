'use strict';

let cli    = require('heroku-cli-util');
let co     = require('co');
let printf = require('printf');
let _      = require('lodash');
let _table  = require('../lib/table');

let styles = {
    app: 'cyan',
    attachment: 'green',
    addon: 'magenta',
}

// style given text or return a function that styles text according to provided style
function style(s, t) {
    if(!t) {return function(text) { return style(s, text); };}
    return cli.color[styles[s] || s](t);
}

function table(data, options) {
    return _table(data, _.merge(options, {
        printLine: cli.log
    }));
}

// Gets *all* attachments and add-ons and filters locally because the API
// returns *owned* items not associated items.
function* addonGetter(api, app) {
    let attachments, addons;

    if(app) { // don't disploy attachments globally
        let sudoHeaders = JSON.parse(process.env.HEROKU_HEADERS || '{}');
        if(sudoHeaders['X-Heroku-Sudo'] && !sudoHeaders['X-Heroku-Sudo-User']) {
            // because the root /addon-attachments endpoint won't include relevant
            // attachments when sudo-ing for another app, we will use the more
            // specific API call and sacrifice listing foreign attachments.
            addons = api.request({
                method:  'GET',
                path:    `/apps/${app}/addons`,
                headers: {'Accept-Expansion': 'addon_service,plan'},
            });

            attachments = api.request({
                method:  'GET',
                path:    `/apps/${app}/addon-attachments`,
            });
        } else {
            // In order to display all foreign attachments, we'll get out entire
            // attachment list
            attachments = api.addonAttachments().list();
        }
    }

    addons = addons || api.request({
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
            ansi:  style('app'),
        }, {
            key:   'name',
            label: 'Add-on',
            ansi:  style('addon'),
        }, {
            key:   'plan.name',
            label: 'Plan',
            ansi:  function(s) { return _.trimRight(s) == '?' ? style('dim', s) : s; },
        }, {
            key:       'plan.price',
            label:     'Price',
            formatter: formatPrice,
            ansi:  function(s) { return _.trimRight(s) == '?' ? style('dim', s) : s; },
        }],

    });
}

function formatAttachment(attachment, showApp) {
    if(showApp === undefined) { showApp = true; }

    let attName = style('attachment', attachment.name);

    if(showApp) {
        return style('dim', style('app', attachment.app.name) + '::') + attName;
    } else {
        return attName;
    }
}

function renderAttachment(attachment, app, isFirst) {
    let line = isFirst ? '└─' : '├─';
    let attName = formatAttachment(attachment, attachment.app.name != app);
    return printf(' %s %s', style('dim', line), attName);
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

    function isForeignApp(attOrAddon) { return attOrAddon.app.name != app }

    addons = _.sortByAll(addons,
                         isForeignApp,
                         'plan.name',
                         'addon.name');

    table(addons, {
        headerAnsi: cli.color.bold,
        columns: [{
            key:   'name',
            label: 'Add-on',
            ansi:  style('addon'),

            // customize column width to factor in the attachment list
            // TODO: make this just be `width`, which can either be a static number or a function which returns a number
            calcWidth: nestedCalcWidther('name',
                                         'attachments',
                                         _.partial(renderAttachment, _, app)),
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
                    return dim(printf('(billed to %s app)', style('app', addon.app.name)));
                }
            },
        }],

        after: function(addon, options) {
            let atts = _.sortByAll(addon.attachments,
                                   isForeignApp,
                                   'app.name',
                                   'name');

            atts.forEach(function(attachment, idx) {
                let isFirst = (idx == addon.attachments.length - 1)
                console.log(renderAttachment(attachment, app, isFirst));
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

let topic = '_addons';
module.exports = {
    topic:     topic,
    default:   true,
    needsAuth: true,
    preauth:   true,
    wantsApp:  true,
    // args:      [{name: 'addon', optional: true}],
    flags:     [{
        name:        'all',
        char:        'A',
        hasValue:    false,
        description: 'Show add-ons and attachments for all accessible apps'
    }],

    run:         run,
    usage:       `${topic} [--all|--app APP]`,
    description: 'Lists your add-ons and attachments',
    help:        `The default filter applied depends on whether you are in a Heroku app
directory. If so, the --app flag is implied. If not, the default of --all
is implied. Explicitly providing either flag overrides the default
behaviour.

Examples:

  $ heroku ${topic} --all
  $ heroku ${topic} --app acme-inc-website

Identifying specific add-ons:

  Add-ons have canonical names (ADDON_NAME in these command help texts).
  They also application-specific names called aliases or attachments. In
  many cases, these names can be used interchangeably when unambiguous.

  For example, given a fictional \`slowdb\` add-on named \`slowdb-cubed-1531\`
  attached as \`FOO_DB\` to \`app1\` and BAR_DB to \`app2\`, the following
  invocations are considered equivalent:

  $ heroku addons:upgrade slowdb             slowdb:premium
  $ heroku addons:upgrade --app app1 FOO_DB  slowdb:premium
  $ heroku addons:upgrade app1::FOO_DB       slowdb:premium
  $ heroku addons:upgrade app2::BAR_DB       slowdb:premium
  $ heroku addons:upgrade acme-inc-datastore slowdb:premium

  If the name used is ambiguous (e.g. if you used \`slowdb\` with more than
  one add-on of that type installed), the command will error due to
  ambiguity and a more specific identifier will need to be chosen.

  For more information, read https://devcenter.heroku.com/articles/add-ons.`,
};
