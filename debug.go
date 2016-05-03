package main

import (
	"io"
	"os"
)

func init() {
	Topics = append(Topics, TopicSet{
		{
			Name:   "debug",
			Hidden: true,
			Commands: CommandSet{
				{
					Topic:   "debug",
					Command: "errlog",
					Run: func(ctx *Context) {
						f, err := os.Open(ErrLogPath)
						must(err)
						io.CopyBuffer(Stdout, f, make([]byte, 1024))
					},
				},
			},
		},
	}...)
}
