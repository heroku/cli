package gode

import (
	"io/ioutil"
	"log"
	"os"
	"testing"
	"time"

	"github.com/franela/goreq"
)

func TestSetup(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping in short mode")
	}
	err := os.MkdirAll("tmp", 0755)
	must(err)
	dir, err := ioutil.TempDir("tmp", "gode")
	must(err)
	defer os.RemoveAll(dir)
	SetRootPath(dir)
	must(Setup())
	if setup, _ := IsSetup(); !setup {
		t.Fatal("IsSetup() returned false")
	}
}

func TestSetupInvalidSha(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping in short mode")
	}
	err := os.MkdirAll("tmp", 0755)
	must(err)
	dir, err := ioutil.TempDir("tmp", "gode")
	must(err)
	defer os.RemoveAll(dir)
	SetRootPath(dir)
	target := targets[0]
	target.Sha = "INVALID"
	err = target.setup()
	if err != errInvalidSha {
		t.Fatal("Setup with invalid SHA")
	}
}

func TestWindowsSetup(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping in short mode")
	}
	err := os.MkdirAll("tmp", 0755)
	must(err)
	dir, err := ioutil.TempDir("tmp", "gode")
	must(err)
	defer os.RemoveAll(dir)
	SetRootPath(dir)
	target := getWindowsTarget()
	must(target.setup())
	if setup, _ := target.isSetup(); !setup {
		t.Fatal("IsSetup() returned false")
	}
}

func must(err error) {
	if err != nil {
		log.Println(err)
		panic(err)
	}
}

func setup() {
	goreq.SetConnectTimeout(15 * time.Second)
	SetRootPath("tmp")
	must(Setup())
}

func getWindowsTarget() *Target {
	for _, t := range targets {
		if t.OS == "windows" {
			return &t
		}
	}
	return nil
}
