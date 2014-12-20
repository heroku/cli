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
