package gode

import (
	"archive/tar"
	"io"
	"os"
	"path/filepath"
)

func extractTar(archive *tar.Reader, path string) error {
	for {
		hdr, err := archive.Next()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		path := filepath.Join(path, hdr.Name)
		switch {
		case hdr.FileInfo().IsDir():
			if err := os.Mkdir(path, hdr.FileInfo().Mode()); err != nil {
				return err
			}
		case hdr.Linkname != "":
			if err := os.Symlink(hdr.Linkname, path); err != nil {
				return err
			}
		default:
			if err := extractFile(archive, hdr, path); err != nil {
				return err
			}
		}
	}
}

func extractFile(archive *tar.Reader, hdr *tar.Header, path string) error {
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, hdr.FileInfo().Mode())
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = io.Copy(file, archive)
	return err
}
