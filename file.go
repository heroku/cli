package main

import (
	"math/rand"
	"os"
	"strconv"
	"time"
)

func fileExists(path string) (bool, error) {
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func randomIntString(n int) string {
	source := rand.NewSource(time.Now().UnixNano())
	return strconv.Itoa(rand.New(source).Intn(n))
}
