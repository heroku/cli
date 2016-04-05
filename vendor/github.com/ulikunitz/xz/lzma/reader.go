// Copyright 2014-2016 Ulrich Kunitz. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// Package lzma supports the decoding and encoding of LZMA streams.
// Reader and Writer support the classic LZMA format. Reader2 and
// Writer2 support the decoding and encoding of LZMA2 streams.
//
// The package is written completely in Go and doesn't rely on any external
// library.
package lzma

import (
	"errors"
	"io"
)

// Reader represents a reader for LZMA streams in the classic format.
// The DictCap field of Header might be increased before the first call
// to Read.
type Reader struct {
	Header
	lzma io.Reader
	h    Header
	d    *decoder
}

// NewReader creates a new reader for an LZMA stream using the classic
// format. NewReader reads and checks the header of the the LZMA stream.
func NewReader(lzma io.Reader) (r *Reader, err error) {
	data := make([]byte, HeaderLen)
	if _, err = io.ReadFull(lzma, data); err != nil {
		if err == io.EOF {
			return nil, errors.New("lzma: unexpected EOF")
		}
		return nil, err
	}
	r = new(Reader)
	if err = r.h.unmarshalBinary(data); err != nil {
		return nil, err
	}
	if r.h.DictCap < MinDictCap {
		return nil, errors.New("lzma: dictionary capacity too small")
	}
	r.Header = r.h
	r.lzma = lzma

	return r, nil
}

// init initializes the reader allowing the user to increase the
// dictionary capacity.
func (r *Reader) init() error {
	if r.d != nil {
		return nil
	}

	if r.Header.DictCap > r.h.DictCap {
		r.h.DictCap = r.Header.DictCap
	}
	r.Header = r.h

	br := ByteReader(r.lzma)
	state := newState(r.h.Properties)

	dict, err := newDecoderDict(r.h.DictCap)
	if err != nil {
		return err
	}

	r.d, err = newDecoder(br, state, dict, r.h.Size)
	return err
}

// Read reads data out of the LZMA reader.
func (r *Reader) Read(p []byte) (n int, err error) {
	if r.d == nil {
		if err = r.init(); err != nil {
			return 0, err
		}
	}
	return r.d.Read(p)
}

// EOSMarker indicates when an end-of-stream marker has been encountered.
func (r *Reader) EOSMarker() bool {
	if r.d == nil {
		return false
	}
	return r.d.eosMarker
}
