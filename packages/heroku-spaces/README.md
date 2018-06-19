heroku-spaces CLI plugin [![Circle CI](https://circleci.com/gh/heroku/heroku-spaces.svg?style=svg&circle-token=99951d0283972db74af1fa0f5dc179ebf6d85963)](https://circleci.com/gh/heroku/heroku-spaces)
===========

[![npm version](https://img.shields.io/npm/v/@heroku-cli/plugin-spaces.svg)](https://www.npmjs.com/package/@heroku-cli/plugin-spaces)

<!-- commands -->
* [`heroku outbound-rules`](#heroku-outbound-rules)
* [`heroku outbound-rules:add`](#heroku-outbound-rulesadd)
* [`heroku outbound-rules:remove RULENUMBER`](#heroku-outbound-rulesremove-rulenumber)
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
* [`heroku spaces:wait`](#heroku-spaceswait)
* [`heroku trusted-ips`](#heroku-trusted-ips)
* [`heroku trusted-ips:add SOURCE`](#heroku-trusted-ipsadd-source)
* [`heroku trusted-ips:remove SOURCE`](#heroku-trusted-ipsremove-source)

## `heroku outbound-rules`

list Outbound Rules for a space

```
USAGE
  $ heroku outbound-rules

OPTIONS
  -s, --space=space  space to get outbound rules from
  --json             output in json format

DESCRIPTION

  Outbound Rules are only available on Private Spaces.

  Newly created spaces will have an "Allow All" rule set by default
  allowing all egress dyno traffic outside of the space.  You can
  remove this default rule to completely stop your private dynos from
  talking to the world.

  You can add specific rules that only allow your dyno to communicate with trusted hosts.
```

## `heroku outbound-rules:add`

Add outbound rules to a Private Space

```
USAGE
  $ heroku outbound-rules:add

OPTIONS
  -s, --space=space    space to add rule to
  --confirm=confirm    set to space name to bypass confirm prompt
  --dest=dest          target CIDR block dynos are allowed to communicate with

  --port=port          the port dynos are allowed to use when communicating with hosts in destination CIDR block.
                       Accepts a range in `<lowest port>-<highest port>` format. 0 is the minimum. The maximum port
                       allowed is 65535, except for ICMP with a maximum of 255.

  --protocol=protocol  the protocol dynos are allowed to use when communicating with hosts in destination CIDR block.
                       Valid protocols are "tcp", "udp", "icmp", "0-255" and "any".

DESCRIPTION

  The destination flag uses CIDR notation.

    Example:

       $ heroku outbound-rules:add --space my-space --dest 192.168.2.0/24 --protocol tcp --port 80
       Added 192.168.0.1/24 to the outbound rules on my-space

    Example with port range:

       $ heroku outbound-rules:add --space my-space --dest 192.168.2.0/24 --protocol tcp --port 80-100
       Added 192.168.0.1/24 to the outbound rules on my-space

    Example opening up everything

       $ heroku outbound-rules:add --space my-space --dest 0.0.0.0/0 --protocol any --port any
       Added 0.0.0.0/0 to the outbound rules on my-space

  ICMP Rules
  The ICMP protocol has types, not ports, but the underlying systems treat them as the same. For this reason,
  when you want to allow ICMP traffic you will use the --port flag to specify the ICMP types you want to
  allow. ICMP types are numbered, 0-255.
```

## `heroku outbound-rules:remove RULENUMBER`

Remove a Rules from the list of Outbound Rules

```
USAGE
  $ heroku outbound-rules:remove RULENUMBER

OPTIONS
  --confirm=confirm  set to space name to bypass confirm prompt
  --space=space      (required) space to remove rule from

DESCRIPTION
  Example:

       $ heroku outbound-rules:remove --space my-space 4
       Removed 192.168.2.0/24 from trusted IP ranges on my-space
```

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
  -s, --space=space  name of space to create
  -t, --team=team    team to use
  --region=region    region name

DESCRIPTION
  Example:

       $ heroku spaces:create --space my-space --team my-team --region oregon
       Creating space my-space in team my-team... done
       === my-space
       ID:         e7b99e37-69b3-4475-ad47-a5cc5d75fd9f
       Team:       my-team
       Region:     oregon
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
       Dyno CIDRs:        10.0.128.0/20, 10.0.144.0/20
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
