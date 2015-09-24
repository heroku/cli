# netrc [![Build Status](https://travis-ci.org/dickeyxxx/netrc.svg?branch=master)](https://travis-ci.org/dickeyxxx/netrc) [![GoDoc](https://godoc.org/github.com/dickeyxxx/netrc?status.svg)](http://godoc.org/github.com/dickeyxxx/netrc)

A netrc parser for Go.

# Usage

Getting credentials for a host.

```go
usr, err := user.Current()
n, err := netrc.Parse(filepath.Join(usr.HomeDir, ".netrc"))
fmt.Println(n.Machine("api.heroku.com").Get("password"))
```

Setting credentials on a host.

```go
usr, err := user.Current()
n, err := netrc.Parse(filepath.Join(usr.HomeDir, ".netrc"))
n.Machine("api.heroku.com").Set("password", "newapikey")
n.Save()
```
