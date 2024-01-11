'use strict'

let cli = require('heroku-cli-util')

function displayJSON(info) {
  cli.log(JSON.stringify(info, null, 2))
}

async function run(context, heroku) {
  let lib = require('../../lib/peering')(heroku)
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:peering:info --space my-space')
  let pInfo = await lib.getPeeringInfo(space)
  if (context.flags.json) displayJSON(pInfo)
  else lib.displayPeeringInfo(space, pInfo)
}

module.exports = {
  topic: 'spaces',
  command: 'peering:info',
  description: 'display the information necessary to initiate a peering connection',
  help: `Example:

    $ heroku spaces:peering:info example-space
    === example-space Peering Info
    AWS Account ID:    012345678910
    AWS Region:        us-west-2
    AWS VPC ID:        vpc-baadf00d
    AWS VPC CIDR:      10.0.0.0/16
    Space CIDRs:       10.0.128.0/20, 10.0.144.0/20
    Unavailable CIDRs: 10.1.0.0/16

You will use the information provied by this command to establish a peering connection request from your AWS VPC to your private space.

To start the peering process, go into your AWS console for the VPC you would like peered with your Private Space,
navigate to the VPC service, choose the "Peering Connections" option and click the "Create peering connection" button.

- The AWS Account ID and VPC ID are necessary for the AWS VPC Peering connection wizard.
- You will also need to configure your VPC route table to route the Dyno CIDRs through the peering connection.

Once you've established the peering connection request, you can use the spaces:peerings:accept command to accept and
configure the peering connection for the space.
  `,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get peering info from'},
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(run),
}
