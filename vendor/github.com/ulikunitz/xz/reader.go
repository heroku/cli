// Copyright 2014-2016 Ulrich Kunitz. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// Package xz supports the compression and decompression of xz files.
package xz

import (
	"bytes"
	"errors"
	"fmt"
	"hash"
	"io"

	"github.com/ulikunitz/xz/lzma"
)

// ReaderParams defines the parameters for the xz reader. The defaults
// are defined by ReaderDefaults.
type ReaderParams struct {
	lzma.Reader2Params
}

// Verify checks the Reader parameters for errors.
func (p *ReaderParams) Verify() error {
	return p.Reader2Params.Verify()
}

// ReaderDefaults defines the defaults for the xz reader.
var ReaderDefaults = ReaderParams{
	Reader2Params: lzma.Reader2Defaults,
}

// errUnexpectedEOF indicates an unexpected end of file.
var errUnexpectedEOF = errors.New("xz: unexpected end of file")

// Reader decodes xz files.
type Reader struct {
	ReaderParams

	xz      io.Reader
	br      *blockReader
	newHash func() hash.Hash
	h       header
	index   []record
}

// NewReader creates a new xz reader using the default parameters.
// NewReader reads and checks the header of the XZ stream.
func NewReader(xz io.Reader) (r *Reader, err error) {
	return NewReaderParams(xz, &ReaderDefaults)
}

// NewReaderParams creates a new xz reader using the given parameters.
// NewReaderParams reads and checks the header of the XZ stream.
func NewReaderParams(xz io.Reader, p *ReaderParams) (r *Reader, err error) {
	if err = p.Verify(); err != nil {
		return nil, err
	}
	r = &Reader{
		ReaderParams: *p,
		xz:           xz,
		index:        make([]record, 0, 4),
	}
	data := make([]byte, HeaderLen)
	if _, err = io.ReadFull(r.xz, data); err != nil {
		if err == io.EOF {
			err = errUnexpectedEOF
		}
		return nil, err
	}
	if err = r.h.UnmarshalBinary(data); err != nil {
		return nil, err
	}
	if r.newHash, err = newHashFunc(r.h.flags); err != nil {
		return nil, err
	}
	return r, nil
}

// errIndex indicates an error with the xz file index.
var errIndex = errors.New("xz: error in xz file index")

// readTail reads the index body and the xz footer.
func (r *Reader) readTail() error {
	index, n, err := readIndexBody(r.xz)
	if err != nil {
		if err == io.EOF {
			err = errUnexpectedEOF
		}
		return err
	}
	if len(index) != len(r.index) {
		return fmt.Errorf("xz: index length is %d; want %d",
			len(index), len(r.index))
	}
	for i, rec := range r.index {
		if rec != index[i] {
			return fmt.Errorf("xz: record %d is %v; want %v",
				i, rec, index[i])
		}
	}

	p := make([]byte, footerLen)
	if _, err = io.ReadFull(r.xz, p); err != nil {
		if err == io.EOF {
			err = errUnexpectedEOF
		}
		return err
	}
	var f footer
	if err = f.UnmarshalBinary(p); err != nil {
		return err
	}
	if f.flags != r.h.flags {
		return errors.New("xz: footer flags incorrect")
	}
	if f.indexSize != int64(n)+1 {
		return errors.New("xz: index size in footer wrong")
	}
	return nil
}

// Read reads actual data from the xz stream.
func (r *Reader) Read(p []byte) (n int, err error) {
	for n < len(p) {
		if r.br == nil {
			bh, hlen, err := readBlockHeader(r.xz)
			if err != nil {
				if err == errIndexIndicator {
					if err = r.readTail(); err != nil {
						return n, err
					}
					return n, io.EOF
				}
				return n, err
			}
			r.br, err = newBlockReader(r.xz, bh, hlen, r.newHash(),
				&r.ReaderParams)
			if err != nil {
				return n, err
			}
		}
		k, err := r.br.Read(p[n:])
		n += k
		if err != nil {
			if err == io.EOF {
				r.index = append(r.index, r.br.record())
				r.br = nil
			} else {
				return n, err
			}
		}
	}
	return n, nil
}

// countingReader is a reader that counts the bytes read.
type countingReader struct {
	r io.Reader
	n int64
}

// Read reads data from the wrapped reader and adds it to the n field.
func (lr *countingReader) Read(p []byte) (n int, err error) {
	n, err = lr.r.Read(p)
	lr.n += int64(n)
	return n, err
}

// blockReader supports the reading of a block.
type blockReader struct {
	lxz       countingReader
	header    *blockHeader
	headerLen int
	n         int64
	hash      hash.Hash
	r         io.Reader
	err       error
}

// newBlockReader creates a new block reader.
func newBlockReader(xz io.Reader, h *blockHeader, hlen int, hash hash.Hash,
	p *ReaderParams) (br *blockReader, err error) {

	br = &blockReader{
		lxz:       countingReader{r: xz},
		header:    h,
		headerLen: hlen,
		hash:      hash,
	}

	fr, err := newFilterReader(&br.lxz, h.filters, p)
	if err != nil {
		return nil, err
	}
	br.r = io.TeeReader(fr, br.hash)

	return br, nil
}

// uncompressedSize returns the uncompressed size of the block.
func (br *blockReader) uncompressedSize() int64 {
	return br.n
}

// compressedSize returns the compressed size of the block.
func (br *blockReader) compressedSize() int64 {
	return br.lxz.n
}

// unpaddedSize computes the unpadded size for the block.
func (br *blockReader) unpaddedSize() int64 {
	n := int64(br.headerLen)
	n += br.compressedSize()
	n += int64(br.hash.Size())
	return n
}

// record returns the index record for the current block.
func (br *blockReader) record() record {
	return record{br.unpaddedSize(), br.uncompressedSize()}
}

// errBlockSize indicates that the size of the block in the block header
// is wrong.
var errBlockSize = errors.New("xz: wrong uncompressed size for block")

// Read reads data from the block.
func (br *blockReader) Read(p []byte) (n int, err error) {
	n, err = br.r.Read(p)
	br.n += int64(n)

	u := br.header.uncompressedSize
	if u >= 0 && br.uncompressedSize() > u {
		return n, errors.New("xz: wrong uncompressed size for block")
	}
	c := br.header.compressedSize
	if c >= 0 && br.compressedSize() > c {
		return n, errors.New("xz: wrong compressed size for block")
	}
	if err != io.EOF {
		return n, err
	}
	if br.uncompressedSize() < u || br.compressedSize() < c {
		return n, errUnexpectedEOF
	}

	s := br.hash.Size()
	k := padLen(br.lxz.n)
	q := make([]byte, k+s, k+2*s)
	if _, err = io.ReadFull(br.lxz.r, q); err != nil {
		if err == io.EOF {
			err = errUnexpectedEOF
		}
		return n, err
	}
	if !allZeros(q[:k]) {
		return n, errors.New("xz: non-zero block padding")
	}
	checkSum := q[k:]
	computedSum := br.hash.Sum(checkSum[s:])
	if !bytes.Equal(checkSum, computedSum) {
		return n, errors.New("xz: checksum error for block")
	}
	return n, io.EOF
}

func newFilterReader(r io.Reader, f []filter, p *ReaderParams,
) (fr io.Reader, err error) {

	if err = verifyFilters(f); err != nil {
		return nil, err
	}

	fr = r
	for i := len(f) - 1; i >= 0; i-- {
		fr, err = f[i].reader(fr, p)
		if err != nil {
			return nil, err
		}
	}
	return fr, nil
}
