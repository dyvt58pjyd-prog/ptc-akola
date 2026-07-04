const { Client } = require('pg');

async function testConnection() {
  const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_N68WSDEJsVyX@ep-steep-sea-aidthhlm.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  console.log("Connecting to:", connectionString.replace(/:[^:@]*@/, ':***@'));
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log("Success! Current time:", res.rows[0]);
  } catch (err) {
    console.error("Connection error", err.stack);
  } finally {
    await client.end();
  }
}

testConnection();
