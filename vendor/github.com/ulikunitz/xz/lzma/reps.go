// Copyright 2014-2016 Ulrich Kunitz. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package lzma

import "errors"

// reps represents the repetition table in the LZMA state.
type reps [4]uint32

// index maps the given dist value to the correct index into the reps
// table. If the dist will not be found 4 is returned.
func (r reps) index(dist uint32) int {
	if dist == r[0] {
		return 0
	}
	if dist == r[1] {
		return 1
	}
	if dist == r[2] {
		return 2
	}
	if dist == r[3] {
		return 3
	}
	return 4
}

// addMatch adds the dist value for the match to the reps table.
func (r *reps) addMatch(m match) {
	dist := m.dist()
	g := r.index(dist)
	switch g {
	default:
		r[3] = r[2]
		fallthrough
	case 2:
		r[2] = r[1]
		fallthrough
	case 1:
		r[1] = r[0]
		r[0] = dist
	case 0:
	}
}

// errOptype indicates that the operation type is unsupported.
var errOptype = errors.New("operation type unsupported")

// addOp applies the given operation to the reps variable.
func (r *reps) addOp(op operation) {
	switch o := op.(type) {
	case lit:
		return
	case match:
		r.addMatch(o)
	default:
		panic(errOptype)
	}
}

// Operation type codes provide information about the specific type of
// an operation.
const (
	tUnknown = iota
	tLit
	tShortRep
	tLongRep0
	tLongRep1
	tLongRep2
	tLongRep3
	tMatch
)

// optype computes the operation type code for a specific operation.
// Note that this is dependent on the status of the reps table.
func (r reps) optype(op operation) (t int, err error) {
	switch m := op.(type) {
	case lit:
		return tLit, nil
	case match:
		dist := uint32(m.distance - minDistance)
		g := r.index(dist)
		if m.n == 1 {
			if g != 0 {
				return tUnknown,
					errors.New("match length out of range")
			}
			return tShortRep, nil
		}
		return tLongRep0 + g, nil
	default:
		return tUnknown, errOptype
	}
}

// opBits provides the length of the bits required to be provided to the
// rangeEncoder.
func (r reps) opBits(op operation) int {
	t, err := r.optype(op)
	if err != nil {
		panic(err)
	}
	switch t {
	case tLit:
		return 9
	case tShortRep:
		return 4
	}
	m := op.(match)
	n := lBits(m.l())
	switch t {
	case tLongRep0:
		fallthrough
	case tLongRep1:
		return 4 + n
	case tLongRep2:
		fallthrough
	case tLongRep3:
		return 5 + n
	case tMatch:
		return 2 + n + distBits(m.dist())
	}
	panic("unexpected t value")
}
