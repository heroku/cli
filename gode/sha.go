package gode

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
)

// gets the sha of a stream and returns a tee to the same stream
// so it can be reused
func computeSha(reader io.Reader) (func() string, io.Reader) {
	hasher := sha256.New()
	getSha := func() string {
		return hex.EncodeToString(hasher.Sum(nil))
	}
	return getSha, io.TeeReader(reader, hasher)
}
