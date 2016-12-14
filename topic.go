package main

import "sort"

// Topic represents a CLI topic.
// For example, in the command `heroku apps:create` the topic would be `apps`.
type Topic struct {
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Hidden      bool       `json:"hidden"`
	Namespace   *Namespace `json:"namespace"`
	Commands    []*Command
}

func (t *Topic) String() string {
	if t.Namespace == nil || t.Namespace.Name == DefaultNamespace {
		return t.Name
	}
	return t.Namespace.Name + ":" + t.Name
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

// Namespaces returns a set of namespace from the set of topics
func (topics Topics) Namespaces() Namespaces {
	to := make(Namespaces, 0, len(topics))
	unique := make(map[string]bool)
	for _, topic := range topics {
		if topic.Namespace != nil && !unique[topic.Namespace.Name] {
			unique[topic.Namespace.Name] = true
			to = append(to, topic.Namespace)
		}
	}
	return to
}

// Namespace returns  a set of topics that are part of the cli namespace
func (topics Topics) Namespace(name string) Topics {
	to := make(Topics, 0, len(topics))
	for _, topic := range topics {
		matchedNoNamespace := topic.Namespace == nil && name == ""
		matchedNamespace := topic.Namespace != nil && topic.Namespace.Name == name
		matchedDefault := topic.Namespace != nil && topic.Namespace.Name == DefaultNamespace && name == ""
		if matchedNoNamespace || matchedNamespace || matchedDefault {
			to = append(to, topic)
		}
	}
	return to
}

// NamespaceAndTopicDescriptions returns a map of namespace and namespaceless
// topic descriptions
// i.e. it will group all topics by namespace except for topics that don't have a
// namespace
func (topics Topics) NamespaceAndTopicDescriptions() map[string]string {
	to := make(map[string]string)
	for _, topic := range topics {
		if topic.Namespace == nil || topic.Namespace.Name == DefaultNamespace {
			to[topic.Name] = topic.Description
		} else if _, ok := to[topic.Namespace.Name]; ok || to[topic.Namespace.Name] == "" {
			to[topic.Namespace.Name] = topic.Namespace.Description
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
