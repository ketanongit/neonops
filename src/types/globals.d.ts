declare module 'papaparse' {
  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields?: string[];
  }

  export interface ParseConfig {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult<unknown>, parser: Parser) => void;
    complete?: (results: ParseResult<unknown>, file: File) => void;
    error?: (error: ParseError, file: File) => void;
    download?: boolean;
    skipEmptyLines?: boolean;
    chunk?: (results: ParseResult<unknown>, parser: Parser) => void;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string | void;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => unknown;
    delimitersToGuess?: string[];
  }

  export interface Parser {
    abort: () => void;
    pause: () => void;
    resume: () => void;
  }

  export function parse<T>(input: string, config?: ParseConfig): ParseResult<T>;
}
