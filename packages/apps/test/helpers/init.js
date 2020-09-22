const {color} = require('@heroku-cli/color')
color.enabled = false

process.stdout.columns = 80
process.stderr.columns = 80
