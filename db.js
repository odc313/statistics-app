// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://sajid:z8WWp2IufsgqlmiI1kGgF413hNj61Z6a@dpg-d125sc95pdvs73cdba4g-a.oregon-postgres.render.com/finance_a24z',
  ssl: { rejectUnauthorized: false } // مطلوب للاتصال الآمن في بيئة Render
});

module.exports = pool;
