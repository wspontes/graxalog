import { Request, Response } from 'express';
import { query } from '../config/database';

export async function conferPackages(req: Request, res: Response) {
  const { qrCodeData } = req.body;
  const userId = (req as any).userId;
  if (!qrCodeData) return res.status(400).json({ error: 'Dado do QR Code obrigatório' });

  const pkg = await query('SELECT * FROM packages WHERE qr_code_data = $1', [qrCodeData]);
  if (pkg.rows.length === 0) {
    return res.status(404).json({
      error: 'codigo_nao_encontrado',
      message: 'Este código não consta no romaneio importado',
      qrCodeData,
    });
  }

  const p = pkg.rows[0];
  if (p.status !== 'imported') {
    return res.status(409).json({
      error: 'pacote_ja_conferido',
      message: 'Este pacote já foi conferido anteriormente',
      package: p,
    });
  }

  const result = await query(
    "UPDATE packages SET status = 'conferenced', updated_at = NOW() WHERE id = $1 RETURNING *",
    [p.id]
  );
  await query(
    "INSERT INTO package_history (package_id, status, description, changed_by) VALUES ($1, 'conferenced', 'Conferido por QR Code', $2)",
    [p.id, userId]
  );

  const counts = await getConferenceCounts();
  res.json({ package: result.rows[0], counts });
}

export async function addDivergentPackage(req: Request, res: Response) {
  const { qrCodeData, recipient, address, neighborhood, city, zip_code } = req.body;
  const userId = (req as any).userId;
  if (!qrCodeData) return res.status(400).json({ error: 'Dado do QR Code obrigatório' });

  const result = await query(
    `INSERT INTO packages (code, recipient, address, neighborhood, city, zip_code, status, qr_code_data, import_batch_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'conferenced', $1, NULL) RETURNING *`,
    [qrCodeData, recipient, address, neighborhood, city, zip_code]
  );
  await query(
    "INSERT INTO package_history (package_id, status, description, changed_by) VALUES ($1, 'conferenced', 'Pacote avulso adicionado durante conferência', $2)",
    [result.rows[0].id, userId]
  );

  const counts = await getConferenceCounts();
  res.status(201).json({ package: result.rows[0], counts });
}

export async function getConferenceStatus(req: Request, res: Response) {
  const counts = await getConferenceCounts();
  res.json(counts);
}

export async function finishConference(req: Request, res: Response) {
  const pending = await query("SELECT COUNT(*) FROM packages WHERE status = 'imported'");
  const hasPending = parseInt(pending.rows[0].count) > 0;
  await query(
    `UPDATE packages SET status = 'in_stock', updated_at = NOW()
     WHERE status = 'conferenced'`
  );
  await query(
    `INSERT INTO package_history (package_id, status, description, changed_by)
     SELECT id, 'in_stock', 'Conferência finalizada', $1 FROM packages WHERE status = 'in_stock' AND updated_at = NOW()`,
    [userId = (req as any).userId]
  );
  const counts = await getConferenceCounts();
  res.json({ message: 'Conferência finalizada', hasPending, counts });
}

async function getConferenceCounts() {
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM packages WHERE status IN ('imported','conferenced','in_stock','in_route')) as total_esperado,
      (SELECT COUNT(*) FROM packages WHERE status IN ('conferenced','in_stock','in_route','delivered','absent','third_party')) as total_conferido,
      (SELECT COUNT(*) FROM packages WHERE status = 'imported') as total_pendente,
      (SELECT COUNT(*) FROM packages WHERE status = 'conferenced') as total_aguardando_estoque
  `);
  return result.rows[0];
}
