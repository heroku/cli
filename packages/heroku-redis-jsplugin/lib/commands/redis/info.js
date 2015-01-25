var Heroku = require('heroku-client');
var Q = require('q');

var api = require('./shared.js')

function format_addon(addon, info) {
  var width = 0;
  for (var i=0; i < info.length; i++) {
    width = Math.max(width, info[i].name.length)
  }

  var out = []
  out.push("=== "+addon.config_vars[0])

  for (var i=0; i < info.length; i++) {
    padding = ": "+Array(width-info[i].name.length+1).join(" ");
    out.push(info[i].name+padding+info[i].values.join(" "));
  }
  
  return out;
}

module.exports = {
  topic: 'redis',
  command: 'info',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  shortHelp: 'gets information about redis',
  run: function(context) {
    var filter = api.make_addons_filter(context.args.database);
    var heroku = new Heroku({token: context.auth.password});
    
    heroku.apps(context.app).addons().list()
    .then(filter)
    .then(function(addons) {
      var out = []
      for(var i=0; i<addons.length; i++) {
        var r = api.request(context, addons[i].name).then(function (addon, result) {
          var text = format_addon(addon, result.info);
          console.log(text.join("\n"));
            
          }.bind(this, addons[i])
        );
        out.push(r);
      }
      return Q.allSettled(out)
    }).done();
  }
};

