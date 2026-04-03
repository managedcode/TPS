export declare function protectEscapes(text: string): string;
export declare function restoreEscapes(text: string): string;
export interface HeaderPart {
    value: string;
    start: number;
    end: number;
}
export declare function splitHeaderParts(rawHeaderContent: string): string[];
export declare function splitHeaderPartsDetailed(rawHeaderContent: string): HeaderPart[];
