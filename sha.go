package main

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"io/ioutil"
	"os"
)

// gets the sha of a stream and returns a tee to the same stream
// so it can be reused
func computeSha(reader io.Reader) (func() string, io.Reader) {
	hasher := sha256.New()
	tee := io.TeeReader(reader, hasher)
	getSha := func() string {
		ioutil.ReadAll(tee)
		return hex.EncodeToString(hasher.Sum(nil))
	}
	return getSha, tee
}

func fileSha256(path string) (string, error) {
	hasher := sha256.New()
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	if _, err := io.Copy(hasher, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(hasher.Sum(nil)), nil
}
