// Copyright 2014-2016 Ulrich Kunitz. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package lzma

import (
	"errors"
	"fmt"
)

// Maximum and minimum values for the LZMA properties.
const (
	MinLC = 0
	MaxLC = 8
	MinLP = 0
	MaxLP = 4
	MinPB = 0
	MaxPB = 4
)

// MaxPropertyCode is the possible Maximum of a properties code byte.
const MaxPropertyCode = (MaxPB+1)*(MaxLP+1)*(MaxLC+1) - 1

// Properties contains the parameters LC, LP and PB. The parameter LC
// defines the number of literal context bits; parameter LP the number
// of literal position bits and PB the number of position bits.
type Properties struct {
	LC int
	LP int
	PB int
}

// String returns the properties in a string representation.
func (p *Properties) String() string {
	return fmt.Sprintf("LC %d LP %d PB %d", p.LC, p.LP, p.PB)
}

// PropertiesForCode converts a properties code byte into a Properties value.
func PropertiesForCode(code byte) (p Properties, err error) {
	if code > MaxPropertyCode {
		return p, errors.New("lzma: invalid properties code")
	}
	p.LC = int(code % 9)
	code /= 9
	p.LP = int(code % 5)
	code /= 5
	p.PB = int(code % 5)
	return p, err
}

// Verify verifies the properties for correctness.
func (p Properties) Verify() error {
	if !(MinLC <= p.LC && p.LC <= MaxLC) {
		return errors.New("lc out of range")
	}
	if !(MinLP <= p.LP && p.LP <= MaxLP) {
		return errors.New("lp out of range")
	}
	if !(MinPB <= p.PB && p.PB <= MaxPB) {
		return errors.New("pb out of range")
	}
	return nil
}

// Code converts the properties to a byte. The function assumes that
// the properties components are all in range.
func (p Properties) Code() byte {
	return byte((p.PB*5+p.LP)*9 + p.LC)
}
