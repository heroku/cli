package gode

import "fmt"

func ExampleClient_RunScript() {
	c := NewClient("tmp")
	err := c.Setup()
	if err != nil {
		panic(err)
	}
	output, err := c.RunScript(`console.log("hello world!")`).CombinedOutput()
	if err != nil {
		panic(err)
	}
	fmt.Println(string(output))
	// Output:
	// hello world!
}
