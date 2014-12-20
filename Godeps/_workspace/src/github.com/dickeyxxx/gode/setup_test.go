package gode

import (
	"io/ioutil"
	"os"
	"testing"
)

func TestSetup(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping in short mode")
	}
	err := os.MkdirAll("tmp", 0777)
	must(err)
	dir, err := ioutil.TempDir("tmp", "gode")
	must(err)
	defer os.RemoveAll(dir)
	c := NewClient(dir)
	must(c.Setup())
	if !c.IsSetup() {
		t.Fail()
	}
}

func TestWindowsSetup(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping in short mode")
	}
	err := os.MkdirAll("tmp", 0777)
	must(err)
	dir, err := ioutil.TempDir("tmp", "gode")
	must(err)
	defer os.RemoveAll(dir)
	c := NewClient(dir)
	must(c.setupWindows())
	if !c.IsSetup() {
		t.Fail()
	}
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}

func setup() *Client {
	c := NewClient("tmp")
	must(c.Setup())
	return c
}
