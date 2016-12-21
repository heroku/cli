package main

import (
	"sort"
	"strings"
)

// Topic represents a CLI topic.
// For example, in the command `heroku apps:create` the topic would be `apps`.
type Namespace struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (n *Namespace) String() string {
	return n.Name
}

// Namespaces are a list of namespaces
type Namespaces []*Namespace

// AllTopics gets all go/core/user topics
func AllNamespaces() Namespaces {
	namespaces := CLITopics.Namespaces()
	namespaces = namespaces.Concat(CorePlugins.Namespaces())
	namespaces = namespaces.Concat(UserPlugins.Namespaces())
	return namespaces
}

// ByName returns a namespace in the set matching the name.
func (namespaces Namespaces) ByName(name string) *Namespace {
	for _, namespace := range namespaces {
		if namespace.Name == name {
			return namespace
		}
	}
	return nil
}

// Has returns ture if a namespace exist for the given name or command.
func (namespaces Namespaces) Has(nameOrCmd string) bool {
	namespace := strings.SplitN(nameOrCmd, ":", 2)[0]
	return namespace != getDefaultNamespace() && namespaces.ByName(namespace) != nil
}

func (namespaces Namespaces) Len() int {
	return len(namespaces)
}

func (namespaces Namespaces) Less(i, j int) bool {
	return namespaces[i].Name < namespaces[j].Name
}

func (namespaces Namespaces) Swap(i, j int) {
	namespaces[i], namespaces[j] = namespaces[j], namespaces[i]
}

// Concat joins 2 topic sets together
func (namespaces Namespaces) Concat(more Namespaces) Namespaces {
	for _, namespace := range more {
		if namespaces.ByName(namespace.Name) == nil {
			namespaces = append(namespaces, namespace)
		}
	}
	return namespaces
}

// Sort sorts the set
func (namespaces Namespaces) Sort() Namespaces {
	sort.Sort(namespaces)
	return namespaces
}
