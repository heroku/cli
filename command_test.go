package main

import "testing"

func TestCommand(t *testing.T) {
	tests := []struct {
		Title    string
		Command  *Command
		Expected string
	}{
		{"basic", &Command{Topic: "apps", Command: "info"}, "apps:info"},
		{"topic root command", &Command{Topic: "apps", Command: ""}, "apps"},
		{"with required argument", &Command{Topic: "apps", Command: "info", Args: []Arg{{Name: "foo"}}}, "apps:info FOO"},
		{"with optional argument", &Command{Topic: "apps", Command: "info", Args: []Arg{{Name: "foo", Optional: true}}}, "apps:info [FOO]"},
		{"with multiple arguments", &Command{Topic: "apps", Command: "info", Args: []Arg{{Name: "foo"}, {Name: "bar"}}}, "apps:info FOO BAR"},
	}
	for _, test := range tests {
		if commandUsage(test.Command) != test.Expected {
			t.Error(test.Title)
		}
	}
}
