heroku spaces
=============

manage heroku private spaces
# Commands

* [heroku spaces [OPTIONS]](#spaces)
* [heroku spaces:create [OPTIONS]](#spacescreate)
* [heroku spaces:destroy [OPTIONS]](#spacesdestroy)
* [heroku spaces:info [OPTIONS]](#spacesinfo)
* [heroku spaces:peering:info [OPTIONS]](#spacespeeringinfo)
* [heroku spaces:peerings [OPTIONS]](#spacespeerings)
* [heroku spaces:peerings:accept [OPTIONS]](#spacespeeringsaccept)
* [heroku spaces:peerings:destroy [OPTIONS]](#spacespeeringsdestroy)
* [heroku spaces:ps [OPTIONS]](#spacesps)
* [heroku spaces:rename [OPTIONS]](#spacesrename)
* [heroku spaces:topology [OPTIONS]](#spacestopology)
* [heroku spaces:wait [OPTIONS]](#spaceswait)
## spaces

list available spaces

```
USAGE
  $ heroku spaces [OPTIONS]

OPTIONS
  -t, --team=team  team to use
  --json           output in json format
```

### spaces:create

create a new space

```
USAGE
  $ heroku spaces:create [OPTIONS]

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

### spaces:destroy

destroy a space

```
USAGE
  $ heroku spaces:destroy [OPTIONS]

OPTIONS
  -s, --space=space  space to destroy
  --confirm=confirm  set to space name to bypass confirm prompt

DESCRIPTION
  Example:

       $ heroku spaces:destroy --space my-space
       Destroying my-space... done
```

### spaces:info

show info about a space

```
USAGE
  $ heroku spaces:info [OPTIONS]

OPTIONS
  -s, --space=space  space to get info of
  --json             output in json format
```

### spaces:peering:info

display the information necessary to initiate a peering connection

```
USAGE
  $ heroku spaces:peering:info [OPTIONS]

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

### spaces:peerings

list peering connections for a space

```
USAGE
  $ heroku spaces:peerings [OPTIONS]

OPTIONS
  -s, --space=space  space to get peer list from
  --json             output in json format
```

#### spaces:peerings:accept

accepts a pending peering request for a private space

```
USAGE
  $ heroku spaces:peerings:accept [OPTIONS]

OPTIONS
  -p, --pcxid=pcxid  PCX ID of a pending peering
  -s, --space=space  space to get peering info from

DESCRIPTION
  Example:

       $ heroku spaces:peerings:accept pcx-4bd27022 --space example-space
       Accepting and configuring peering connection pcx-4bd27022
```

#### spaces:peerings:destroy

destroys an active peering connection in a private space

```
USAGE
  $ heroku spaces:peerings:destroy [OPTIONS]

OPTIONS
  -p, --pcxid=pcxid  PCX ID of a pending peering
  -s, --space=space  space to get peering info from
  --confirm=confirm  set to PCX ID to bypass confirm prompt

DESCRIPTION
  Example:

       $ heroku peerings:destroy pcx-4bd27022 --confirm pcx-4bd27022 --space example-space
       Tearing down peering connection pcx-4bd27022
```

### spaces:peerings:accept

accepts a pending peering request for a private space

```
USAGE
  $ heroku spaces:peerings:accept [OPTIONS]

OPTIONS
  -p, --pcxid=pcxid  PCX ID of a pending peering
  -s, --space=space  space to get peering info from

DESCRIPTION
  Example:

       $ heroku spaces:peerings:accept pcx-4bd27022 --space example-space
       Accepting and configuring peering connection pcx-4bd27022
```

### spaces:peerings:destroy

destroys an active peering connection in a private space

```
USAGE
  $ heroku spaces:peerings:destroy [OPTIONS]

OPTIONS
  -p, --pcxid=pcxid  PCX ID of a pending peering
  -s, --space=space  space to get peering info from
  --confirm=confirm  set to PCX ID to bypass confirm prompt

DESCRIPTION
  Example:

       $ heroku peerings:destroy pcx-4bd27022 --confirm pcx-4bd27022 --space example-space
       Tearing down peering connection pcx-4bd27022
```

### spaces:ps

list dynos for a space

```
USAGE
  $ heroku spaces:ps [OPTIONS]

OPTIONS
  -s, --space=space  space to get dynos of
  --json             output in json format
```

### spaces:rename

renames a space

```
USAGE
  $ heroku spaces:rename [OPTIONS]

OPTIONS
  --from=from  (required) current name of space
  --to=to      (required) desired name of space

DESCRIPTION
  Example:

       $ heroku spaces:rename --from old-space-name --to new-space-name
       Renaming space old-space-name to new-space-name... done
```

### spaces:topology

show space topology

```
USAGE
  $ heroku spaces:topology [OPTIONS]

OPTIONS
  -s, --space=space  space to get topology of
  --json             output in json format
```

### spaces:wait

wait for a space to be created

```
USAGE
  $ heroku spaces:wait [OPTIONS]

OPTIONS
  -i, --interval=interval  seconds to wait between poll intervals
  -s, --space=space        space to get info of
  -t, --timeout=timeout    maximum number of seconds to wait
  --json                   output in json format
```
