#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

cd "$SCRIPT_DIR"
swift test --enable-code-coverage >/tmp/managedcode-tps-swift-coverage.log
CODECOV_PATH=$(swift test --show-codecov-path | tail -n 1)
tail -n 20 /tmp/managedcode-tps-swift-coverage.log
python3 ../scripts/check-swift-codecov.py "$CODECOV_PATH" 90
