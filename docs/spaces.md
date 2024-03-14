`heroku spaces`
===============

manage heroku private spaces

* [`heroku spaces`](#heroku-spaces)
* [`heroku spaces:create`](#heroku-spacescreate)
* [`heroku spaces:destroy`](#heroku-spacesdestroy)
* [`heroku spaces:info`](#heroku-spacesinfo)
* [`heroku spaces:peering:info`](#heroku-spacespeeringinfo)
* [`heroku spaces:peerings`](#heroku-spacespeerings)
* [`heroku spaces:peerings:accept`](#heroku-spacespeeringsaccept)
* [`heroku spaces:peerings:destroy`](#heroku-spacespeeringsdestroy)
* [`heroku spaces:ps`](#heroku-spacesps)
* [`heroku spaces:rename`](#heroku-spacesrename)
* [`heroku spaces:topology`](#heroku-spacestopology)
* [`heroku spaces:transfer`](#heroku-spacestransfer)
* [`heroku spaces:vpn:config`](#heroku-spacesvpnconfig)
* [`heroku spaces:vpn:connect`](#heroku-spacesvpnconnect)
* [`heroku spaces:vpn:connections`](#heroku-spacesvpnconnections)
* [`heroku spaces:vpn:destroy`](#heroku-spacesvpndestroy)
* [`heroku spaces:vpn:info`](#heroku-spacesvpninfo)
* [`heroku spaces:vpn:update`](#heroku-spacesvpnupdate)
* [`heroku spaces:vpn:wait`](#heroku-spacesvpnwait)
* [`heroku spaces:wait`](#heroku-spaceswait)

## `heroku spaces`

list available spaces

```
USAGE
  $ heroku spaces [--json] [-t <value>]

FLAGS
  -t, --team=<value>  team to use
  --json              output in json format

DESCRIPTION
  list available spaces
```

## `heroku spaces:create`

create a new space

```
USAGE
  $ heroku spaces:create [SPACE] [-s <value>] [--region <value>] [--cidr <value>] [--data-cidr <value>] [-t <value>]

FLAGS
  -s, --space=<value>  name of space to create
  -t, --team=<value>   team to use
  --cidr=<value>       RFC-1918 CIDR the space will use
  --data-cidr=<value>  RFC-1918 CIDR used by Heroku Data resources for the space
  --region=<value>     region name

DESCRIPTION
  create a new space
  Example:

  $ heroku spaces:create --space my-space --team my-team --region oregon
  Creating space my-space in team my-team... done
  === my-space
  ID:         e7b99e37-69b3-4475-ad47-a5cc5d75fd9f
  Team:       my-team
  Region:     oregon
  CIDR:       10.0.0.0/16
  Data CIDR:  172.23.0.0/20
  State:      allocating
  Created at: 2016-01-06T03:23:13Z
```

## `heroku spaces:destroy`

destroy a space

```
USAGE
  $ heroku spaces:destroy [SPACE] [-s <value>] [--confirm <value>]

FLAGS
  -s, --space=<value>  space to destroy
  --confirm=<value>    set to space name to bypass confirm prompt

DESCRIPTION
  destroy a space
  Example:

  $ heroku spaces:destroy --space my-space
  Destroying my-space... done
```

## `heroku spaces:info`

show info about a space

```
USAGE
  $ heroku spaces:info [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get info of
  --json               output in json format

DESCRIPTION
  show info about a space
```

## `heroku spaces:peering:info`

display the information necessary to initiate a peering connection

```
USAGE
  $ heroku spaces:peering:info [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get peering info from
  --json               output in json format

DESCRIPTION
  display the information necessary to initiate a peering connection
  Example:

  $ heroku spaces:peering:info example-space
  === example-space Peering Info
  AWS Account ID:    012345678910
  AWS Region:        us-west-2
  AWS VPC ID:        vpc-baadf00d
  AWS VPC CIDR:      10.0.0.0/16
  Space CIDRs:       10.0.128.0/20, 10.0.144.0/20
  Unavailable CIDRs: 10.1.0.0/16

  You will use the information provided by this command to establish a peering connection request from your AWS VPC to
  your private space.

  To start the peering process, go into your AWS console for the VPC you would like peered with your Private Space,
  navigate to the VPC service, choose the "Peering Connections" option and click the "Create peering connection" button.

  - The AWS Account ID and VPC ID are necessary for the AWS VPC Peering connection wizard.
  - You will also need to configure your VPC route table to route the Dyno CIDRs through the peering connection.

  Once you've established the peering connection request, you can use the spaces:peerings:accept command to accept and
  configure the peering connection for the space.
```

## `heroku spaces:peerings`

list peering connections for a space

```
USAGE
  $ heroku spaces:peerings [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get peer list from
  --json               output in json format

DESCRIPTION
  list peering connections for a space
```

## `heroku spaces:peerings:accept`

accepts a pending peering request for a private space

```
USAGE
  $ heroku spaces:peerings:accept [PCXID] [-p <value>] [-s <value>]

FLAGS
  -p, --pcxid=<value>  PCX ID of a pending peering
  -s, --space=<value>  space to get peering info from

DESCRIPTION
  accepts a pending peering request for a private space
  Example:

  $ heroku spaces:peerings:accept pcx-4bd27022 --space example-space
  Accepting and configuring peering connection pcx-4bd27022
```

## `heroku spaces:peerings:destroy`

destroys an active peering connection in a private space

```
USAGE
  $ heroku spaces:peerings:destroy [PCXID] [-p <value>] [-s <value>] [--confirm <value>]

FLAGS
  -p, --pcxid=<value>  PCX ID of a pending peering
  -s, --space=<value>  space to get peering info from
  --confirm=<value>    set to PCX ID to bypass confirm prompt

DESCRIPTION
  destroys an active peering connection in a private space
  Example:

  $ heroku spaces:peerings:destroy pcx-4bd27022 --confirm pcx-4bd27022 --space example-space
  Tearing down peering connection pcx-4bd27022
```

## `heroku spaces:ps`

list dynos for a space

```
USAGE
  $ heroku spaces:ps [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get dynos of
  --json               output in json format

DESCRIPTION
  list dynos for a space
```

## `heroku spaces:rename`

renames a space

```
USAGE
  $ heroku spaces:rename --from <value> --to <value>

FLAGS
  --from=<value>  (required) current name of space
  --to=<value>    (required) desired name of space

DESCRIPTION
  renames a space
  Example:

  $ heroku spaces:rename --from old-space-name --to new-space-name
  Renaming space old-space-name to new-space-name... done
```

## `heroku spaces:topology`

show space topology

```
USAGE
  $ heroku spaces:topology [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get topology of
  --json               output in json format

DESCRIPTION
  show space topology
```

## `heroku spaces:transfer`

transfer a space to another team

```
USAGE
  $ heroku spaces:transfer --space <value> --team <value>

FLAGS
  --space=<value>  (required) name of space
  --team=<value>   (required) desired owner of space

DESCRIPTION
  transfer a space to another team
  Example:

  $ heroku spaces:transfer --space=space-name --team=team-name
  Transferring space-name to team-name... done
```

## `heroku spaces:vpn:config`

display the configuration information for VPN

```
USAGE
  $ heroku spaces:vpn:config [NAME] [-s <value>] [-n <value>] [--json]

FLAGS
  -n, --name=<value>   name or id of the VPN connection to retrieve config from
  -s, --space=<value>  space the VPN connection belongs to
  --json               output in json format

DESCRIPTION
  display the configuration information for VPN
  Example:

  $ heroku spaces:vpn:config --space my-space vpn-connection-name
  === vpn-connection-name VPN Tunnels
  VPN Tunnel  Customer Gateway  VPN Gateway     Pre-shared Key  Routable Subnets  IKE Version
  ──────────  ────────────────  ──────────────  ──────────────  ────────────────  ───────────
  Tunnel 1    104.196.121.200   35.171.237.136  abcdef12345     10.0.0.0/16       1
  Tunnel 2    104.196.121.200   52.44.7.216     fedcba54321     10.0.0.0/16       1

  You will use the information provided by this command to establish a Private Space VPN Connection.

  - You must configure your VPN Gateway to use both Tunnels provided by Heroku
  - The VPN Gateway values are the IP addresses of the Private Space Tunnels
  - The Customer Gateway value is the Public IP of your VPN Gateway
  - The VPN Gateway must use the IKE Version shown and the Pre-shared Keys as the authentication method
```

## `heroku spaces:vpn:connect`

create VPN

```
USAGE
  $ heroku spaces:vpn:connect [NAME] [-n <value>] [-i <value>] [-c <value>] [-s <value>]

FLAGS
  -c, --cidrs=<value>  a list of routable CIDRs separated by commas
  -i, --ip=<value>     public IP of customer gateway
  -n, --name=<value>   VPN name
  -s, --space=<value>  space name

DESCRIPTION
  create VPN
  Private Spaces can be connected to another private network via an IPSec VPN connection allowing dynos to connect to
  hosts on your private networks and vice versa.
  The connection is established over the public Internet but all traffic is encrypted using IPSec.

EXAMPLES
  $ heroku spaces:vpn:connect --name office --ip 35.161.69.30 --cidrs 172.16.0.0/16,10.0.0.0/24 --space my-space
      Creating VPN Connection in space my-space... done
      ▸    Use spaces:vpn:wait to track allocation.
```

## `heroku spaces:vpn:connections`

list the VPN Connections for a space

```
USAGE
  $ heroku spaces:vpn:connections [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get VPN connections from
  --json               output in json format

DESCRIPTION
  list the VPN Connections for a space
  Example:

  $ heroku spaces:vpn:connections --space my-space
  === my-space VPN Connections
  Name    Status  Tunnels
  ──────  ──────  ───────
  office  active  UP/UP
```

## `heroku spaces:vpn:destroy`

destroys VPN in a private space

```
USAGE
  $ heroku spaces:vpn:destroy [NAME] [-s <value>] [-n <value>] [--confirm <value>]

FLAGS
  -n, --name=<value>   name or id of the VPN connection to retrieve config from
  -s, --space=<value>  space to get peering info from
  --confirm=<value>    set to VPN connection name to bypass confirm prompt

DESCRIPTION
  destroys VPN in a private space
  Example:

  $ heroku spaces:vpn:destroy --space example-space vpn-connection-name --confirm vpn-connection-name
  Tearing down VPN Connection vpn-connection-name in space example-space
```

## `heroku spaces:vpn:info`

display the information for VPN

```
USAGE
  $ heroku spaces:vpn:info [NAME] [-s <value>] [--json] [-n <value>]

FLAGS
  -n, --name=<value>   name or id of the VPN connection to get info from
  -s, --space=<value>  space the vpn connection belongs to
  --json               output in json format

DESCRIPTION
  display the information for VPN
  Example:

  $ heroku spaces:vpn:info --space my-space vpn-connection-name
  === vpn-connection-name VPN Tunnel Info
  Name:           vpn-connection-name
  ID:             123456789012
  Public IP:      35.161.69.30
  Routable CIDRs: 172.16.0.0/16
  Status:         failed
  Status Message: supplied CIDR block already in use
  === my-space Tunnel Info
  VPN Tunnel  IP Address     Status  Status Last Changed   Details
  ──────────  ─────────────  ──────  ────────────────────  ──────────────
  Tunnel 1    52.44.146.197  UP      2016-10-25T22:09:05Z  status message
  Tunnel 2    52.44.146.197  UP      2016-10-25T22:09:05Z  status message
```

## `heroku spaces:vpn:update`

update VPN

```
USAGE
  $ heroku spaces:vpn:update [NAME] [-n <value>] [-c <value>] [-s <value>]

FLAGS
  -c, --cidrs=<value>  a list of routable CIDRs separated by commas
  -n, --name=<value>   VPN name
  -s, --space=<value>  space name

DESCRIPTION
  update VPN
  Private Spaces can be connected to another private network via an IPSec VPN connection allowing dynos to connect to
  hosts on your private networks and vice versa.
  The connection is established over the public Internet but all traffic is encrypted using IPSec.

EXAMPLES
  $ heroku spaces:vpn:update --name office --cidrs 172.16.0.0/16,10.0.0.0/24 --space my-space
      Updating VPN Connection in space my-space... done
```

## `heroku spaces:vpn:wait`

wait for VPN Connection to be created

```
USAGE
  $ heroku spaces:vpn:wait [NAME] [-s <value>] [-n <value>] [--json] [-i <value>] [-t <value>]

FLAGS
  -i, --interval=<value>  seconds to wait between poll intervals
  -n, --name=<value>      name or id of the vpn connection to wait for
  -s, --space=<value>     space the vpn connection belongs to
  -t, --timeout=<value>   maximum number of seconds to wait
  --json                  output in json format

DESCRIPTION
  wait for VPN Connection to be created
```

## `heroku spaces:wait`

wait for a space to be created

```
USAGE
  $ heroku spaces:wait [SPACE] [-s <value>] [--json] [-i <value>] [-t <value>]

FLAGS
  -i, --interval=<value>  seconds to wait between poll intervals
  -s, --space=<value>     space to get info of
  -t, --timeout=<value>   maximum number of seconds to wait
  --json                  output in json format

DESCRIPTION
  wait for a space to be created
```
