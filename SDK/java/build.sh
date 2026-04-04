#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BUILD_DIR="$SCRIPT_DIR/.build"
MAIN_DIR="$BUILD_DIR/classes/main"
SOURCE_LIST="$BUILD_DIR/main-sources.txt"

rm -rf "$MAIN_DIR"
mkdir -p "$MAIN_DIR"
find "$SCRIPT_DIR/src/main/java" -name '*.java' | sort > "$SOURCE_LIST"
javac -Xlint:unchecked -d "$MAIN_DIR" @"$SOURCE_LIST"
