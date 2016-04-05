// Copyright 2014-2016 Ulrich Kunitz. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package lzma

import (
	"errors"
	"io"
)

// maxMatches limits the number of matches requested from the Matches
// function. This controls the speed of the overall encoding.
const maxMatches = 16

// matcher is an interface that allows the identification of potential
// matches for words with a constant length greater or equal 2.
//
// The absolute offset of potential matches are provided by the
// Matches method.
//
// The Reset method clears the matcher completely but starts new data
// at the given position.
type matcher interface {
	io.Writer
	WordLen() int
	Matches(word []byte, positions []int64) int
	Reset()
}

// encoderDict buffers all encoded data and detected operations and
// includes the complete dictionary. It consists of a lookahead buffer
// and the dictionary.
type encoderDict struct {
	buf buffer
	// start of the operation buffer
	cursor int
	ops    opBuffer
	reps   reps
	m      matcher
	// head of the dictionary as absolute offset
	head int64
	// capacity of the dictionary
	capacity int
	// helper code preventing new allocations
	p         []byte
	positions []int64
}

// newEncoderDict creates a new encoder dictionary. The initial position
// and length of the dictionary will be zero. The argument dictCap
// provides the capacity of the dictionary. The argument bufSize gives
// the size of the lookahead buffer.
func newEncoderDict(dictCap, bufSize int) (d *encoderDict, err error) {
	if !(1 <= dictCap && int64(dictCap) <= MaxDictCap) {
		return nil, errors.New(
			"lzma: dictionary capacity out of range")
	}
	if bufSize < 1 {
		return nil, errors.New(
			"lzma: buffer size must be larger then zero")
	}
	m, err := newHashTable(dictCap, 4)
	if err != nil {
		return nil, err
	}
	buf, err := newBuffer(dictCap + bufSize)
	if err != nil {
		return nil, err
	}
	opbuf, err := newOpBuffer(bufSize)
	if err != nil {
		return nil, err
	}
	d = &encoderDict{
		buf:      *buf,
		ops:      *opbuf,
		m:        m,
		capacity: dictCap,
	}
	return d, nil
}

// Reset clears the dictionary.
func (d *encoderDict) Reset() {
	d.buf.Reset()
	d.cursor = 0
	d.ops.reset()
	d.reps = reps{}
	d.head = 0
	d.m.Reset()
}

// Available returns the number of bytes that can be written by a
// following Write call.
func (d *encoderDict) available() int {
	return d.buf.Available() - d.dictLen()
}

// Buffered gives the number of bytes in front of the dictionary.
func (d *encoderDict) Buffered() int {
	return d.buf.Buffered()
}

// bufferedAtFront returns the number of bytes in the buffer in front of
// the cursor.
func (d *encoderDict) bufferedAtFront() int {
	delta := d.buf.front - d.cursor
	if delta < 0 {
		delta += len(d.buf.data)
	}
	return delta
}

// write puts new data into the dictionary.
func (d *encoderDict) write(p []byte) (n int, err error) {
	n = len(p)
	m := d.available()
	if n > m {
		p = p[:m]
		err = ErrNoSpace
	}
	var werr error
	n, werr = d.buf.Write(p)
	if werr != nil {
		err = werr
	}
	return n, err
}

// peek returns data from the cursor, but doesn't move it.
func (d *encoderDict) peek(p []byte) (n int, err error) {
	m := d.bufferedAtFront()
	n = len(p)
	if m < n {
		n = m
		p = p[:n]
	}
	k := copy(p, d.buf.data[d.cursor:])
	if k < n {
		copy(p[k:], d.buf.data)
	}
	return n, nil
}

// writeOp puts an operation into the operation buffer and the matcher.
// The cursor will be advanced.
func (d *encoderDict) writeOp(op operation) error {
	n := op.Len()
	if n > d.bufferedAtFront() {
		return ErrNoSpace
	}

	if len(d.p) < n {
		k := n
		if k < maxMatchLen {
			k = maxMatchLen
		}
		d.p = make([]byte, k)
	}
	p := d.p[:n]

	k, err := d.peek(p)
	if err != nil {
		return err
	}
	if k < n {
		return errors.New(
			"lzma: not enough data from encoder dictionary peek ")
	}

	_, err = d.m.Write(p)
	if err != nil {
		return err
	}
	if err = d.ops.writeOp(op); err != nil {
		return err
	}
	d.cursor = d.buf.addIndex(d.cursor, n)
	d.reps.addOp(op)
	return nil
}

func (d *encoderDict) peekOp() (op operation, err error) {
	return d.ops.peekOp()
}

func (d *encoderDict) discardOp() error {
	op, err := d.ops.readOp()
	if err != nil {
		return err
	}
	n := op.Len()
	if _, err = d.buf.Discard(n); err != nil {
		return err
	}
	d.head += int64(n)
	return nil
}

// matches finds potential distances. The number of distances put into
// the slice are returned.
func (d *encoderDict) matches(distances []int) int {
	w := d.m.WordLen()
	if d.bufferedAtFront() < w {
		return 0
	}
	if len(d.p) < w {
		k := w
		if k < maxMatchLen {
			k = maxMatchLen
		}
		d.p = make([]byte, k)
	}
	p := d.p[:w]
	// Peek doesn't return errors and we have ensured that there are
	// enough bytes.
	d.peek(p)
	if len(d.positions) < len(distances) {
		d.positions = make([]int64, len(distances))
	}
	positions := d.positions[:len(distances)]
	k := d.m.Matches(p, positions)
	positions = positions[:k]
	n := int64(d.dictLen())
	i := 0
	for _, pos := range positions {
		d := d.head - pos
		if 0 < d && d <= n {
			distances[i] = int(d)
			i++
		}
	}
	return i
}

// opsLen returns the number of bytes covered by the operation buffer.
func (d *encoderDict) opsLen() int {
	delta := d.cursor - d.buf.rear
	if delta < 0 {
		delta += len(d.buf.data)
	}
	return delta
}

// cursorLen returns the length of the dictionary starting at the cursor
func (d *encoderDict) cursorDictLen() int {
	head := d.head + int64(d.opsLen())
	if head < int64(d.capacity) {
		return int(head)
	}
	return d.capacity
}

// matchLen computes the length of the match at the given distance with
// the bytes at the cursor. The function returns zero if no match is found.
func (d *encoderDict) matchLen(dist int) int {
	if !(0 < dist && dist <= d.cursorDictLen()) {
		return 0
	}
	b := d.bufferedAtFront()
	return d.buf.EqualBytes(b+dist, b, maxMatchLen)
}

// literal returns the the byte at the cursor. It returns 0 if there is
// no data buffered.
func (d *encoderDict) literal() byte {
	if d.cursor == d.buf.front {
		return 0
	}
	return d.buf.data[d.cursor]
}

// DictCap returns the dictionary capacity.
func (d *encoderDict) dictCap() int {
	return d.capacity
}

// dictLen returns the current number of bytes in the dictionary. The
// number has dictionary capacity as upper limit.
func (d *encoderDict) dictLen() int {
	if d.head < int64(d.capacity) {
		return int(d.head)
	}
	return d.capacity
}

// Len returns the size of the data available after the head of the
// dictionary.
func (d *encoderDict) Len() int {
	n := d.buf.Available()
	if int64(n) > d.head {
		return int(d.head)
	}
	return n
}

// Pos returns the current position of the dictionary head.
func (d *encoderDict) pos() int64 {
	return d.head
}

// byteAt returns a byte from the dictionary. The distance is the
// positive difference from the current head. A distance of 1 will
// return the top-most byte in the dictionary.
func (d *encoderDict) byteAt(distance int) byte {
	if !(0 < distance && distance <= d.dictLen()) {
		return 0
	}
	i := d.buf.rear - distance
	if i < 0 {
		i += len(d.buf.data)
	}
	return d.buf.data[i]
}

// CopyN copies the n topmost bytes after the header. The maximum for n
// is given by the Len() method.
func (d *encoderDict) CopyN(w io.Writer, n int) (written int, err error) {
	if n <= 0 {
		return 0, nil
	}
	m := d.Len()
	if n > m {
		n = m
		err = ErrNoSpace
	}
	i := d.buf.rear - int(n)
	var werr error
	if i >= 0 {
		written, werr = w.Write(d.buf.data[i:d.buf.rear])
		if werr != nil {
			err = werr
		}
		return written, err
	}
	i += len(d.buf.data)
	if written, werr = w.Write(d.buf.data[i:]); werr != nil {
		return written, werr
	}
	k, werr := w.Write(d.buf.data[:d.buf.rear])
	written += k
	if werr != nil {
		err = werr
	}
	return written, err
}
