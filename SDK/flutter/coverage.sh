#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COVERAGE_DIR="$SCRIPT_DIR/coverage"

cd "$SCRIPT_DIR"
dart pub get
rm -rf "$COVERAGE_DIR"
dart test --coverage="$COVERAGE_DIR" --coverage-package=managedcode_tps
dart run coverage:format_coverage --packages=.dart_tool/package_config.json --report-on=lib --lcov --in="$COVERAGE_DIR" --out="$COVERAGE_DIR/lcov.info"
python3 ../scripts/check-lcov-threshold.py "$COVERAGE_DIR/lcov.info" 90
