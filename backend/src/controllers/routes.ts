import { Request, Response } from 'express';
import { query } from '../config/database';

export async function list(req: Request, res: Response) {
  const { status, deliveryPersonId } = req.query;
  let sql = `SELECT r.*, u.name as delivery_person_name
    FROM routes r
    LEFT JOIN users u ON u.id = r.delivery_person_id
    WHERE 1=1`;
  const params: any[] = [];
  let i = 1;
  if (status) { sql += ` AND r.status = $${i++}`; params.push(status); }
  if (deliveryPersonId) { sql += ` AND r.delivery_person_id = $${i++}`; params.push(deliveryPersonId); }
  sql += ' ORDER BY r.created_at DESC';
  const result = await query(sql, params);
  res.json(result.rows);
}

export async function getById(req: Request, res: Response) {
  const { id } = req.params;
  const route = await query(
    `SELECT r.*, u.name as delivery_person_name
     FROM routes r
     LEFT JOIN users u ON u.id = r.delivery_person_id
     WHERE r.id = $1`,
    [id]
  );
  if (route.rows.length === 0) return res.status(404).json({ error: 'Rota não encontrada' });
  const packages = await query(
    `SELECT rp.*, p.code, p.recipient, p.address, p.neighborhood, p.city, p.latitude, p.longitude
     FROM route_packages rp
     JOIN packages p ON p.id = rp.package_id
     WHERE rp.route_id = $1
     ORDER BY rp.stop_order`,
    [id]
  );
  res.json({ ...route.rows[0], packages: packages.rows });
}

export async function create(req: Request, res: Response) {
  const { name, deliveryPersonId, packageIds } = req.body;
  if (!deliveryPersonId || !packageIds?.length) {
    return res.status(400).json({ error: 'Entregador e pacotes obrigatórios' });
  }
  const client = (await import('../config/database')).pool;
  const conn = await client.connect();
  try {
    await conn.query('BEGIN');
    const route = await conn.query(
      'INSERT INTO routes (name, delivery_person_id, total_packages) VALUES ($1, $2, $3) RETURNING *',
      [name || `Rota #${Date.now()}`, deliveryPersonId, packageIds.length]
    );
    const routeId = route.rows[0].id;
    for (let i = 0; i < packageIds.length; i++) {
      await conn.query(
        "INSERT INTO route_packages (route_id, package_id, stop_order) VALUES ($1, $2, $3)",
        [routeId, packageIds[i], i + 1]
      );
      await conn.query(
        "UPDATE packages SET status = 'in_route', updated_at = NOW() WHERE id = $1",
        [packageIds[i]]
      );
      await conn.query(
        "INSERT INTO package_history (package_id, status, description, changed_by) VALUES ($1, 'in_route', 'Inserido na rota', $2)",
        [packageIds[i], (req as any).userId]
      );
    }
    await conn.query('COMMIT');
    const full = await query(
      `SELECT r.*, u.name as delivery_person_name FROM routes r LEFT JOIN users u ON u.id = r.delivery_person_id WHERE r.id = $1`,
      [routeId]
    );
    res.status(201).json(full.rows[0]);
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  } finally {
    conn.release();
  }
}

export async function updateRoute(req: Request, res: Response) {
  const { id } = req.params;
  const { name, status, deliveryPersonId } = req.body;
  const result = await query(
    `UPDATE routes SET
      name = COALESCE($1, name),
      status = COALESCE($2, status),
      delivery_person_id = COALESCE($3, delivery_person_id),
      updated_at = NOW()
    WHERE id = $4 RETURNING *`,
    [name, status, deliveryPersonId, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Rota não encontrada' });
  res.json(result.rows[0]);
}

export async function reorderPackages(req: Request, res: Response) {
  const { id } = req.params;
  const { packageIds } = req.body;
  if (!packageIds?.length) return res.status(400).json({ error: 'Lista de pacotes obrigatória' });
  for (let i = 0; i < packageIds.length; i++) {
    await query('UPDATE route_packages SET stop_order = $1 WHERE route_id = $2 AND package_id = $3', [i + 1, id, packageIds[i]]);
  }
  res.json({ message: 'Ordem atualizada' });
}

export async function transferRoute(req: Request, res: Response) {
  const { id } = req.params;
  const { deliveryPersonId } = req.body;
  if (!deliveryPersonId) return res.status(400).json({ error: 'Novo entregador obrigatório' });
  const result = await query(
    'UPDATE routes SET delivery_person_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [deliveryPersonId, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Rota não encontrada' });
  res.json(result.rows[0]);
}

export async function splitRoute(req: Request, res: Response) {
  const { id } = req.params;
  const { deliveryPersonId, packageIds } = req.body;
  if (!deliveryPersonId || !packageIds?.length) {
    return res.status(400).json({ error: 'Entregador e pacotes obrigatórios' });
  }
  const route = await query('SELECT * FROM routes WHERE id = $1', [id]);
  if (route.rows.length === 0) return res.status(404).json({ error: 'Rota original não encontrada' });
  await query(
    'DELETE FROM route_packages WHERE route_id = $1 AND package_id = ANY($2::int[])',
    [id, packageIds]
  );
  const newRoute = await query(
    'INSERT INTO routes (name, delivery_person_id, total_packages) VALUES ($1, $2, $3) RETURNING *',
    [`${route.rows[0].name} (parte 2)`, deliveryPersonId, packageIds.length]
  );
  for (let i = 0; i < packageIds.length; i++) {
    await query(
      'INSERT INTO route_packages (route_id, package_id, stop_order) VALUES ($1, $2, $3)',
      [newRoute.rows[0].id, packageIds[i], i + 1]
    );
  }
  await query('UPDATE routes SET total_packages = (SELECT COUNT(*) FROM route_packages WHERE route_id = $1) WHERE id = $1', [id]);
  res.status(201).json({ original: route.rows[0], newRoute: newRoute.rows[0] });
}
