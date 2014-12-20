#!/bin/sh
VERSION=`head VERSION | tr -d '\n'`
SHA=`git rev-parse --short HEAD`
echo $VERSION-$SHA
