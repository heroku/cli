'use strict';

let cli   = require('heroku-cli-util');

String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

String.prototype.ljust = function( width, padding ) {
	padding = padding || " ";
	padding = padding.substr( 0, 1 );
	if( this.length < width )
		return this + padding.repeat( width - this.length );
	else
		return this;
}

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Object.prototype.keys = function ()
{
  var keys = [];
  for(var i in this) if (this.hasOwnProperty(i))
  {
    keys.push(i);
  }
  return keys;
}

module.exports = {
  styled_header: function (header) {
    cli.log(`=== ${header}`);
  },
  styled_hash: function (hash, keys) {
    let max_key_length = hash.keys().map(function(key) {
      return key.toString().length;
    }).max() + 2;
    keys = keys || hash.keys().sort();
    for (var key_index in keys) {
      if (keys.hasOwnProperty(key_index)) {
        let value = hash[keys[key_index]];
        if(typeof value === 'object') {
          if(value.length > 0) {
            let elements = value.sort();
            cli.log(`${keys[key_index].toTitleCase()}: `.ljust(max_key_length) + elements[0]);
            for (var i = 1; i < elements.length; i++) {
              cli.log(" ".repeat(max_key_length) + elements[i]);
            }
          }
        } else if (value !== null & value !== undefined) {
          cli.log(`${keys[key_index].toTitleCase()}: `.ljust(max_key_length) + value);
        }
      }
    }
  }
}
