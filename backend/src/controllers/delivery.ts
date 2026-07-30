import { Request, Response } from 'express';
import { query } from '../config/database';

export async function getDeliveryRoutes(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { history } = req.query;
  let sql = `SELECT r.*, u.name as delivery_person_name
     FROM routes r
     LEFT JOIN users u ON u.id = r.delivery_person_id
     WHERE r.delivery_person_id = $1`;
  if (history !== 'true') {
    sql += ` AND r.status IN ('not_started', 'in_progress')`;
  } else {
    sql += ` AND r.status IN ('completed', 'partially_completed')`;
  }
  sql += ` ORDER BY r.created_at DESC`;
  const result = await query(sql, [userId]);
  res.json(result.rows);
}

export async function getDeliveryRouteById(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { id } = req.params;
  const route = await query(
    `SELECT r.*, u.name as delivery_person_name
     FROM routes r
     LEFT JOIN users u ON u.id = r.delivery_person_id
     WHERE r.id = $1 AND r.delivery_person_id = $2`,
    [id, userId]
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

export async function startRoute(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).userId;
  const result = await query(
    "UPDATE routes SET status = 'in_progress', started_at = COALESCE(started_at, NOW()), updated_at = NOW() WHERE id = $1 AND delivery_person_id = $2 RETURNING *",
    [id, userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Rota não encontrada' });
  res.json(result.rows[0]);
}

export async function finishRoute(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).userId;
  const route = await query('SELECT * FROM routes WHERE id = $1 AND delivery_person_id = $2', [id, userId]);
  if (route.rows.length === 0) return res.status(404).json({ error: 'Rota não encontrada' });

  const pending = await query(
    "SELECT COUNT(*) FROM route_packages WHERE route_id = $1 AND status = 'in_route'",
    [id]
  );

  if (parseInt(pending.rows[0].count) > 0) {
    const pkgRows = await query(
      "SELECT package_id FROM route_packages WHERE route_id = $1 AND status = 'in_route'",
      [id]
    );
    for (const row of pkgRows.rows) {
      await query("UPDATE packages SET status = 'in_stock', updated_at = NOW() WHERE id = $1", [row.package_id]);
      await query(
        "INSERT INTO package_history (package_id, status, description, changed_by) VALUES ($1, 'in_stock', 'Retornado ao estoque por encerramento de rota', $2)",
        [row.package_id, userId]
      );
    }
    await query(
      "UPDATE routes SET status = 'partially_completed', finished_at = NOW(), updated_at = NOW() WHERE id = $1",
      [id]
    );
  } else {
    await query(
      "UPDATE routes SET status = 'completed', finished_at = NOW(), updated_at = NOW() WHERE id = $1",
      [id]
    );
  }
  const updated = await query('SELECT * FROM routes WHERE id = $1', [id]);
  res.json(updated.rows[0]);
}

export async function updatePackageStatus(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { routeId, packageId } = req.params;
  const { status, notes } = req.body;

  if (!['delivered', 'absent', 'third_party'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  const rp = await query(
    'SELECT * FROM route_packages WHERE route_id = $1 AND package_id = $2',
    [routeId, packageId]
  );
  if (rp.rows.length === 0) return res.status(404).json({ error: 'Pacote não encontrado na rota' });

  const photoUrl = (req as any).photoUrl || null;
  if (status === 'third_party' && !photoUrl && !req.file) {
    return res.status(400).json({ error: 'Foto obrigatória para entrega a terceiro' });
  }

  const result = await query(
    `UPDATE route_packages SET status = $1, delivered_at = NOW(), photo_url = COALESCE($2, photo_url), notes = COALESCE($3, notes), updated_at = NOW()
     WHERE route_id = $4 AND package_id = $5 RETURNING *`,
    [status, photoUrl, notes, routeId, packageId]
  );

  await query('UPDATE packages SET status = $1, updated_at = NOW() WHERE id = $2', [status, packageId]);
  await query(
    "INSERT INTO package_history (package_id, status, description, changed_by) VALUES ($1, $2, $3, $4)",
    [packageId, status, notes || `Status atualizado para ${status}`, userId]
  );

  if (status === 'delivered') {
    await query('UPDATE routes SET delivered_count = delivered_count + 1 WHERE id = $1', [routeId]);
  } else if (status === 'absent') {
    await query('UPDATE routes SET absent_count = absent_count + 1 WHERE id = $1', [routeId]);
  } else if (status === 'third_party') {
    await query('UPDATE routes SET third_party_count = third_party_count + 1 WHERE id = $1', [routeId]);
  }

  res.json(result.rows[0]);
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Graxalog/1.0' } });
    const data = await res.json();
    if (data?.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  } catch { return null; }
}

export async function geocodeRoutePackages(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { id } = req.params;
  const route = await query(
    'SELECT id FROM routes WHERE id = $1 AND delivery_person_id = $2',
    [id, userId]
  );
  if (route.rows.length === 0) return res.status(404).json({ error: 'Rota não encontrada' });

  const packages = await query(
    `SELECT p.id, p.address, p.neighborhood, p.city, p.latitude, p.longitude
     FROM route_packages rp JOIN packages p ON p.id = rp.package_id
     WHERE rp.route_id = $1 AND (p.latitude IS NULL OR p.longitude IS NULL)`,
    [id]
  );

  const results: { id: number; lat: number | null; lng: number | null }[] = [];
  for (let i = 0; i < packages.rows.length; i++) {
    const pkg = packages.rows[i];
    const parts = [pkg.address, pkg.neighborhood, pkg.city].filter(Boolean);
    const addressStr = parts.join(', ');
    const coords = await geocodeAddress(addressStr);
    if (coords) {
      await query('UPDATE packages SET latitude = $1, longitude = $2 WHERE id = $3', [coords.lat, coords.lng, pkg.id]);
      results.push({ id: pkg.id, lat: coords.lat, lng: coords.lng });
    } else {
      results.push({ id: pkg.id, lat: null, lng: null });
    }
    if (i < packages.rows.length - 1) await new Promise(r => setTimeout(r, 1100));
  }

  const routeData = await query(
    `SELECT r.*, u.name as delivery_person_name
     FROM routes r LEFT JOIN users u ON u.id = r.delivery_person_id
     WHERE r.id = $1 AND r.delivery_person_id = $2`, [id, userId]
  );
  const packagesData = await query(
    `SELECT rp.*, p.code, p.recipient, p.address, p.neighborhood, p.city, p.latitude, p.longitude
     FROM route_packages rp JOIN packages p ON p.id = rp.package_id
     WHERE rp.route_id = $1 ORDER BY rp.stop_order`, [id]
  );
  res.json({ ...routeData.rows[0], packages: packagesData.rows });
}

export async function editDelivery(req: Request, res: Response) {
  const { routeId, packageId } = req.params;
  const { status, notes } = req.body;
  const userId = (req as any).userId;

  const rp = await query(
    'SELECT * FROM route_packages WHERE route_id = $1 AND package_id = $2',
    [routeId, packageId]
  );
  if (rp.rows.length === 0) return res.status(404).json({ error: 'Registro não encontrado' });

  const oldStatus = rp.rows[0].status;
  const result = await query(
    `UPDATE route_packages SET status = COALESCE($1, status), notes = COALESCE($2, notes), updated_at = NOW()
     WHERE route_id = $3 AND package_id = $4 RETURNING *`,
    [status, notes, routeId, packageId]
  );

  if (status) {
    await query('UPDATE packages SET status = $1, updated_at = NOW() WHERE id = $2', [status, packageId]);
    await query(
      "INSERT INTO package_history (package_id, status, description, changed_by) VALUES ($1, $2, $3, $4)",
      [packageId, status, `Correção: ${oldStatus} → ${status}`, userId]
    );
  }

  res.json(result.rows[0]);
}
