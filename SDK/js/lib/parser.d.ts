import type { TpsDiagnostic, TpsDocument, TpsParseResult, TpsSegment, TpsValidationResult } from "./models.js";
export interface ContentSection {
    text: string;
    startOffset: number;
}
export interface ParsedBlockInternal {
    block: TpsSegment["blocks"][number];
    headerStart: number;
    headerEnd: number;
    content?: ContentSection;
}
export interface ParsedSegmentInternal {
    segment: TpsSegment;
    headerStart: number;
    headerEnd: number;
    leadingContent?: ContentSection;
    directContent?: ContentSection;
    parsedBlocks: ParsedBlockInternal[];
}
export interface DocumentAnalysis {
    source: string;
    lineStarts: number[];
    diagnostics: TpsDiagnostic[];
    document: TpsDocument;
    parsedSegments: ParsedSegmentInternal[];
}
export declare function parseDocument(source: string): DocumentAnalysis;
export declare function createParseResult(analysis: DocumentAnalysis): TpsParseResult;
export declare function createValidationResult(analysis: DocumentAnalysis): TpsValidationResult;
