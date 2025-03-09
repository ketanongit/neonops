"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface FormState {
  connectionType: "neon" | "local";
  connectionString: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  tableName: string;
  schemaName: string;
  csvFile: File | null;
}

export default function Home() {
  const [formState, setFormState] = useState<FormState>({
    connectionType: "neon",
    connectionString: "",
    host: "localhost",
    port: "5432",
    database: "",
    username: "",
    password: "",
    tableName: "",
    schemaName: "public",
    csvFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormState({ ...formState, csvFile: e.target.files[0] });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      if (!formState.csvFile) {
        throw new Error("Please select a CSV file");
      }

      if (!formState.tableName) {
        throw new Error("Table name is required");
      }

      // Validate table name format (alphanumeric + underscore)
      if (!/^[a-zA-Z0-9_]+$/.test(formState.tableName)) {
        throw new Error("Table name can only contain letters, numbers, and underscores");
      }

      // Validate schema name format (alphanumeric + underscore)
      if (formState.schemaName && !/^[a-zA-Z0-9_]+$/.test(formState.schemaName)) {
        throw new Error("Schema name can only contain letters, numbers, and underscores");
      }

      // Create form data
      const formData = new FormData();
      formData.append("csvFile", formState.csvFile);
      formData.append("connectionType", formState.connectionType);
      
      if (formState.connectionType === "neon") {
        if (!formState.connectionString) {
          throw new Error("Connection string is required");
        }
        formData.append("connectionString", formState.connectionString);
      } else {
        if (!formState.host || !formState.database || !formState.username) {
          throw new Error("All database connection fields are required");
        }
        formData.append("host", formState.host);
        formData.append("port", formState.port);
        formData.append("database", formState.database);
        formData.append("username", formState.username);
        formData.append("password", formState.password);
      }

      formData.append("tableName", formState.tableName);
      formData.append("schemaName", formState.schemaName || "public");

      // Send request to API
      const response = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "CSV data imported successfully!"
        });
      } else {
        throw new Error(data.error || "Failed to import CSV data");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Import error:", errorMessage);
      setResult({
        success: false,
        message: errorMessage || "An unknown error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-2xl font-semibold">CSV to PostgreSQL Import</h1>
        <ThemeToggle />
      </header>

      {result && (
        <div className={`p-4 mb-6 rounded-md ${result.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {result.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">CSV Upload</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="csvFile" className="block mb-2 text-sm font-medium">
                Select CSV File
              </label>
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                className="rounded p-2 border border-gray-300 dark:border-gray-700 bg-background file:bg-black file:text-white file:border-white file:hover:bg-gray-100 file:hover:text-black file:hover:border-black file:p-2 file:border-2 file:border-dashed file:rounded-md file:cursor-pointer file:transition-colors w-full"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">Database Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="connectionType" className="block mb-2 text-sm font-medium">
                Database Type
              </label>
              <select
                id="connectionType"
                name="connectionType"
                value={formState.connectionType}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
              >
                <option value="neon">Neon DB</option>
                <option value="local">Local PostgreSQL</option>
              </select>
            </div>
            
            {formState.connectionType === "neon" ? (
              <div>
                <label htmlFor="connectionString" className="block mb-2 text-sm font-medium">
                  Connection String
                </label>
                <input
                  type="password"
                  id="connectionString"
                  name="connectionString"
                  value={formState.connectionString}
                  onChange={handleChange}
                  placeholder="postgresql://user:password@host/database"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="host" className="block mb-2 text-sm font-medium">
                      Host
                    </label>
                    <input
                      type="text"
                      id="host"
                      name="host"
                      value={formState.host}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label htmlFor="port" className="block mb-2 text-sm font-medium">
                      Port
                    </label>
                    <input
                      type="text"
                      id="port"
                      name="port"
                      value={formState.port}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="database" className="block mb-2 text-sm font-medium">
                    Database Name
                  </label>
                  <input
                    type="text"
                    id="database"
                    name="database"
                    value={formState.database}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
                  />
                </div>
                <div>
                  <label htmlFor="username" className="block mb-2 text-sm font-medium">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formState.username}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block mb-2 text-sm font-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formState.password}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">Table Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="tableName" className="block mb-2 text-sm font-medium">
                Table Name
              </label>
              <input
                type="text"
                id="tableName"
                name="tableName"
                value={formState.tableName}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
              />
            </div>
            <div>
              <label htmlFor="schemaName" className="block mb-2 text-sm font-medium">
                Schema Name (optional)
              </label>
              <input
                type="text"
                id="schemaName"
                name="schemaName"
                value={formState.schemaName}
                onChange={handleChange}
                placeholder="public"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-12 px-8"
          >
            {loading ? "Processing..." : "Import CSV"}
          </button>
        </div>
      </form>
    </div>
  );
}
