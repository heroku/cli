package main

import (
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// RunScript runs some node code
func (p *Plugins) RunScript(script string) (cmd *exec.Cmd, done func()) {
	cacheTmp := filepath.Join(CacheHome, "tmp")
	os.MkdirAll(cacheTmp, 0755)
	f, _ := ioutil.TempFile(cacheTmp, "heroku-script-")
	if f != nil {
		defer f.Close()
		if _, err := f.WriteString(script); err != nil {
			LogIfError(err)
		}
		cmd = exec.Command(nodeBinPath(), f.Name())
	} else {
		cmd = exec.Command(nodeBinPath(), "-e", script)
	}
	cmd.Env = append([]string{"NODE_PATH=" + p.modulesPath(), "HEROKU_EXECUTABLE_NAME=" + getExecutableName()}, os.Environ()...)
	return cmd, func() {
		if f != nil {
			os.Remove(f.Name())
		}
	}
}

func nodeBinPath() string {
	b := os.Getenv("HEROKU_NODE_PATH")
	ext := ""
	if runtime.GOOS == WINDOWS {
		ext = ".exe"
	}
	if b == "" {
		b = filepath.Join(AppDir, "lib", "node"+ext)
	}
	if exists, _ := FileExists(b); !exists {
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
