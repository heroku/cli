package vtclean

import (
	"bufio"
	"io"
)

type reader struct {
	io.Reader
	scanner *bufio.Scanner
	buf     []byte

	color bool
}

func NewReader(r io.Reader, color bool) io.Reader {
	return &reader{Reader: r, color: color}
}

func (r *reader) scan() bool {
	if r.scanner == nil {
		r.scanner = bufio.NewScanner(r.Reader)
	}
	if len(r.buf) > 0 {
		return true
	}
	if r.scanner.Scan() {
		r.buf = []byte(Clean(r.scanner.Text(), r.color) + "\n")
		return true
	}
	return false
}

func (r *reader) fill(p []byte) int {
	n := len(r.buf)
	copy(p, r.buf)
	if len(p) < len(r.buf) {
		r.buf = r.buf[len(p):]
		n = len(p)
	} else {
		r.buf = nil
	}
	return n
}

func (r *reader) Read(p []byte) (int, error) {
	n := r.fill(p)
	if n < len(p) {
		if !r.scan() {
			if n == 0 {
				return 0, io.EOF
			}
			return n, nil
		}
		n += r.fill(p[n:])
	}
	return n, nil
}
