package main

import (
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// NodeVersion is the current node version
var NodeVersion = "?"

// RunScript runs some node code
func (p *Plugins) RunScript(script string) (cmd *exec.Cmd, done func()) {
	useTmpFile := true
	f, err := ioutil.TempFile("", "heroku-script-")
	if err != nil {
		useTmpFile = false
		LogIfError(err)
	}
	defer f.Close()
	if _, err := f.WriteString(script); err != nil {
		useTmpFile = false
		LogIfError(err)
	}
	if useTmpFile {
		cmd = exec.Command(p.nodeBinPath(), f.Name())
	} else {
		cmd = exec.Command(p.nodeBinPath(), "-e", script)
	}
	cmd.Env = append([]string{"NODE_PATH=" + p.modulesPath()}, os.Environ()...)
	if debugging {
		log.Printf("running node NODE_PATH=%s %s\n%s\n", p.modulesPath(), cmd.Path, script)
	}
	return cmd, func() {
		os.Remove(f.Name())
	}
}

func (p *Plugins) nodeBinPath() string {
	b := os.Getenv("HEROKU_NODE_PATH")
	if b == "" {
		b = filepath.Join(AppDir, "lib", "node-"+NodeVersion)
	}
	if runtime.GOOS == WINDOWS {
		b = b + ".exe"
	}
	if exists, _ := fileExists(b); !exists {
		var err error
		b, err = exec.LookPath("node")
		must(err)
	}
	return b
}

func (p *Plugins) modulesPath() string {
	return filepath.Join(p.Path, "node_modules")
}
