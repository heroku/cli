package gode

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"io/ioutil"
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
