package main

import (
	"github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = ginkgo.Describe("parseVarArgs", func() {
	test := func(title string, command *Command, args []string, expectedResult []string, expectedFlags map[string]interface{}, expectedErr string) {
		ginkgo.It(title, func() {
			result, flags, err := parseVarArgs(command, args)
			if expectedErr != "" {
				Expect(err.Error()).To(Equal(expectedErr))
				Expect(result).To(BeNil())
				Expect(flags).To(BeNil())
			} else {
				Expect(err).ShouldNot(HaveOccurred())
				Expect(result).To(Equal(expectedResult))
				Expect(flags).To(Equal(expectedFlags))
			}
		})
	}

	kvFlag := Flag{
		Name:     "key",
		Char:     "k",
		HasValue: true,
	}

	barArg := Arg{
		Name: "bar",
	}

	test("has no args or flags",
		&Command{Topic: "foo", Command: "", VariableArgs: true},
		// args
		[]string{},
		// result
		[]string{},
		// flags
		map[string]interface{}{},
		// err
		"",
	)
	test("has one short flag",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
		},
		// args
		[]string{"-k", "value"},
		// result
		[]string{},
		// flags
		map[string]interface{}{
			"key": "value",
		},
		// err
		"",
	)
	test("has one long flag",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
		},
		// args
		[]string{"--key", "value"},
		// result
		[]string{},
		// flags
		map[string]interface{}{
			"key": "value",
		},
		// err
		"",
	)
	test("has one vararg",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Args:         []Arg{barArg},
		},
		// args
		[]string{"bar=baz"},
		// result
		[]string{"bar=baz"},
		// flags
		map[string]interface{}{},
		// err
		"",
	)
	test("has one short flag and one vararg",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
			Args:         []Arg{barArg},
		},
		// args
		[]string{"-k", "value", "bar=baz"},
		// result
		[]string{"bar=baz"},
		// flags
		map[string]interface{}{
			"key": "value",
		},
		// err
		"",
	)
	test("has one long flag and one vararg",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
			Args:         []Arg{barArg},
		},
		// args
		[]string{"--key", "value", "bar=baz"},
		// result
		[]string{"bar=baz"},
		// flags
		map[string]interface{}{
			"key": "value",
		},
		// err
		"",
	)
	test("has one incorrect short flag",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
		},
		// args
		[]string{"-z", "value"},
		// result
		[]string{"value"},
		// flags
		map[string]interface{}{},
		// err
		"",
	)
	test("has one incorrect long flag",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
		},
		// args
		[]string{"--zey", "value"},
		// result
		[]string{"value"},
		// flags
		map[string]interface{}{},
		// err
		"",
	)
	test("has one incorrect short flag and one vararg",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
			Args:         []Arg{barArg},
		},
		// args
		[]string{"-z", "value", "bar=baz"},
		// result
		[]string{"value", "bar=baz"},
		// flags
		map[string]interface{}{},
		// err
		"",
	)
	test("has one incorrect long flag and one vararg",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
			Args:         []Arg{barArg},
		},
		// args
		[]string{"--zey", "value", "bar=baz"},
		// result
		[]string{"value", "bar=baz"},
		// flags
		map[string]interface{}{},
		// err
		"",
	)
	test("stops parsing",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
			Args:         []Arg{barArg},
		},
		// args
		[]string{"-k", "value", "--", "-k", "value2"},
		// result
		[]string{"-k", "value2"},
		// flags
		map[string]interface{}{
			"key": "value",
		},
		// err
		"",
	)
	test("supports short help",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
			Args:         []Arg{barArg},
		},
		// args
		[]string{"-h"},
		// result
		[]string{},
		// flags
		map[string]interface{}{},
		// err
		"help",
	)
	test("supports long help",
		&Command{
			Topic:        "foo",
			Command:      "",
			VariableArgs: true,
			Flags:        []Flag{kvFlag},
			Args:         []Arg{barArg},
		},
		// args
		[]string{"--help"},
		// result
		[]string{},
		// flags
		map[string]interface{}{},
		// err
		"help",
	)
})
