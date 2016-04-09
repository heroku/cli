package gode

import (
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
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

func TestSetupInvalidSha(test *testing.T) {
	if testing.Short() {
		test.Skip("skipping in short mode")
	}
	err := os.MkdirAll("tmp", 0755)
	must(err)
	dir, err := ioutil.TempDir("tmp", "gode")
	must(err)
	defer os.RemoveAll(dir)
	SetRootPath(dir)
	t = &targets[0]
	t.Sha = "INVALID"
	err = Setup()
	if err != errInvalidSha {
		test.Fatal("Setup with invalid SHA")
	}
}

func TestWindowsSetup(test *testing.T) {
	if testing.Short() {
		test.Skip("skipping in short mode")
	}
	err := os.MkdirAll("tmp", 0755)
	must(err)
	dir, err := ioutil.TempDir("", "gode")
	must(err)
	defer os.RemoveAll(dir)
	SetRootPath(dir)
	os.Chdir(dir)
	t = getWindowsTarget()
	must(Setup())
	if setup, _ := IsSetup(); !setup {
		test.Fatal("IsSetup() returned false")
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
	dir, _ := filepath.Abs("tmp")
	SetRootPath(dir)
	must(Setup())
}

func getWindowsTarget() *target {
	for _, t := range targets {
		if t.OS == "windows" {
			return &t
		}
	}
	return nil
}
