'use strict';

let cli    = require('heroku-cli-util');
let co     = require('co');
let printf = require('printf');
let _      = require('lodash');
let util   = require('../lib/util');

let table       = util.table,
    style       = util.style,
    formatPrice = util.formatPrice;

// Gets *all* attachments and add-ons and filters locally because the API
// returns *owned* items not associated items.
function* addonGetter(api, app) {
    let attachments, addons;

    if(app) { // don't disploy attachments globally
        addons = api.request({
            method:  'GET',
            path:    `/apps/${app}/addons`,
            headers: {'Accept-Expansion': 'addon_service,plan'},
        });

        let sudoHeaders = JSON.parse(process.env.HEROKU_HEADERS || '{}');
        if(sudoHeaders['X-Heroku-Sudo'] && !sudoHeaders['X-Heroku-Sudo-User']) {
            // because the root /addon-attachments endpoint won't include relevant
            // attachments when sudo-ing for another app, we will use the more
            // specific API call and sacrifice listing foreign attachments.
            attachments = api.request({
                method:  'GET',
                path:    `/apps/${app}/addon-attachments`,
            });
        } else {
            // In order to display all foreign attachments, we'll get out entire
            // attachment list
            attachments = api.addonAttachments().list();
        }
    } else {
        addons = api.request({
            method:  'GET',
            path:    '/addons',
            headers: {'Accept-Expansion': 'addon_service,plan'}
        });
    }

    // Get addons and attachments in parallel
    let items = yield [addons, attachments];

    function isRelevantToApp(addon) {
        return !app ||
            addon.app.name === app ||
            _.any(addon.attachments, function(att) { return att.app.name === app; });
    }

    attachments = _.groupBy(items[1], _.property('addon.id'));

    addons = [];
    items[0].forEach(function(addon) {
        addon.attachments = attachments[addon.id] || [];

        delete attachments[addon.id];

        if(isRelevantToApp(addon)) {
            addons.push(addon);
        }
    });

    _.values(attachments).forEach(function(atts) {
        let inaccessibleAddon = {
            app: atts[0].addon.app,
            name: atts[0].addon.name,
            plan: {name: '?'},
            attachments: atts
        };

        if(isRelevantToApp(inaccessibleAddon)) {
            addons.push(inaccessibleAddon);
        }
    });

    return addons;
}

function displayAll(addons) {
    addons = _.sortByAll(addons, 'app.name', 'plan.name', 'addon.name');

    if(addons.length === 0) {
        cli.log("No add-ons.");
        return;
    }

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
            ansi:  function(s) { return _.trimRight(s) === '?' ? style('dim', s) : s; },
        }, {
            key:       'plan.price',
            label:     'Price',
            formatter: formatPrice,
            ansi:  function(s) { return _.trimRight(s) === '?' ? style('dim', s) : s; },
        }],

    });
}

function formatAttachment(attachment, showApp) {
    if(showApp === undefined) { showApp = true; }

    let attName = style('attachment', attachment.name);

    let output = [attName];
    if(showApp) {
        let appInfo = `➞  to ${style('app', attachment.app.name)} app`;
        output.push(style('dim', appInfo));
    }

    return output.join(' ');
}

function renderAttachment(attachment, app, isFirst) {
    let line = isFirst ? '└─' : '├─';
    let attName = formatAttachment(attachment, attachment.app.name !== app);
    return printf(' %s %s', style('dim', line), attName);
}

function displayForApp(app, addons) {
    if(addons.length === 0) {
        cli.log(`No add-ons for app ${app}.`);
        return;
    }

    function isForeignApp(attOrAddon) { return attOrAddon.app.name !== app; }

    function presentAddon(addon) {
        let name    = style('addon', addon.name);
        let service = addon.addon_service.name;

        return `${service} (${name})`;
        // return `${name} (${service})`;
    }

    cli.log(`The following table shows ${style('addon', 'add-ons')} and the ` +
            `${style('attachment', 'attachments')} to the current app (${app}) ` +
            `or other ${style('app', 'apps')}.\n`);

    addons = _.sortByAll(addons,
                         isForeignApp,
                         'plan.name',
                         'addon.name');

    table(addons, {
        headerAnsi: cli.color.bold,
        columns: [{
            label:     'Add-on',
            get:       presentAddon,
            calcWidth: function(addon) { // customize column width to factor in the attachment list
                let addonLength      = cli.color.stripColor(presentAddon(addon)).length;
                let attachmentLength = _.max(
                    _.map(addon.attachments, function(att) {
                        return cli.color.stripColor(renderAttachment(att, app)).length;
                    }));

                return Math.max(addonLength, attachmentLength);
            }
        }, {
            label: 'Plan',
            get:   function(addon) {
                let name = addon.plan.name;
                if(name === '?') {
                    return style('dim', '?');
                } else {
                    return name.replace(/^[^:]+:/, '');
                }
            },
        }, {
            label: 'Price',
            get:   function(addon) {
                if(addon.app.name === app) {
                    return formatPrice(addon.plan.price);
                } else {
                    return style('dim', printf('(billed to %s app)', style('app', addon.app.name)));
                }
            },
        }],

        after: function(addon) {
            let atts = _.sortByAll(addon.attachments,
                                   isForeignApp,
                                   'app.name',
                                   'name');

            // Print each attachment under the add-on
            atts.forEach(function(attachment, idx) {
                let isFirst = (idx === addon.attachments.length - 1);
                cli.log(renderAttachment(attachment, app, isFirst));
            });

            // Separate each add-on row by a blank line
            cli.log("");
        }
    });
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
