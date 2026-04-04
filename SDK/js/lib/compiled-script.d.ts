import type { CompiledScript } from "./models.js";
export declare function normalizeCompiledScript(script: CompiledScript): CompiledScript;
export declare function parseCompiledScriptJson(json: string): CompiledScript;
export declare function validateCompiledScript(script: CompiledScript): void;
