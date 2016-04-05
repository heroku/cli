// Copyright 2014-2016 Ulrich Kunitz. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package lzma

import (
	"bufio"
	"errors"
	"io"
)

// MinDictCap and MaxDictCap provide the range of supported dictionary
// capacities.
const (
	MinDictCap = 1 << 12
	MaxDictCap = 1<<32 - 1
)

// Writer compresses data in the classic LZMA format. The public fields
// may be changed before calling the first Write method.
type Writer struct {
	// Header parameters
	Header
	// size of the lookahead buffer
	BufSize int
	// EOS marker requested
	EOSMarker bool
	bw        io.ByteWriter
	buf       *bufio.Writer
	e         *encoder
}

// NewWriter creates a new writer for the classic LZMA format.
func NewWriter(lzma io.Writer) *Writer {
	w := &Writer{
		Header: Header{
			Properties: Properties{LC: 3, LP: 0, PB: 2},
			DictCap:    8 * 1024 * 1024,
			Size:       -1,
		},
		BufSize:   4096,
		EOSMarker: true,
	}

	var ok bool
	w.bw, ok = lzma.(io.ByteWriter)
	if !ok {
		w.buf = bufio.NewWriter(lzma)
		w.bw = w.buf
	}

	return w
}

// writeHeader writes the LZMA header into the stream.
func (w *Writer) writeHeader() error {
	data, err := w.Header.marshalBinary()
	if err != nil {
		return err
	}
	_, err = w.bw.(io.Writer).Write(data)
	return err
}

// init initializes the encoder for the writer and writes the stream
// header.
func (w *Writer) init() error {
	if w.e != nil {
		panic("w.e expected to be nil")
	}
	var err error
	if err = w.Properties.Verify(); err != nil {
		return err
	}
	if !(MinDictCap <= w.DictCap && int64(w.DictCap) <= MaxDictCap) {
		return errors.New("lzma.Writer: DictCap out of range")
	}
	if w.Size < 0 {
		w.EOSMarker = true
	}
	if !(maxMatchLen <= w.BufSize) {
		return errors.New(
			"lzma.Writer: lookahead buffer size too small")
	}

	state := newState(w.Properties)
	dict, err := newEncoderDict(w.DictCap, w.BufSize)
	if err != nil {
		return err
	}
	var flags encoderFlags
	if w.EOSMarker {
		flags = eosMarker
	}
	if w.e, err = newEncoder(w.bw, state, dict, flags); err != nil {
		return err
	}

	err = w.writeHeader()
	return err
}

// Write puts data into the Writer.
func (w *Writer) Write(p []byte) (n int, err error) {
	if w.e == nil {
		if err = w.init(); err != nil {
			return 0, err
		}
	}
	if w.Size >= 0 {
		m := w.Size
		m -= w.e.Compressed() + int64(w.e.dict.Buffered())
		if m < 0 {
			m = 0
		}
		if m < int64(len(p)) {
			p = p[:m]
			err = ErrNoSpace
		}
	}
	var werr error
	if n, werr = w.e.Write(p); werr != nil {
		err = werr
	}
	return n, err
}

// Close closes the writer stream. It ensures that all data from the
// buffer will be compressed and the LZMA stream will be finished.
func (w *Writer) Close() error {
	if w.e == nil {
		if err := w.init(); err != nil {
			return err
		}
	}
	if w.Size >= 0 {
		n := w.e.Compressed() + int64(w.e.dict.Buffered())
		if n != w.Size {
			return errSize
		}
	}
	err := w.e.Close()
	if w.buf != nil {
		ferr := w.buf.Flush()
		if err == nil {
			err = ferr
		}
	}
	return err
}
