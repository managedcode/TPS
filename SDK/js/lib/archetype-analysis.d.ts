import type { CompiledBlock, TpsDiagnostic } from "./models.js";
export interface ArchetypeDiagnosticTarget {
    block: CompiledBlock;
    rangeStart: number;
    rangeEnd: number;
}
export declare function appendArchetypeDiagnostics(targets: readonly ArchetypeDiagnosticTarget[], lineStarts: readonly number[], diagnostics: TpsDiagnostic[]): void;
