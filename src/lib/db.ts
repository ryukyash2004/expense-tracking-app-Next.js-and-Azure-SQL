// src/lib/db.ts
import sql from 'mssql';

const config: sql.config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST || '',
  database: process.env.MSSQL_DATABASE,
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,  // Add this
  },
  connectionTimeout: 30000,  // Add this (30 seconds)
  requestTimeout: 30000,     // Add this
};

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (pool) {
    return pool;
  }
  
  console.log('🔌 Attempting connection with:');
  console.log('  Server:', config.server);
  console.log('  Database:', config.database);
  console.log('  User:', config.user);
  console.log('  Port:', config.port);
  
  pool = await sql.connect(config);
  console.log('✅ Database connection established!');
  return pool;
}