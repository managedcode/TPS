import type { TpsDiagnostic, TpsPosition, TpsRange } from "./models.js";
export declare function normalizeLineEndings(value: string | undefined | null): string;
export declare function createLineStarts(text: string): number[];
export declare function positionAt(offset: number, lineStarts: readonly number[]): TpsPosition;
export declare function rangeAt(start: number, end: number, lineStarts: readonly number[]): TpsRange;
export declare function createDiagnostic(code: string, message: string, start: number, end: number, lineStarts: readonly number[], suggestion?: string, severityOverride?: TpsDiagnostic["severity"]): TpsDiagnostic;
export declare function hasErrors(diagnostics: readonly TpsDiagnostic[]): boolean;
export declare function createWarningDiagnostic(code: string, message: string, start: number, end: number, lineStarts: readonly number[], suggestion?: string): TpsDiagnostic;
