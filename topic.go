package main

// Topic represents a CLI topic.
// For example, in the command `heroku apps:create` the topic would be `apps`.
type Topic struct {
	Name      string
	ShortHelp string
	Help      string
	Hidden    bool
}

func (t *Topic) String() string {
	return t.Name
}

// TopicSet is a slice of Topic structs with some helper methods.
type TopicSet []*Topic

func (topics TopicSet) ByName(name string) *Topic {
	for _, topic := range topics {
		if topic.Name == name {
			return topic
		}
	}
	return nil
}

func (topic *Topic) Commands() []*Command {
	commands := make([]*Command, 0, len(cli.Commands))
	for _, c := range cli.Commands {
		if c.Topic == topic.Name {
			commands = append(commands, c)
		}
	}
	return commands
}
