// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_l8LByFaeZO6D@ep-morning-surf-aezdbkw2-pooler.c-2.us-east-2.aws.neon.tech/finance-db?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
