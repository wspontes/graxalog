import { Request, Response } from 'express';
import { query } from '../config/database';

export async function dashboard(req: Request, res: Response) {
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM packages WHERE status = 'imported') as esperados_hoje,
      (SELECT COUNT(*) FROM packages WHERE status = 'conferenced') as conferidos,
      (SELECT COUNT(*) FROM packages WHERE status = 'imported') as pendentes_conferencia,
      (SELECT COUNT(*) FROM packages WHERE status = 'in_stock') as em_estoque,
      (SELECT COUNT(*) FROM packages WHERE status = 'in_route') as em_rota,
      (SELECT COUNT(*) FROM packages WHERE status = 'delivered') as entregues,
      (SELECT COUNT(*) FROM packages WHERE status = 'absent') as ausentes,
      (SELECT COUNT(*) FROM packages WHERE status = 'third_party') as terceiros,
      (SELECT COUNT(*) FROM routes WHERE status = 'not_started') as rotas_nao_iniciadas,
      (SELECT COUNT(*) FROM routes WHERE status = 'in_progress') as rotas_andamento,
      (SELECT COUNT(*) FROM routes WHERE status = 'completed') as rotas_concluidas,
      (SELECT COUNT(*) FROM routes WHERE status = 'partially_completed') as rotas_parciais
  `);
  res.json(result.rows[0]);
}

export async function deliveryByPeriod(req: Request, res: Response) {
  const { start, end } = req.query;
  const result = await query(
    `SELECT DATE(created_at) as date, status, COUNT(*) as count
     FROM packages
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY DATE(created_at), status
     ORDER BY date`,
    [start || '1970-01-01', end || '2099-12-31']
  );
  res.json(result.rows);
}

export async function deliveryPersonPerformance(req: Request, res: Response) {
  const result = await query(`
    SELECT u.id, u.name,
      COUNT(*) FILTER (WHERE rp.status = 'delivered') as delivered,
      COUNT(*) FILTER (WHERE rp.status = 'absent') as absent,
      COUNT(*) FILTER (WHERE rp.status = 'third_party') as third_party,
      COUNT(*) as total,
      ROUND(COUNT(*) FILTER (WHERE rp.status = 'delivered') * 100.0 / NULLIF(COUNT(*), 0), 1) as success_rate
    FROM users u
    JOIN routes r ON r.delivery_person_id = u.id
    JOIN route_packages rp ON rp.route_id = r.id
    WHERE u.role = 'delivery'
    GROUP BY u.id, u.name
    ORDER BY success_rate DESC NULLS LAST
  `);
  res.json(result.rows);
}

export async function averageRouteTime(req: Request, res: Response) {
  const result = await query(`
    SELECT u.name,
      AVG(EXTRACT(EPOCH FROM (r.finished_at - r.started_at))/60) as avg_minutes,
      COUNT(*) as total_routes
    FROM routes r
    JOIN users u ON u.id = r.delivery_person_id
    WHERE r.finished_at IS NOT NULL AND r.started_at IS NOT NULL
    GROUP BY u.name
    ORDER BY avg_minutes
  `);
  res.json(result.rows);
}

export async function exportPackages(req: Request, res: Response) {
  const { format, status, start, end } = req.query;
  let sql = 'SELECT * FROM packages WHERE 1=1';
  const params: any[] = [];
  let i = 1;
  if (status) { sql += ` AND status = $${i++}`; params.push(status); }
  if (start) { sql += ` AND created_at >= $${i++}`; params.push(start); }
  if (end) { sql += ` AND created_at <= $${i++}`; params.push(end); }
  sql += ' ORDER BY created_at DESC';
  const result = await query(sql, params);

  if (format === 'xlsx') {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Pacotes');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=pacotes.xlsx');
    res.send(buf);
  } else {
    res.json(result.rows);
  }
}
