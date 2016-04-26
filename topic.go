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

// TopicSet is a slice of Topic structs with some helper methods.
type TopicSet []*Topic

// ByName returns a topic in the set matching the name.
func (topics TopicSet) ByName(name string) *Topic {
	for _, topic := range topics {
		if topic.Name == name {
			return topic
		}
	}
	return nil
}

// Concat joins 2 topic sets together
func (topics TopicSet) Concat(more TopicSet) TopicSet {
	for _, topic := range more {
		if topics.ByName(topic.Name) == nil {
			topics = append(topics, topic)
		}
	}
	return topics
}

func (topics TopicSet) Len() int {
	return len(topics)
}

func (topics TopicSet) Less(i, j int) bool {
	return topics[i].Name < topics[j].Name
}

func (topics TopicSet) Swap(i, j int) {
	topics[i], topics[j] = topics[j], topics[i]
}

// AllTopics gets all go/core/user topics
func AllTopics() TopicSet {
	topics := Topics
	topics = topics.Concat(corePlugins.Topics())
	topics = topics.Concat(userPlugins.Topics())
	return topics
}

// NonHidden returns  a set of topics that are not hidden
func (topics TopicSet) NonHidden() TopicSet {
	to := make(TopicSet, 0, len(topics))
	for _, topic := range topics {
		if !topic.Hidden {
			to = append(to, topic)
		}
	}
	return to
}

// Sort sorts the set
func (topics TopicSet) Sort() TopicSet {
	sort.Sort(topics)
	return topics
}

// Commands returns all the commands of all the topics
func (topics TopicSet) Commands() CommandSet {
	commands := CommandSet{}
	for _, topic := range topics {
		for _, command := range topic.Commands {
			command.Topic = topic.Name
			commands = append(commands, command)
		}
	}
	return commands
}
