package main

import (
	"errors"
	"strings"
)

// Flag defines a flag for a command.
// These will be parsed in Go and passed to the Run method in the Context struct.
type Flag struct {
	Name        string `json:"name"`
	Char        string `json:"char"`
	Description string `json:"description"`
	HasValue    bool   `json:"hasValue"`
	Hidden      bool   `json:"hidden"`
	Required    bool   `json:"required"`
}

var appFlag = &Flag{
	Name:        "app",
	Char:        "a",
	HasValue:    true,
	Description: "app to run command against",
}

var remoteFlag = &Flag{
	Name:        "remote",
	Char:        "r",
	HasValue:    true,
	Description: "git remote of app to run command against",
}

var orgFlag = &Flag{
	Name:        "org",
	Char:        "o",
	HasValue:    true,
	Description: "organization to use",
}

var debuggerFlag = &Flag{
	Name: "debugger",
}

func (f *Flag) String() string {
	s := " "
	switch {
	case f.Char != "" && f.Name != "":
		s = s + "-" + f.Char + ", --" + f.Name
	case f.Char != "":
		s = s + "-" + f.Char
	case f.Name != "":
		s = s + "--" + f.Name
	}
	if f.HasValue {
		s = s + " " + strings.ToUpper(f.Name)
	}
	return s
}

func parseFlag(input string, flags []*Flag) (*Flag, string, error) {
	keyvalue := strings.SplitN(input, "=", 2)
	key := keyvalue[0]
	value := ""
	if len(keyvalue) == 2 {
		value = keyvalue[1]
	}
	if len(key) > 2 && key[1] != '-' {
		return parseFlag(key[:2]+"="+key[2:], flags)
	}
	for _, flag := range flags {
		if (flag.Char != "" && key == "-"+flag.Char) || key == "--"+flag.Name {
			if flag.HasValue {
				if value == "" {
					return nil, "", errors.New(flag.String() + " needs a value")
				}
				return flag, value, nil
			}
			if value != "" {
				return nil, "", errors.New(flag.String() + " does not take a value")
			}
			return flag, "", nil
		}
	}
	return nil, "", nil
}
