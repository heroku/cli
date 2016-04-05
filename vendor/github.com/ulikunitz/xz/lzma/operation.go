// Copyright 2014-2016 Ulrich Kunitz. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package lzma

import (
	"errors"
	"fmt"
	"unicode"
)

// operation represents an operation on the dictionary during encoding or
// decoding.
type operation interface {
	Len() int
}

// rep represents a repetition at the given distance and the given length
type match struct {
	// supports all possible distance values, including the eos marker
	distance int64
	// length
	n int
}

// verify checks whether the match is valid. If that is not the case an
// error is returned.
func (m match) verify() error {
	if !(minDistance <= m.distance && m.distance <= maxDistance) {
		return errors.New("distance out of range")
	}
	if !(1 <= m.n && m.n <= maxMatchLen) {
		return errors.New("length out of range")
	}
	return nil
}

// l return the l-value for the match, which is the difference of length
// n and 2.
func (m match) l() uint32 {
	return uint32(m.n - minMatchLen)
}

// dist returns the dist value for the match, which is one less of the
// distance stored in the match.
func (m match) dist() uint32 {
	return uint32(m.distance - minDistance)
}

// Len returns the number of bytes matched.
func (m match) Len() int {
	return m.n
}

// String returns a string representation for the repetition.
func (m match) String() string {
	return fmt.Sprintf("M{%d,%d}", m.distance, m.n)
}

// lit represents a single byte literal.
type lit struct {
	b byte
}

// Len returns 1 for the single byte literal.
func (l lit) Len() int {
	return 1
}

// String returns a string representation for the literal.
func (l lit) String() string {
	var c byte
	if unicode.IsPrint(rune(l.b)) {
		c = l.b
	} else {
		c = '.'
	}
	return fmt.Sprintf("L{%c/%02x}", c, l.b)
}

// The opBuffer provides a ring buffer of operations.
type opBuffer struct {
	ops   []operation
	front int
	rear  int
}

func newOpBuffer(size int) (b *opBuffer, err error) {
	if !(0 < size && 0 < size+1) {
		return nil, errors.New(
			"lzma: operation buffer size out of range")
	}
	return &opBuffer{ops: make([]operation, size+1)}, nil
}

func (b *opBuffer) reset() {
	b.front = 0
	b.rear = 0
}

// len returns the length of the buffer.
func (b *opBuffer) len() int { return len(b.ops) - 1 }

func (b *opBuffer) available() int {
	delta := b.rear - 1 - b.front
	if delta < 0 {
		delta += len(b.ops)
	}
	return delta
}

func (b *opBuffer) buffered() int {
	delta := b.front - b.rear
	if delta < 0 {
		delta += len(b.ops)
	}
	return delta
}

func (b *opBuffer) addIndex(i, n int) int {
	i += n - len(b.ops)
	if i < 0 {
		i += len(b.ops)
	}
	return i
}

var errNoOp = errors.New("lzma: no op available")

func (b *opBuffer) peekOp() (op operation, err error) {
	if b.rear == b.front {
		return nil, errNoOp
	}
	return b.ops[b.rear], nil
}

func (b *opBuffer) readOp() (op operation, err error) {
	op, err = b.peekOp()
	if err != nil {
		return op, err
	}
	b.rear = b.addIndex(b.rear, 1)
	return op, nil
}

func (b *opBuffer) discardOp() error {
	if b.rear == b.front {
		return errNoOp
	}
	b.rear = b.addIndex(b.rear, 1)
	return nil
}

func (b *opBuffer) writeOp(op operation) error {
	if b.available() <= 0 {
		return ErrNoSpace
	}
	if op == nil {
		return errors.New("op must not be nil")
	}
	b.ops[b.front] = op
	b.front = b.addIndex(b.front, 1)
	return nil
}
