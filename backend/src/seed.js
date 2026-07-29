const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_HPyqrZas0Dp4@ep-orange-cherry-acyb1a7a-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, phone, login, password_hash, role, active, first_access)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (login) DO NOTHING`,
      ['Administrador', '(11) 99999-8888', 'admin', hash, 'admin', true, false]
    );
    console.log('Admin criado: admin / admin123');

    const hash2 = await bcrypt.hash('entregador123', 10);
    await pool.query(
      `INSERT INTO users (name, phone, login, password_hash, role, active, first_access)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (login) DO NOTHING`,
      ['Entregador Teste', '(11) 97777-6666', 'entregador1', hash2, 'delivery', true, true]
    );
    console.log('Entregador criado: entregador1 / entregador123');
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
