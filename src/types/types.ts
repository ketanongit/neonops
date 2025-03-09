// Database connection and CSV import types
export type ConnectionType = "neon" | "local";

export interface DatabaseConnection {
  connectionType: ConnectionType;
  connectionString?: string;
  host?: string;
  port?: number | string;
  database?: string;
  username?: string;
  password?: string;
}

export interface TableInfo {
  tableName: string;
  schemaName: string;
}

export interface CSVImportResponse {
  success: boolean;
  message?: string;
  error?: string;
  rowsImported?: number;
}

// New type for CSV data rows
export interface CSVRow {
  [key: string]: string | number | boolean | null;
}
