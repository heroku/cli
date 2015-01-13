package main

// Topic represents a CLI topic.
// For example, in the command `heroku apps:create` the topic would be `apps`.
type Topic struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Help        string `json:"help"`
	Hidden      bool   `json:"hidden"`
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

// Commands returns all of the commands under the topic.
func (t *Topic) Commands() []*Command {
	commands := make([]*Command, 0, len(cli.Commands))
	for _, c := range cli.Commands {
		if c.Topic == t.Name {
			commands = append(commands, c)
		}
	}
	return commands
}

// Merge will replace empty data on the topic with data from the passed topic.
func (t *Topic) Merge(other *Topic) {
	if t.Name == "" {
		t.Name = other.Name
	}
	if t.Description == "" {
		t.Description = other.Description
	}
	if t.Help == "" {
		t.Help = other.Help
	}
}
