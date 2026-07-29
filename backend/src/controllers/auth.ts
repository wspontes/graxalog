import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { env } from '../config/env';

export async function login(req: Request, res: Response) {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login e senha obrigatórios' });
  }
  const result = await query('SELECT * FROM users WHERE login = $1 AND active = true', [login]);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  if (user.first_access) {
    await query('UPDATE users SET first_access = false WHERE id = $1', [user.id]);
  }
  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '12h' });
  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, first_access: user.first_access },
  });
}

export async function changePassword(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { currentPassword, newPassword } = req.body;
  const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
  const user = result.rows[0];
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Senha atual incorreta' });
  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1, first_access = false WHERE id = $2', [hash, userId]);
  res.json({ message: 'Senha alterada com sucesso' });
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).userId;
  const result = await query('SELECT id, name, phone, login, role, active, first_access FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(result.rows[0]);
}
