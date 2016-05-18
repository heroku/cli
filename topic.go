package main

import "sort"

// Topic represents a CLI topic.
// For example, in the command `heroku apps:create` the topic would be `apps`.
type Topic struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Hidden      bool   `json:"hidden"`
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
	topics := topics
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
