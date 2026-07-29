import { Request, Response } from 'express';
import { query } from '../config/database';

export async function list(req: Request, res: Response) {
  const { status, neighborhood, code, recipient, address } = req.query;
  let sql = 'SELECT * FROM packages WHERE 1=1';
  const params: any[] = [];
  let i = 1;
  if (status) { sql += ` AND status = $${i++}`; params.push(status); }
  if (neighborhood) { sql += ` AND neighborhood ILIKE $${i++}`; params.push(`%${neighborhood}%`); }
  if (code) { sql += ` AND code ILIKE $${i++}`; params.push(`%${code}%`); }
  if (recipient) { sql += ` AND recipient ILIKE $${i++}`; params.push(`%${recipient}%`); }
  if (address) { sql += ` AND address ILIKE $${i++}`; params.push(`%${address}%`); }
  sql += ' ORDER BY created_at DESC';
  const result = await query(sql, params);
  res.json(result.rows);
}

export async function getById(req: Request, res: Response) {
  const { id } = req.params;
  const result = await query('SELECT * FROM packages WHERE id = $1', [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Pacote não encontrado' });
  const history = await query('SELECT * FROM package_history WHERE package_id = $1 ORDER BY created_at', [id]);
  res.json({ ...result.rows[0], history: history.rows });
}

export async function update(req: Request, res: Response) {
  const { id } = req.params;
  const { recipient, address, neighborhood, city, zip_code, observations } = req.body;
  const result = await query(
    `UPDATE packages SET
      recipient = COALESCE($1, recipient),
      address = COALESCE($2, address),
      neighborhood = COALESCE($3, neighborhood),
      city = COALESCE($4, city),
      zip_code = COALESCE($5, zip_code),
      observations = COALESCE($6, observations),
      updated_at = NOW()
    WHERE id = $7 RETURNING *`,
    [recipient, address, neighborhood, city, zip_code, observations, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Pacote não encontrado' });
  const userId = (req as any).userId;
  await query(
    "INSERT INTO package_history (package_id, status, description, changed_by) VALUES ($1, $2, 'Dados atualizados pelo administrador', $3)",
    [id, result.rows[0].status, userId]
  );
  res.json(result.rows[0]);
}

export async function returntoStock(req: Request, res: Response) {
  const { id } = req.params;
  const pkg = await query('SELECT * FROM packages WHERE id = $1', [id]);
  if (pkg.rows.length === 0) return res.status(404).json({ error: 'Pacote não encontrado' });
  if (!['absent', 'in_route'].includes(pkg.rows[0].status)) {
    return res.status(400).json({ error: 'Apenas pacotes ausentes ou em rota podem retornar ao estoque' });
  }
  const result = await query(
    "UPDATE packages SET status = 'in_stock', updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  const userId = (req as any).userId;
  await query(
    "INSERT INTO package_history (package_id, status, description, changed_by) VALUES ($1, 'in_stock', 'Retornado ao estoque', $2)",
    [id, userId]
  );
  await query('DELETE FROM route_packages WHERE package_id = $1 AND status = $2', [id, 'absent']);
  res.json(result.rows[0]);
}

export async function getHistory(req: Request, res: Response) {
  const { id } = req.params;
  const result = await query(
    `SELECT ph.*, u.name as changed_by_name
     FROM package_history ph
     LEFT JOIN users u ON u.id = ph.changed_by
     WHERE ph.package_id = $1
     ORDER BY ph.created_at`,
    [id]
  );
  res.json(result.rows);
}
