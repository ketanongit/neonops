import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { parse } from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract file
    const file = formData.get('csvFile') as File;
    if (!file) {
      return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
    }

    // Extract connection parameters
    const connectionType = formData.get('connectionType') as string;
    const tableName = formData.get('tableName') as string;
    const schemaName = (formData.get('schemaName') as string) || 'public';

    if (!tableName) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
    }

    // Set up database connection
    let pool: Pool;
    if (connectionType === 'neon') {
      const connectionString = formData.get('connectionString') as string;
      if (!connectionString) {
        return NextResponse.json({ error: 'Connection string is required' }, { status: 400 });
      }
      
      pool = new Pool({ connectionString });
    } else {
      const host = formData.get('host') as string;
      const port = parseInt(formData.get('port') as string) || 5432;
      const database = formData.get('database') as string;
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      
      if (!host || !database || !username) {
        return NextResponse.json({ error: 'Database connection details are incomplete' }, { status: 400 });
      }
      
      pool = new Pool({
        host,
        port,
        database,
        user: username,
        password,
      });
    }

    // Parse the CSV file
    const fileContent = await file.text();
    const { data, errors, meta } = parse<any>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: `CSV parsing error: ${errors[0].message}` }, { status: 400 });
    }

    if (data.length === 0 || !meta.fields || meta.fields.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or has no valid columns' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      // Check if schema exists and create if needed
      if (schemaName !== 'public') {
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      }

      // Create table if it doesn't exist
      const columnDefinitions = meta.fields.map(field => {
        // Basic type inference - could be improved
        return `"${field}" TEXT`;
      }).join(', ');

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} (
          id SERIAL PRIMARY KEY,
          ${columnDefinitions}
        )
      `;
      
      await client.query(createTableQuery);

      // Insert data
      for (const row of data) {
        const columns = meta.fields;
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        const values = columns.map(col => row[col]);
        
        const insertQuery = `
          INSERT INTO ${schemaName}.${tableName} (${columns.map(c => `"${c}"`).join(', ')})
          VALUES (${placeholders})
        `;
        
        await client.query(insertQuery, values);
      }

      // Commit transaction
      await client.query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        message: `Successfully imported ${data.length} rows into ${schemaName}.${tableName}` 
      });

    } catch (error: any) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    } finally {
      client.release();
      await pool.end();
    }

  } catch (error: any) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
