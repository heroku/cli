package gode

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

// RunScript runs a given script in node
// Returns an *os/exec.Cmd instance
func RunScript(script string) (cmd *exec.Cmd, done func()) {
	useTmpFile := true
	f, err := ioutil.TempFile("", "heroku-script-")
	if err != nil {
		useTmpFile = false
		log.Println(err)
	}
	defer f.Close()
	if _, err := f.WriteString(script); err != nil {
		useTmpFile = false
		log.Println(err)
	}
	if useTmpFile {
		cmd = exec.Command(nodeBinPath, f.Name())
	} else {
		cmd = exec.Command(nodeBinPath, "-e", script)
	}
	cmd.Env = append([]string{"NODE_PATH=" + modulesDir}, os.Environ()...)
	cmd.Dir = rootPath
	if debugging() {
		log.Printf("running node NODE_PATH=%s %s\n%s\n", modulesDir, cmd.Path, script)
	}
	return cmd, func() {
		os.Remove(f.Name())
	}
}

// DebugScript is the same as RunScript except it launches with node-inspector
func DebugScript(script string) *exec.Cmd {
	scriptPath := filepath.Join(rootPath, "debug.js")
	if err := ioutil.WriteFile(scriptPath, []byte(script), 0644); err != nil {
		panic(err)
	}
	path := filepath.Join(rootPath, "node_modules", ".bin", "node-debug")
	if _, err := exec.LookPath(path); err != nil {
		fmt.Print("Installing node-inspector...")
		InstallPackages("node-inspector")
		fmt.Println(" done")
	}
	cmd := exec.Command(path, "debug.js")
	cmd.Dir = rootPath
	return cmd
}
