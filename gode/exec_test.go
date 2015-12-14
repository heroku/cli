package gode

import "fmt"

func ExampleRunScript() {
	SetRootPath("tmp")
	err := Setup()
	if err != nil {
		panic(err)
	}
	output, err := RunScript(`console.log("hello world!")`).CombinedOutput()
	if err != nil {
		panic(err)
	}
	fmt.Println(string(output))
	// Output:
	// hello world!
}
