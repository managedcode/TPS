#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BUILD_DIR="$SCRIPT_DIR/.build"
MAIN_DIR="$BUILD_DIR/classes/main"
TEST_DIR="$BUILD_DIR/classes/test"
SOURCE_LIST="$BUILD_DIR/test-sources.txt"

"$SCRIPT_DIR/build.sh"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
find "$SCRIPT_DIR/src/test/java" -name '*.java' | sort > "$SOURCE_LIST"
javac -Xlint:unchecked -cp "$MAIN_DIR" -d "$TEST_DIR" @"$SOURCE_LIST"
java -cp "$MAIN_DIR:$TEST_DIR" com.managedcode.tps.ManagedCodeTpsTests
