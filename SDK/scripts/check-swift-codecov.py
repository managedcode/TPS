#!/usr/bin/env python3
import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: check-swift-codecov.py <codecov-json> <line-threshold>", file=sys.stderr)
        return 1

    report_path = Path(sys.argv[1])
    threshold = float(sys.argv[2])
    report = json.loads(report_path.read_text(encoding="utf-8"))
    line_count = 0
    line_covered = 0

    for bundle in report.get("data", []):
        for file_entry in bundle.get("files", []):
            filename = file_entry.get("filename", "")
            if "/Sources/ManagedCodeTps/" not in filename:
                continue
            summary = file_entry.get("summary", {})
            lines = summary.get("lines", {})
            line_count += int(lines.get("count", 0))
            line_covered += int(lines.get("covered", 0))

    percent = 100.0 if line_count == 0 else (line_covered / line_count) * 100.0
    print(f"Swift source line coverage: {line_covered}/{line_count} = {percent:.2f}%")
    return 0 if percent >= threshold else 2


if __name__ == "__main__":
    raise SystemExit(main())
