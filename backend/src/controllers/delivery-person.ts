import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';

export async function list(req: Request, res: Response) {
  const result = await query(
    "SELECT id, name, phone, login, active, first_access, created_at FROM users WHERE role = 'delivery' ORDER BY name"
  );
  res.json(result.rows);
}

export async function create(req: Request, res: Response) {
  const { name, phone, login, password } = req.body;
  if (!name || !login || !password) {
    return res.status(400).json({ error: 'Nome, login e senha obrigatórios' });
  }
  const existing = await query('SELECT id FROM users WHERE login = $1', [login]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Login já existe' });
  }
  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    "INSERT INTO users (name, phone, login, password_hash, role, first_access) VALUES ($1,$2,$3,$4,'delivery',true) RETURNING id, name, phone, login, active",
    [name, phone || null, login, hash]
  );
  res.status(201).json(result.rows[0]);
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { name, phone, active } = req.body;
  const result = await query(
    'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), active = COALESCE($3, active), updated_at = NOW() WHERE id = $4 RETURNING id, name, phone, login, active',
    [name, phone, active, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Entregador não encontrado' });
  res.json(result.rows[0]);
}

export async function resetPassword(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'Nova senha obrigatória' });
  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1, first_access = true, updated_at = NOW() WHERE id = $2', [hash, id]);
  res.json({ message: 'Senha redefinida' });
}

export async function performance(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const result = await query(
    `SELECT 
      COUNT(*) FILTER (WHERE rp.status = 'delivered') as delivered,
      COUNT(*) FILTER (WHERE rp.status = 'absent') as absent,
      COUNT(*) FILTER (WHERE rp.status = 'third_party') as third_party,
      COUNT(*) as total,
      COUNT(DISTINCT r.id) as total_routes
    FROM route_packages rp
    JOIN routes r ON r.id = rp.route_id
    WHERE r.delivery_person_id = $1`,
    [id]
  );
  res.json(result.rows[0]);
}
