#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BUILD_DIR="$SCRIPT_DIR/.build"
TOOLS_DIR="$BUILD_DIR/tools"
MAIN_DIR="$BUILD_DIR/classes/main"
TEST_DIR="$BUILD_DIR/classes/test"
SOURCE_LIST="$BUILD_DIR/test-sources.txt"
EXEC_FILE="$BUILD_DIR/jacoco.exec"
XML_FILE="$BUILD_DIR/jacoco.xml"
CSV_FILE="$BUILD_DIR/jacoco.csv"
JACOCO_VERSION=0.8.12
AGENT_JAR="$TOOLS_DIR/org.jacoco.agent-$JACOCO_VERSION-runtime.jar"
CLI_JAR="$TOOLS_DIR/org.jacoco.cli-$JACOCO_VERSION-nodeps.jar"

download() {
  url=$1
  target=$2
  if [ ! -f "$target" ]; then
    curl -fsSL "$url" -o "$target"
  fi
}

mkdir -p "$TOOLS_DIR" "$TEST_DIR"
download "https://repo1.maven.org/maven2/org/jacoco/org.jacoco.agent/$JACOCO_VERSION/org.jacoco.agent-$JACOCO_VERSION-runtime.jar" "$AGENT_JAR"
download "https://repo1.maven.org/maven2/org/jacoco/org.jacoco.cli/$JACOCO_VERSION/org.jacoco.cli-$JACOCO_VERSION-nodeps.jar" "$CLI_JAR"

"$SCRIPT_DIR/build.sh"
find "$SCRIPT_DIR/src/test/java" -name '*.java' | sort > "$SOURCE_LIST"
javac -Xlint:unchecked -cp "$MAIN_DIR" -d "$TEST_DIR" @"$SOURCE_LIST"
rm -f "$EXEC_FILE" "$XML_FILE" "$CSV_FILE"
java -javaagent:"$AGENT_JAR"=destfile="$EXEC_FILE" -cp "$MAIN_DIR:$TEST_DIR" com.managedcode.tps.ManagedCodeTpsTests
java -jar "$CLI_JAR" report "$EXEC_FILE" --classfiles "$MAIN_DIR" --sourcefiles "$SCRIPT_DIR/src/main/java" --xml "$XML_FILE" --csv "$CSV_FILE" >/tmp/managedcode-tps-java-jacoco.log
cat /tmp/managedcode-tps-java-jacoco.log
python3 ../scripts/check-jacoco.py "$XML_FILE" 90
