package gode

import (
	"archive/zip"
	"io"
	"log"
	"os"
	"path/filepath"
)

func extractZip(zipfile, root string) error {
	archive, err := zip.OpenReader(zipfile)
	if err != nil {
		return err
	}
	defer archive.Close()
	for _, f := range archive.File {
		path := filepath.Join(root, f.Name)
		switch {
		case f.FileInfo().IsDir():
			if err := os.Mkdir(path, f.Mode()); err != nil {
				return err
			}
		default:
			if err := extractZipFile(path, f); err != nil {
				log.Printf("Error extracting npm: [%s] %v", path, err)
			}
		}
	}
	return nil
}

func extractZipFile(path string, f *zip.File) error {
	rc, err := f.Open()
	if err != nil {
		return err
	}
	defer rc.Close()
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.FileInfo().Mode())
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = io.Copy(file, rc)
	return err
}
