package golock

import (
	"math/rand"
	"os"
	"strconv"
	"testing"
	"time"
)

var testTmpDir = "tmp/test"

func TestMain(m *testing.M) {
	setup()
	c := m.Run()
	teardown()
	os.Exit(c)
}

func setup() {
	if err := os.MkdirAll(testTmpDir, 0755); err != nil {
		panic(err)
	}
}

func teardown() {
	if err := os.RemoveAll(testTmpDir); err != nil {
		panic(err)
	}
}

func TestLock(t *testing.T) {
	path := newLockfilePath()
	if err := Lock(path); err != nil {
		t.Error(err)
	}
	c := make(chan bool)
	go func() {
		if err := Lock(path); err != nil {
			t.Error(err)
		}
		c <- true
	}()
	select {
	case <-c:
		t.Error("expected lockfile to be in use")
	case <-time.After(50 * time.Millisecond):
		return
	}
}

func TestDeadPid(t *testing.T) {
	path := newLockfilePath()
	if err := tryLock(path, getDeadPid()); err != nil {
		t.Error(err)
	}
	if err := tryLock(path, os.Getpid()); err != nil {
		t.Error(err)
	}
}

func TestUnlock(t *testing.T) {
	path := newLockfilePath()
	if err := Lock(path); err != nil {
		t.Error(err)
	}
	if err := Unlock(path); err != nil {
		t.Error(err)
	}
	if err := Lock(path); err != nil {
		t.Error(err)
	}
}

func newLockfilePath() string {
	return testTmpDir + "/lockfile-" + strconv.Itoa(rand.Int())
}

func getDeadPid() int {
	return 50000 // this might actually be active
}
