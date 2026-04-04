#!/usr/bin/env python3
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: check-jacoco.py <jacoco-xml> <line-threshold>", file=sys.stderr)
        return 1

    report_path = Path(sys.argv[1])
    threshold = float(sys.argv[2])
    root = ET.fromstring(report_path.read_text(encoding="utf-8"))
    line_missed = 0
    line_covered = 0

    for counter in root.iter("counter"):
        if counter.attrib.get("type") != "LINE":
            continue
        line_missed += int(counter.attrib.get("missed", "0"))
        line_covered += int(counter.attrib.get("covered", "0"))

    total = line_missed + line_covered
    percent = 100.0 if total == 0 else (line_covered / total) * 100.0
    print(f"JaCoCo line coverage: {line_covered}/{total} = {percent:.2f}%")
    return 0 if percent >= threshold else 2


if __name__ == "__main__":
    raise SystemExit(main())
