const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_HPyqrZas0Dp4@ep-orange-cherry-acyb1a7a-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'models', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Schema executado com sucesso!');
  } catch (err) {
    console.error('Erro ao executar schema:', err.message);
  } finally {
    await pool.end();
  }
}

run();
