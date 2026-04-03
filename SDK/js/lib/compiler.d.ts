import type { TpsCompilationResult, TpsParseResult, TpsValidationResult } from "./models.js";
export declare function validateTps(source: string): TpsValidationResult;
export declare function parseTps(source: string): TpsParseResult;
export declare function compileTps(source: string): TpsCompilationResult;
