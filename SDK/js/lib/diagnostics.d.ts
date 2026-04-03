import type { TpsDiagnostic, TpsPosition, TpsRange } from "./models.js";
export declare function normalizeLineEndings(value: string | undefined | null): string;
export declare function createLineStarts(text: string): number[];
export declare function positionAt(offset: number, lineStarts: number[]): TpsPosition;
export declare function rangeAt(start: number, end: number, lineStarts: number[]): TpsRange;
export declare function createDiagnostic(code: string, message: string, start: number, end: number, lineStarts: number[], suggestion?: string): TpsDiagnostic;
export declare function hasErrors(diagnostics: readonly TpsDiagnostic[]): boolean;
