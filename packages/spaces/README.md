heroku-spaces CLI plugin [![Circle CI](https://circleci.com/gh/heroku/heroku-spaces.svg?style=svg&circle-token=99951d0283972db74af1fa0f5dc179ebf6d85963)](https://circleci.com/gh/heroku/heroku-spaces)
===========

[![npm version](https://img.shields.io/npm/v/@heroku-cli/plugin-spaces.svg)](https://www.npmjs.com/package/@heroku-cli/plugin-spaces)

<!-- commands -->
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
* [`heroku spaces:vpn:wait`](#heroku-spacesvpnwait)
* [`heroku spaces:wait`](#heroku-spaceswait)
* [`heroku trusted-ips`](#heroku-trusted-ips)
* [`heroku trusted-ips:add SOURCE`](#heroku-trusted-ipsadd-source)
* [`heroku trusted-ips:remove SOURCE`](#heroku-trusted-ipsremove-source)

## `heroku spaces`

list available spaces

```
USAGE
  $ heroku spaces

OPTIONS
  -t, --team=team  team to use
  --json           output in json format
```

## `heroku spaces:create`

create a new space

```
USAGE
  $ heroku spaces:create

OPTIONS
  -s, --space=space      name of space to create
  -t, --team=team        team to use
  --cidr=cidr            RFC-1918 CIDR the space will use
  --data-cidr=data-cidr  RFC-1918 CIDR used by Heroku Data resources for the space
  --region=region        region name

DESCRIPTION
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
  $ heroku spaces:destroy

OPTIONS
  -s, --space=space  space to destroy
  --confirm=confirm  set to space name to bypass confirm prompt

DESCRIPTION
  Example:

       $ heroku spaces:destroy --space my-space
       Destroying my-space... done
```

## `heroku spaces:info`

show info about a space

```
USAGE
  $ heroku spaces:info

OPTIONS
  -s, --space=space  space to get info of
  --json             output in json format
```

## `heroku spaces:peering:info`

display the information necessary to initiate a peering connection

```
USAGE
  $ heroku spaces:peering:info

OPTIONS
  -s, --space=space  space to get peering info from
  --json             output in json format

DESCRIPTION
  Example:

       $ heroku spaces:peering:info example-space
       === example-space Peering Info
       AWS Account ID:    012345678910
       AWS Region:        us-west-2
       AWS VPC ID:        vpc-baadf00d
       AWS VPC CIDR:      10.0.0.0/16
       Space CIDRs:       10.0.128.0/20, 10.0.144.0/20
       Unavailable CIDRs: 10.1.0.0/16

  You will use the information provied by this command to establish a peering connection request from your AWS VPC to 
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
  $ heroku spaces:peerings

OPTIONS
  -s, --space=space  space to get peer list from
  --json             output in json format
```

## `heroku spaces:peerings:accept`

accepts a pending peering request for a private space

```
USAGE
  $ heroku spaces:peerings:accept

OPTIONS
  -p, --pcxid=pcxid  PCX ID of a pending peering
  -s, --space=space  space to get peering info from

DESCRIPTION
  Example:

       $ heroku spaces:peerings:accept pcx-4bd27022 --space example-space
       Accepting and configuring peering connection pcx-4bd27022
```

## `heroku spaces:peerings:destroy`

destroys an active peering connection in a private space

```
USAGE
  $ heroku spaces:peerings:destroy

OPTIONS
  -p, --pcxid=pcxid  PCX ID of a pending peering
  -s, --space=space  space to get peering info from
  --confirm=confirm  set to PCX ID to bypass confirm prompt

DESCRIPTION
  Example:

       $ heroku spaces:peerings:destroy pcx-4bd27022 --confirm pcx-4bd27022 --space example-space
       Tearing down peering connection pcx-4bd27022
```

## `heroku spaces:ps`

list dynos for a space

```
USAGE
  $ heroku spaces:ps

OPTIONS
  -s, --space=space  space to get dynos of
  --json             output in json format
```

## `heroku spaces:rename`

renames a space

```
USAGE
  $ heroku spaces:rename

OPTIONS
  --from=from  (required) current name of space
  --to=to      (required) desired name of space

DESCRIPTION
  Example:

       $ heroku spaces:rename --from old-space-name --to new-space-name
       Renaming space old-space-name to new-space-name... done
```

## `heroku spaces:topology`

show space topology

```
USAGE
  $ heroku spaces:topology

OPTIONS
  -s, --space=space  space to get topology of
  --json             output in json format
```

## `heroku spaces:transfer`

transfer a space to another team

```
USAGE
  $ heroku spaces:transfer

OPTIONS
  --space=space  (required) name of space
  --team=team    (required) desired owner of space

DESCRIPTION
  Example:

       $ heroku spaces:transfer --space=space-name --team=team-name
       Transferring space-name to team-name... done
```

## `heroku spaces:vpn:config`

display the configuration information for VPN

```
USAGE
  $ heroku spaces:vpn:config

OPTIONS
  -n, --name=name    name or id of the VPN connection to retrieve config from
  -s, --space=space  space the VPN connection belongs to
  --json             output in json format

DESCRIPTION
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
  $ heroku spaces:vpn:connect

OPTIONS
  -c, --cidrs=cidrs  a list of routable CIDRs separated by commas
  -i, --ip=ip        public IP of customer gateway
  -n, --name=name    VPN name
  -s, --space=space  space name

DESCRIPTION
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
  $ heroku spaces:vpn:connections

OPTIONS
  -s, --space=space  space to get VPN connections from
  --json             output in json format

DESCRIPTION
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
  $ heroku spaces:vpn:destroy

OPTIONS
  -n, --name=name    name or id of the VPN connection to retrieve config from
  -s, --space=space  space to get peering info from
  --confirm=confirm  set to VPN connection name to bypass confirm prompt

DESCRIPTION
  Example:

       $ heroku spaces:vpn:destroy --space example-space vpn-connection-name --confirm vpn-connection-name
       Tearing down VPN Connection vpn-connection-name in space example-space
```

## `heroku spaces:vpn:info`

display the information for VPN

```
USAGE
  $ heroku spaces:vpn:info

OPTIONS
  -n, --name=name    name or id of the VPN connection to get info from
  -s, --space=space  space the vpn connection belongs to
  --json             output in json format

DESCRIPTION
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

## `heroku spaces:vpn:wait`

wait for VPN Connection to be created

```
USAGE
  $ heroku spaces:vpn:wait

OPTIONS
  -i, --interval=interval  seconds to wait between poll intervals
  -n, --name=name          name or id of the vpn connection to wait for
  -s, --space=space        space the vpn connection belongs to
  -t, --timeout=timeout    maximum number of seconds to wait
  --json                   output in json format
```

## `heroku spaces:wait`

wait for a space to be created

```
USAGE
  $ heroku spaces:wait

OPTIONS
  -i, --interval=interval  seconds to wait between poll intervals
  -s, --space=space        space to get info of
  -t, --timeout=timeout    maximum number of seconds to wait
  --json                   output in json format
```

## `heroku trusted-ips`

list trusted IP ranges for a space

```
USAGE
  $ heroku trusted-ips

OPTIONS
  -s, --space=space  space to get inbound rules from
  --json             output in json format

DESCRIPTION
  Trusted IP ranges are only available on Private Spaces.

  The space name is a required parameter. Newly created spaces will have 0.0.0.0/0 set by default
  allowing all traffic to applications in the space. More than one CIDR block can be provided at
  a time to the commands listed below. For example 1.2.3.4/20 and 5.6.7.8/20 can be added with:
```

## `heroku trusted-ips:add SOURCE`

Add one range to the list of trusted IP ranges

```
USAGE
  $ heroku trusted-ips:add SOURCE

OPTIONS
  -s, --space=space  space to add rule to
  --confirm=confirm  set to space name to bypass confirm prompt

DESCRIPTION
  Uses CIDR notation.

  Example:

       $ heroku trusted-ips:add --space my-space 192.168.2.0/24
       Added 192.168.0.1/24 to trusted IP ranges on my-space
```

## `heroku trusted-ips:remove SOURCE`

Remove a range from the list of trusted IP ranges

```
USAGE
  $ heroku trusted-ips:remove SOURCE

OPTIONS
  --confirm=confirm  set to space name to bypass confirm prompt
  --space=space      (required) space to remove rule from

DESCRIPTION
  Uses CIDR notation.

  Example:

       $ heroku trusted-ips:remove --space my-space 192.168.2.0/24
       Removed 192.168.2.0/24 from trusted IP ranges on my-space
```
<!-- commandsstop -->
