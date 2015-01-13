package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"testing"

	c "github.com/smartystreets/goconvey/convey"
)

func TestCommand(t *testing.T) {
	c.Convey("Usage()", t, func() {
		c.Convey("basic", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "info",
			}
			c.So(cmd.Usage(), c.ShouldEqual, "apps:info")
		})
		c.Convey("topic root command", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "",
			}
			c.So(cmd.Usage(), c.ShouldEqual, "apps")
		})
		c.Convey("with app", func() {
			cmd := &Command{
				Topic:    "apps",
				Command:  "info",
				NeedsApp: true,
			}
			c.So(cmd.Usage(), c.ShouldEqual, "apps:info --app APP")
		})
		c.Convey("with required argument", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "info",
				Args:    []Arg{{Name: "foo"}},
			}
			c.So(cmd.Usage(), c.ShouldEqual, "apps:info FOO")
		})
		c.Convey("with optional argument", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "info",
				Args:    []Arg{{Name: "foo", Optional: true}},
			}
			c.So(cmd.Usage(), c.ShouldEqual, "apps:info [FOO]")
		})
		c.Convey("with multiple arguments", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "info",
				Args:    []Arg{{Name: "foo"}, {Name: "bar"}},
			}
			c.So(cmd.Usage(), c.ShouldEqual, "apps:info FOO BAR")
		})
		c.Convey("with a flag argument", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "info",
				Flags:   []Flag{{Name: "foo"}},
			}
			c.So(cmd.Usage(), c.ShouldEqual, "apps:info [--foo]")
		})
	})

	c.Convey("commands", t, func() {
		stdout := &bytes.Buffer{}
		Stdout = stdout
		commandsListCmd.Run(&Context{})
		var result map[string]interface{}
		fmt.Println(stdout.String())
		json.Unmarshal(stdout.Bytes(), &result)
		c.So(result["commands"], c.ShouldEqual, `{"name":"commads",`)
	})
}
