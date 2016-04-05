// Copyright 2014-2016 Ulrich Kunitz. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package lzma

// weight provides a function to compute the weight of an operation with
// length n that can be encoded with the given number of bits.
func weight(n, bits int) int {
	return (n << 20) / bits
}

// bestOp provides the operation that requires the encoding of the
// fewest bits.
func bestOp(d *encoderDict, distances []int) operation {
	op := operation(lit{d.literal()})
	w := weight(1, d.reps.opBits(op))
	for _, distance := range distances {
		n := d.matchLen(distance)
		if n < 2 {
			continue
		}
		/* buggy with buffer because uncompressed chunk resets
		 * state:
		case 1:
			if uint32(distance-minDistance) != d.reps[0] {
				continue
			}
		*/
		m := match{distance: int64(distance), n: n}
		v := weight(n, d.reps.opBits(m))
		if v > w {
			w = v
			op = m
		}
	}
	return op
}

// findOp finds a single operation at the current head of the hash dictionary.
func findOp(d *encoderDict, distances []int) operation {
	n := d.matches(distances)
	distances = distances[:n]
	// add small distances
	distances = append(distances, 1, 2, 3, 4, 5, 6, 7, 8)
	op := bestOp(d, distances)
	return op
}

func addOp(d *encoderDict, op operation) {
	if err := d.writeOp(op); err != nil {
		panic(err)
	}
}

// greedy creates operations until the buffer is full. The function
// returns true if the end of the buffer has been reached.
func greedy(d *encoderDict, f compressFlags) (end bool) {
	if d.bufferedAtFront() == 0 {
		return true
	}
	distances := make([]int, maxMatches, maxMatches+10)
	for d.ops.available() > 0 {
		op := findOp(d, distances)
		m := d.bufferedAtFront()
		if op.Len() >= m {
			if op.Len() > m {
				panic("op length exceed buffered")
			}
			if f&all != 0 {
				addOp(d, op)
			}
			return true
		}
		addOp(d, op)
	}
	return false
}
