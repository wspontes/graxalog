import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_HPyqrZas0Dp4@ep-orange-cherry-acyb1a7a-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

try {
  const adminHash = await bcrypt.hash('Admin123', 10);
  const weslleyHash = await bcrypt.hash('Wsl.1101', 10);

  await pool.query(`
    INSERT INTO users (name, login, password_hash, role, active, first_access)
    VALUES ($1, $2, $3, $4, true, false)
    ON CONFLICT (login) DO UPDATE SET password_hash = $3, name = $1, role = $4, active = true
  `, ['Administrador', 'admin', adminHash, 'admin']);

  await pool.query(`
    INSERT INTO users (name, login, password_hash, role, active, first_access)
    VALUES ($1, $2, $3, $4, true, false)
    ON CONFLICT (login) DO UPDATE SET password_hash = $3, name = $1, role = $4, active = true
  `, ['Weslley', 'Weslley', weslleyHash, 'delivery']);

  console.log('Usuários criados/atualizados com sucesso!');
} catch (err) {
  console.error('Erro:', err);
} finally {
  await pool.end();
}
