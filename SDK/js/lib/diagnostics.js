import { TpsDiagnosticCodes } from "./constants.js";
export function normalizeLineEndings(value) {
    return (value ?? "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}
export function createLineStarts(text) {
    const starts = [0];
    for (let index = 0; index < text.length; index += 1) {
        if (text[index] === "\n") {
            starts.push(index + 1);
        }
    }
    return starts;
}
export function positionAt(offset, lineStarts) {
    let lineIndex = 0;
    for (let index = 0; index < lineStarts.length; index += 1) {
        if (lineStarts[index] > offset) {
            break;
        }
        lineIndex = index;
    }
    const lineStart = lineStarts[lineIndex];
    return {
        line: lineIndex + 1,
        column: offset - lineStart + 1,
        offset
    };
}
export function rangeAt(start, end, lineStarts) {
    return {
        start: positionAt(start, lineStarts),
        end: positionAt(end, lineStarts)
    };
}
export function createDiagnostic(code, message, start, end, lineStarts, suggestion) {
    const severity = code === TpsDiagnosticCodes.invalidHeaderParameter ? "warning" : "error";
    return {
        code,
        severity,
        message,
        suggestion,
        range: rangeAt(start, end, lineStarts)
    };
}
export function hasErrors(diagnostics) {
    return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}
