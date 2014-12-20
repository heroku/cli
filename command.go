package main

import "strings"

type Topic struct {
	Name      string
	ShortHelp string
	Help      string
	Hidden    bool
	Commands  []*Command
}

func (t *Topic) String() string {
	return t.Name
}

type Command struct {
	Topic     string
	Name      string
	ShortHelp string
	Help      string
	Hidden    bool
	NeedsApp  bool
	NeedsAuth bool
	Args      []*Arg
	Flags     []*Flag
	Run       func(ctx *Context) `json:"-"`
}

func (c *Command) String() string {
	return c.Name
}

func (t *Topic) GetCommand(name string) (command *Command) {
	for _, command := range t.Commands {
		if name == command.Name {
			return command
		}
	}
	return nil
}

type Arg struct {
	Name     string
	Optional bool
}

func (a *Arg) String() string {
	if a.Optional {
		return "[" + strings.ToUpper(a.Name) + "]"
	}
	return strings.ToUpper(a.Name)
}

type Flag struct {
	Name    string
	Char    rune
	Default string
}
