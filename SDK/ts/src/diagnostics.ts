import { TpsDiagnosticCodes } from "./constants.js";
import type { TpsDiagnostic, TpsPosition, TpsRange } from "./models.js";

export function normalizeLineEndings(value: string | undefined | null): string {
  return (value ?? "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

export function createLineStarts(text: string): number[] {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      starts.push(index + 1);
    }
  }
  return starts;
}

export function positionAt(offset: number, lineStarts: number[]): TpsPosition {
  let lineIndex = 0;
  for (let index = 0; index < lineStarts.length; index += 1) {
    if (lineStarts[index]! > offset) {
      break;
    }
    lineIndex = index;
  }

  const lineStart = lineStarts[lineIndex]!;
  return {
    line: lineIndex + 1,
    column: offset - lineStart + 1,
    offset
  };
}

export function rangeAt(start: number, end: number, lineStarts: number[]): TpsRange {
  return {
    start: positionAt(start, lineStarts),
    end: positionAt(end, lineStarts)
  };
}

export function createDiagnostic(
  code: string,
  message: string,
  start: number,
  end: number,
  lineStarts: number[],
  suggestion?: string
): TpsDiagnostic {
  const severity = code === TpsDiagnosticCodes.invalidHeaderParameter ? "warning" : "error";
  return {
    code,
    severity,
    message,
    suggestion,
    range: rangeAt(start, end, lineStarts)
  };
}

export function hasErrors(diagnostics: readonly TpsDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}
