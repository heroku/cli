gode
====

[![Build Status](https://travis-ci.org/dickeyxxx/gode.svg?branch=master)](https://travis-ci.org/dickeyxxx/gode)
[![Code Coverage](http://gocover.io/_badge/github.com/dickeyxxx/gode)](http://gocover.io/github.com/dickeyxxx/gode)
[![GoDoc](https://godoc.org/github.com/dickeyxxx/gode?status.svg)](https://godoc.org/github.com/dickeyxxx/gode)

gode runs a sandboxed node installation to run node code and install npm packages.

Usage
-----

Gode will autoinstall Node and npm if it's not in the specified working directory.

To use gode, first give it a working directory. In this case, `~/.gode`. You would need to already have a homeDir variable for this to work.

```go
c := NewClient(filepath.Join(homeDir, ".gode"))
```

Next, call `c.Setup()` to ensure that gode is setup properly in that working directory.

```go
err := c.Setup()
if err != nil {
    panic(err)
}
```

Finally, execute a node script. This returns an `*os/exec.Cmd`:

```go
output, err := c.RunScript(`console.log("hello world!")`).CombinedOutput()
if err != nil {
    panic(err)
}
fmt.Println(string(output))
```

Or install packages:

```go
err := c.InstallPackage("request")
if err != nil {
    panic(err)
}
```
