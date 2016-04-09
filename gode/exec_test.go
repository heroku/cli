package gode

import (
	"fmt"
	"os"
)

func ExampleRunScript() {
	SetRootPath(os.TempDir())
	err := Setup()
	if err != nil {
		panic(err)
	}
	cmd, done := RunScript(`console.log("hello world!")`)
	output, err := cmd.CombinedOutput()
	if err != nil {
		panic(err)
	}
	fmt.Println(string(output))
	// Output:
	// hello world!
	done()
}
