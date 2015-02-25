package main

import (
	"testing"

	c "github.com/smartystreets/goconvey/convey"
)

func TestCommand(t *testing.T) {
	c.Convey("commandUsage()", t, func() {
		c.Convey("basic", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "info",
			}
			c.So(commandUsage(cmd), c.ShouldEqual, "apps:info")
		})
		c.Convey("topic root command", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "",
			}
			c.So(commandUsage(cmd), c.ShouldEqual, "apps")
		})
		c.Convey("with required argument", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "info",
				Args:    []Arg{{Name: "foo"}},
			}
			c.So(commandUsage(cmd), c.ShouldEqual, "apps:info FOO")
		})
		c.Convey("with optional argument", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "info",
				Args:    []Arg{{Name: "foo", Optional: true}},
			}
			c.So(commandUsage(cmd), c.ShouldEqual, "apps:info [FOO]")
		})
		c.Convey("with multiple arguments", func() {
			cmd := &Command{
				Topic:   "apps",
				Command: "info",
				Args:    []Arg{{Name: "foo"}, {Name: "bar"}},
			}
			c.So(commandUsage(cmd), c.ShouldEqual, "apps:info FOO BAR")
		})
	})
}
