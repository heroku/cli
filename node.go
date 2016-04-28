package main

import (
	"io/ioutil"
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
		cmd = exec.Command(nodeBinPath(), f.Name())
	} else {
		cmd = exec.Command(nodeBinPath(), "-e", script)
	}
	cmd.Env = append([]string{"NODE_PATH=" + p.modulesPath()}, os.Environ()...)
	return cmd, func() {
		os.Remove(f.Name())
	}
}

func nodeBinPath() string {
	b := os.Getenv("HEROKU_NODE_PATH")
	ext := ""
	if runtime.GOOS == WINDOWS {
		ext = ".exe"
	}
	if b == "" {
		b = filepath.Join(AppDir, "lib", "node-"+NodeVersion+ext)
	}
	if exists, _ := fileExists(b); !exists {
		var err error
		Debugf("node not found in %s. Using node from PATH\n", b)
		b, err = exec.LookPath("node" + ext)
		must(err)
	}
	return b
}

func (p *Plugins) modulesPath() string {
	return filepath.Join(p.Path, "node_modules")
}
