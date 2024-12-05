`heroku spaces`
===============

list available spaces

* [`heroku spaces`](#heroku-spaces)
* [`heroku spaces:create`](#heroku-spacescreate)
* [`heroku spaces:destroy`](#heroku-spacesdestroy)
* [`heroku spaces:info`](#heroku-spacesinfo)
* [`heroku spaces:peerings`](#heroku-spacespeerings)
* [`heroku spaces:peerings:accept`](#heroku-spacespeeringsaccept)
* [`heroku spaces:peerings:destroy`](#heroku-spacespeeringsdestroy)
* [`heroku spaces:peerings:info`](#heroku-spacespeeringsinfo)
* [`heroku spaces:ps`](#heroku-spacesps)
* [`heroku spaces:rename`](#heroku-spacesrename)
* [`heroku spaces:topology`](#heroku-spacestopology)
* [`heroku spaces:transfer`](#heroku-spacestransfer)
* [`heroku spaces:trusted-ips`](#heroku-spacestrusted-ips)
* [`heroku spaces:trusted-ips:add SOURCE`](#heroku-spacestrusted-ipsadd-source)
* [`heroku spaces:trusted-ips:remove SOURCE`](#heroku-spacestrusted-ipsremove-source)
* [`heroku spaces:vpn:config NAME`](#heroku-spacesvpnconfig-name)
* [`heroku spaces:vpn:connect NAME`](#heroku-spacesvpnconnect-name)
* [`heroku spaces:vpn:connections`](#heroku-spacesvpnconnections)
* [`heroku spaces:vpn:destroy NAME`](#heroku-spacesvpndestroy-name)
* [`heroku spaces:vpn:info NAME`](#heroku-spacesvpninfo-name)
* [`heroku spaces:vpn:update NAME`](#heroku-spacesvpnupdate-name)
* [`heroku spaces:vpn:wait NAME`](#heroku-spacesvpnwait-name)
* [`heroku spaces:wait`](#heroku-spaceswait)

## `heroku spaces`

list available spaces

```
USAGE
  $ heroku spaces [--json] [-t <value>]

FLAGS
  -t, --team=<value>  team to use
      --json          output in json format

DESCRIPTION
  list available spaces
```

_See code: [src/commands/spaces/index.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/index.ts)_

## `heroku spaces:create`

create a new space

```
USAGE
  $ heroku spaces:create [SPACE] -t <value> [--cidr <value>] [--data-cidr <value>] [--generation cedar|fir]
    [--region <value>] [-s <value>]

FLAGS
  -s, --space=<value>        name of space to create
  -t, --team=<value>         (required) team to use
      --cidr=<value>         RFC-1918 CIDR the space will use
      --data-cidr=<value>    RFC-1918 CIDR used by Heroku Data resources for the space
      --generation=<option>  [default: cedar] generation for space
                             <options: cedar|fir>
      --region=<value>       region name

DESCRIPTION
  create a new space


EXAMPLES
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
  Generation: cedar
  Created at: 2016-01-06T03:23:13Z
```

_See code: [src/commands/spaces/create.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/create.ts)_

## `heroku spaces:destroy`

destroy a space

```
USAGE
  $ heroku spaces:destroy [SPACE] [-s <value>] [--confirm <value>]

FLAGS
  -s, --space=<value>    space to destroy
      --confirm=<value>  set to space name to bypass confirm prompt

DESCRIPTION
  destroy a space


EXAMPLES
  $ heroku spaces:destroy --space my-space
  Destroying my-space... done
```

_See code: [src/commands/spaces/destroy.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/destroy.ts)_

## `heroku spaces:info`

show info about a space

```
USAGE
  $ heroku spaces:info [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get info of
      --json           output in json format

DESCRIPTION
  show info about a space

EXAMPLES
  $ heroku spaces:info my-space
```

_See code: [src/commands/spaces/info.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/info.ts)_

## `heroku spaces:peerings`

list peering connections for a space

```
USAGE
  $ heroku spaces:peerings [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get peer list from
      --json           output in json format

DESCRIPTION
  list peering connections for a space
```

_See code: [src/commands/spaces/peerings/index.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/peerings/index.ts)_

## `heroku spaces:peerings:accept`

accepts a pending peering request for a private space

```
USAGE
  $ heroku spaces:peerings:accept [PCXID] [SPACE] [-p <value>] [-s <value>]

FLAGS
  -p, --pcxid=<value>  PCX ID of a pending peering
  -s, --space=<value>  space to get peering info from

DESCRIPTION
  accepts a pending peering request for a private space

EXAMPLES
  $ heroku spaces:peerings:accept pcx-4bd27022 --space example-space
      Accepting and configuring peering connection pcx-4bd27022
```

_See code: [src/commands/spaces/peerings/accept.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/peerings/accept.ts)_

## `heroku spaces:peerings:destroy`

destroys an active peering connection in a private space

```
USAGE
  $ heroku spaces:peerings:destroy [PCXID] -s <value> [-p <value>] [--confirm <value>]

FLAGS
  -p, --pcxid=<value>    PCX ID of a pending peering
  -s, --space=<value>    (required) space to get peering info from
      --confirm=<value>  set to PCX ID to bypass confirm prompt

DESCRIPTION
  destroys an active peering connection in a private space

EXAMPLES
  $ heroku spaces:peerings:destroy pcx-4bd27022 --confirm pcx-4bd27022 --space example-space
  Tearing down peering connection pcx-4bd27022... done
```

_See code: [src/commands/spaces/peerings/destroy.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/peerings/destroy.ts)_

## `heroku spaces:peerings:info`

display the information necessary to initiate a peering connection

```
USAGE
  $ heroku spaces:peerings:info [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get peering info from
      --json           output in json format

DESCRIPTION
  display the information necessary to initiate a peering connection

  You will use the information provided by this command to establish a peering connection request from your AWS VPC to
  your private space.

  To start the peering process, go into your AWS console for the VPC you would like peered with your Private Space,
  navigate to the VPC service, choose the "Peering Connections" option and click the "Create peering connection" button.

  - The AWS Account ID and VPC ID are necessary for the AWS VPC Peering connection wizard.
  - You will also need to configure your VPC route table to route the Dyno CIDRs through the peering connection.

  Once you've established the peering connection request, you can use the spaces:peerings:accept command to accept and
  configure the peering connection for the space.


EXAMPLES
  $ heroku spaces:peering:info example-space
  === example-space  Peering Info
  AWS Account ID:    012345678910
  AWS Region:        us-west-2
  AWS VPC ID:        vpc-baadf00d
  AWS VPC CIDR:      10.0.0.0/16
  Space CIDRs:       10.0.128.0/20, 10.0.144.0/20
  Unavailable CIDRs: 10.1.0.0/16
```

_See code: [src/commands/spaces/peerings/info.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/peerings/info.ts)_

## `heroku spaces:ps`

list dynos for a space

```
USAGE
  $ heroku spaces:ps [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get dynos of
      --json           output in json format

DESCRIPTION
  list dynos for a space
```

_See code: [src/commands/spaces/ps.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/ps.ts)_

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

EXAMPLES
  $ heroku spaces:rename --from old-space-name --to new-space-name
  Renaming space old-space-name to new-space-name... done
```

_See code: [src/commands/spaces/rename.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/rename.ts)_

## `heroku spaces:topology`

show space topology

```
USAGE
  $ heroku spaces:topology [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get topology of
      --json           output in json format

DESCRIPTION
  show space topology
```

_See code: [src/commands/spaces/topology.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/topology.ts)_

## `heroku spaces:transfer`

transfer a space to another team

```
USAGE
  $ heroku spaces:transfer -s <value> -t <value>

FLAGS
  -s, --space=<value>  (required) name of space
  -t, --team=<value>   (required) desired owner of space

DESCRIPTION
  transfer a space to another team

EXAMPLES
  $ heroku spaces:transfer --space=space-name --team=team-name
  Transferring space-name to team-name... done
```

_See code: [src/commands/spaces/transfer.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/transfer.ts)_

## `heroku spaces:trusted-ips`

list trusted IP ranges for a space

```
USAGE
  $ heroku spaces:trusted-ips [SPACE] [-s <value>] [--json]

FLAGS
  -s, --space=<value>  space to get inbound rules from
      --json           output in json format

DESCRIPTION
  list trusted IP ranges for a space
  Trusted IP ranges are only available on Private Spaces.

  The space name is a required parameter. Newly created spaces will have 0.0.0.0/0 set by default
  allowing all traffic to applications in the space. More than one CIDR block can be provided at
  a time to the commands listed below. For example 1.2.3.4/20 and 5.6.7.8/20 can be added with:
```

_See code: [src/commands/spaces/trusted-ips/index.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/trusted-ips/index.ts)_

## `heroku spaces:trusted-ips:add SOURCE`

Add one range to the list of trusted IP ranges

```
USAGE
  $ heroku spaces:trusted-ips:add SOURCE -s <value> [--confirm <value>]

ARGUMENTS
  SOURCE  IP address in CIDR notation

FLAGS
  -s, --space=<value>    (required) space to add rule to
      --confirm=<value>  set to space name to bypass confirm prompt

DESCRIPTION
  Add one range to the list of trusted IP ranges
  Uses CIDR notation.

EXAMPLES
  $ heroku trusted-ips:add --space my-space 192.168.2.0/24
    Added 192.168.0.1/24 to trusted IP ranges on my-space
```

_See code: [src/commands/spaces/trusted-ips/add.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/trusted-ips/add.ts)_

## `heroku spaces:trusted-ips:remove SOURCE`

Remove a range from the list of trusted IP ranges

```
USAGE
  $ heroku spaces:trusted-ips:remove SOURCE -s <value> [--confirm <value>]

ARGUMENTS
  SOURCE  IP address in CIDR notation

FLAGS
  -s, --space=<value>    (required) space to remove rule from
      --confirm=<value>  set to space name to bypass confirm prompt

DESCRIPTION
  Remove a range from the list of trusted IP ranges
  Uses CIDR notation.

EXAMPLES
  $ heroku trusted-ips:remove --space my-space 192.168.2.0/24
      Removed 192.168.2.0/24 from trusted IP ranges on my-space
```

_See code: [src/commands/spaces/trusted-ips/remove.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/trusted-ips/remove.ts)_

## `heroku spaces:vpn:config NAME`

display the configuration information for VPN

```
USAGE
  $ heroku spaces:vpn:config NAME -s <value> [--json]

ARGUMENTS
  NAME  name or id of the VPN connection to retrieve config from

FLAGS
  -s, --space=<value>  (required) space the VPN connection belongs to
      --json           output in json format

DESCRIPTION
  display the configuration information for VPN

  You will use the information provided by this command to establish a Private Space VPN Connection.

  - You must configure your VPN Gateway to use both Tunnels provided by Heroku
  - The VPN Gateway values are the IP addresses of the Private Space Tunnels
  - The Customer Gateway value is the Public IP of your VPN Gateway
  - The VPN Gateway must use the IKE Version shown and the Pre-shared Keys as the authentication method


EXAMPLES
  $ heroku spaces:vpn:config vpn-connection-name --space my-space
  === vpn-connection-name VPN Tunnels
   VPN Tunnel Customer Gateway VPN Gateway    Pre-shared Key Routable Subnets IKE Version
   ────────── ──────────────── ────────────── ────────────── ──────────────── ───────────
   Tunnel 1    104.196.121.200   35.171.237.136  abcdef12345     10.0.0.0/16       1
   Tunnel 2    104.196.121.200   52.44.7.216     fedcba54321     10.0.0.0/16       1
```

_See code: [src/commands/spaces/vpn/config.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/vpn/config.ts)_

## `heroku spaces:vpn:connect NAME`

create VPN

```
USAGE
  $ heroku spaces:vpn:connect NAME -i <value> -c <value> -s <value>

ARGUMENTS
  NAME  name or id of the VPN connection to create

FLAGS
  -c, --cidrs=<value>  (required) a list of routable CIDRs separated by commas
  -i, --ip=<value>     (required) public IP of customer gateway
  -s, --space=<value>  (required) space name

DESCRIPTION
  create VPN
  Private Spaces can be connected to another private network via an IPSec VPN connection allowing dynos to connect to
  hosts on your private networks and vice versa.
  The connection is established over the public Internet but all traffic is encrypted using IPSec.


EXAMPLES
  $ heroku spaces:vpn:connect vpn-connection-name --ip 35.161.69.30 --cidrs 172.16.0.0/16,10.0.0.0/24 --space my-space
  Creating VPN Connection in space my-space... done
  ▸    Use spaces:vpn:wait to track allocation.
```

_See code: [src/commands/spaces/vpn/connect.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/vpn/connect.ts)_

## `heroku spaces:vpn:connections`

list the VPN Connections for a space

```
USAGE
  $ heroku spaces:vpn:connections -s <value> [--json]

FLAGS
  -s, --space=<value>  (required) space to get VPN connections from
      --json           output in json format

DESCRIPTION
  list the VPN Connections for a space

EXAMPLES
  $ heroku spaces:vpn:connections --space my-space
  === my-space VPN Connections
   Name   Status Tunnels 
   ────── ────── ─────── 
   office active UP/UP
```

_See code: [src/commands/spaces/vpn/connections.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/vpn/connections.ts)_

## `heroku spaces:vpn:destroy NAME`

destroys VPN in a private space

```
USAGE
  $ heroku spaces:vpn:destroy NAME -s <value>

ARGUMENTS
  NAME  name or id of the VPN connection to destroy

FLAGS
  -s, --space=<value>  (required) space name

DESCRIPTION
  destroys VPN in a private space

EXAMPLES
  $ heroku spaces:vpn:destroy vpn-connection-name --space example-space --confirm vpn-connection-name
  Tearing down VPN Connection vpn-connection-name in space example-space
```

_See code: [src/commands/spaces/vpn/destroy.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/vpn/destroy.ts)_

## `heroku spaces:vpn:info NAME`

display the information for VPN

```
USAGE
  $ heroku spaces:vpn:info NAME -s <value> [--json]

ARGUMENTS
  NAME  name or id of the VPN connection to get info from

FLAGS
  -s, --space=<value>  (required) space the vpn connection belongs to
      --json           output in json format

DESCRIPTION
  display the information for VPN

EXAMPLES
  $ heroku spaces:vpn:info vpn-connection-name --space my-space
  === vpn-connection-name VPN Tunnel Info
  Name:           vpn-connection-name
  ID:             123456789012
  Public IP:      35.161.69.30
  Routable CIDRs: 172.16.0.0/16
  Status:         failed
  Status Message: supplied CIDR block already in use
  === my-space Tunnel Info
   VPN Tunnel IP Address    Status Last Changed         Details
   ────────── ───────────── ────── ──────────────────── ─────────────
   Tunnel 1   52.44.146.197 UP     2016-10-25T22:09:05Z status message
   Tunnel 2   52.44.146.197 UP     2016-10-25T22:09:05Z status message
```

_See code: [src/commands/spaces/vpn/info.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/vpn/info.ts)_

## `heroku spaces:vpn:update NAME`

update VPN

```
USAGE
  $ heroku spaces:vpn:update NAME -c <value> -s <value>

ARGUMENTS
  NAME  name or id of the VPN connection to update

FLAGS
  -c, --cidrs=<value>  (required) a list of routable CIDRs separated by commas
  -s, --space=<value>  (required) space name

DESCRIPTION
  update VPN
  Private Spaces can be connected to another private network via an IPSec VPN connection allowing dynos to connect to
  hosts on your private networks and vice versa.
  The connection is established over the public Internet but all traffic is encrypted using IPSec.


EXAMPLES
  $ heroku spaces:vpn:update vpn-connection-name --space my-space --cidrs 172.16.0.0/16,10.0.0.0/24
  Updating VPN Connection in space my-space... done
```

_See code: [src/commands/spaces/vpn/update.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/vpn/update.ts)_

## `heroku spaces:vpn:wait NAME`

wait for VPN Connection to be created

```
USAGE
  $ heroku spaces:vpn:wait NAME -s <value> [--json] [-i <value>] [-t <value>]

ARGUMENTS
  NAME  name or id of the VPN connection you are waiting on for allocation.

FLAGS
  -i, --interval=<value>  seconds to wait between poll intervals
  -s, --space=<value>     (required) space the vpn connection belongs to
  -t, --timeout=<value>   maximum number of seconds to wait
      --json              output in json format

DESCRIPTION
  wait for VPN Connection to be created

EXAMPLES
   $ heroku spaces:vpn:wait vpn-connection-name --space my-space
   Waiting for VPN Connection vpn-connection-name to allocate... done
   === my-space VPN Tunnels
  VPN Tunnel Customer Gateway VPN Gateway    Pre-shared Key Routable Subnets IKE Version
  ────────── ──────────────── ────────────── ────────────── ──────────────── ───────────
  Tunnel 1    104.196.121.200   35.171.237.136  abcdef12345     10.0.0.0/16       1
  Tunnel 2    104.196.121.200   52.44.7.216     fedcba54321     10.0.0.0/16       1
```

_See code: [src/commands/spaces/vpn/wait.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/vpn/wait.ts)_

## `heroku spaces:wait`

wait for a space to be created

```
USAGE
  $ heroku spaces:wait [SPACE] [-s <value>] [--json] [-i <value>] [-t <value>]

FLAGS
  -i, --interval=<value>  [default: 30] seconds to wait between poll intervals
  -s, --space=<value>     space to get info of
  -t, --timeout=<value>   [default: 1500] maximum number of seconds to wait
      --json              output in json format

DESCRIPTION
  wait for a space to be created
```

_See code: [src/commands/spaces/wait.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.0/packages/cli/src/commands/spaces/wait.ts)_
