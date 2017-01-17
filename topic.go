package main

import (
	"sort"
)

// Topic represents a CLI topic.
// For example, in the command `heroku apps:create` the topic would be `apps`.
type Topic struct {
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Hidden      bool       `json:"hidden"`
	Namespace   string     `json:"namespace"`
	Commands    []*Command
}

func (t *Topic) String() string {
	return t.Name
}

// Topics are a list of topics
type Topics []*Topic

// ByName returns a topic in the set matching the name.
func (topics Topics) ByName(name string) *Topic {
	for _, topic := range topics {
		if topic.Name == name {
			return topic
		}
	}
	return nil
}

// Concat joins 2 topic sets together
func (topics Topics) Concat(more Topics) Topics {
	for _, topic := range more {
		if topics.ByName(topic.Name) == nil {
			topics = append(topics, topic)
		}
	}
	return topics
}

func (topics Topics) Len() int {
	return len(topics)
}

func (topics Topics) Less(i, j int) bool {
	return topics[i].Name < topics[j].Name
}

func (topics Topics) Swap(i, j int) {
	topics[i], topics[j] = topics[j], topics[i]
}

// AllTopics gets all go/core/user topics
func AllTopics() Topics {
	topics := CLITopics
	topics = topics.Concat(CorePlugins.Topics())
	topics = topics.Concat(UserPlugins.Topics())
	return topics
}

// NonHidden returns  a set of topics that are not hidden
func (topics Topics) NonHidden() Topics {
	to := make(Topics, 0, len(topics))
	for _, topic := range topics {
		if !topic.Hidden {
			to = append(to, topic)
		}
	}
	return to
}

// Sort sorts the set
func (topics Topics) Sort() Topics {
	sort.Sort(topics)
	return topics
}

// Commands returns all the commands of all the topics
func (topics Topics) Commands() Commands {
	commands := Commands{}
	for _, topic := range topics {
		for _, command := range topic.Commands {
			command.Topic = topic.Name
			commands = append(commands, command)
		}
	}
	return commands
}

// NamespaceAndTopicDescriptions returns a map of namespace and namespaceless
// topic descriptions
// i.e. it will group all topics by namespace except for topics that don't have a
// namespace
func (topics Topics) NamespaceAndTopicDescriptions() map[string]string {
	to := make(map[string]string)
	for _, topic := range topics {
		var namespace = AllNamespaces().ByName(topic.Namespace);

		if namespace != nil {
			if namespace.Name == getDefaultNamespace() {
				if to[topic.Name] == "" {
					to[topic.Name] = topic.Description
				}
			} else if desc, ok := to[namespace.Name]; ok || desc == "" {
				to[namespace.Name] = namespace.Description
			}
		} else {
			to[topic.Name] = topic.Description
		}
	}
	// Check for namespaces to be loaded
	for _, namespace := range AllNamespaces() {
		if desc, ok := to[namespace.Name]; ok || desc == "" {
			to[namespace.Name] = namespace.Description
		}
	}
	return to
}


func (topics Topics) TopicsForNamespace(namespace *Namespace) Topics {
	to := make(Topics, 0, len(topics))
	for _, topic := range topics {
		if topic.Namespace == namespace.Name {
			to = append(to, topic)
		}
	}
	return to
}