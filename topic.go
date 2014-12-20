package main

type Topic struct {
	Name      string
	ShortHelp string
	Help      string
	Hidden    bool
}

func (t *Topic) String() string {
	return t.Name
}
