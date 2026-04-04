#!/usr/bin/env python3
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: check-lcov-threshold.py <lcov-file> <line-threshold>", file=sys.stderr)
        return 1

    lcov_path = Path(sys.argv[1])
    threshold = float(sys.argv[2])
    lines_found = 0
    lines_hit = 0

    for raw_line in lcov_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line.startswith("LF:"):
            lines_found += int(line[3:])
        elif line.startswith("LH:"):
            lines_hit += int(line[3:])

    percent = 100.0 if lines_found == 0 else (lines_hit / lines_found) * 100.0
    print(f"LCOV line coverage: {lines_hit}/{lines_found} = {percent:.2f}%")
    return 0 if percent >= threshold else 2


if __name__ == "__main__":
    raise SystemExit(main())
