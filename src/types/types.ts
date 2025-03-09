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
