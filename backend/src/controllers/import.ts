import { Request, Response } from 'express';
import { query } from '../config/database';
import { parseXLSX } from '../services/import-service';

export async function importFile(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' });
  const userId = (req as any).userId;
  const file = req.file;
  const ext = file.originalname.split('.').pop()?.toLowerCase();

  let packages: any[] = [];
  if (ext === 'xlsx' || ext === 'xls') {
    packages = await parseXLSX(file.path);
  } else if (ext === 'pdf') {
    const { parsePDF } = await import('../services/import-service');
    packages = await parsePDF(file.path);
  } else {
    return res.status(400).json({ error: 'Formato não suportado. Use XLSX ou PDF' });
  }

  if (packages.length === 0) {
    return res.status(400).json({ error: 'Nenhum pacote encontrado no arquivo' });
  }

  const client = (await import('../config/database')).pool;
  const conn = await client.connect();
  try {
    await conn.query('BEGIN');
    const batch = await conn.query(
      'INSERT INTO import_batches (filename, method, imported_by, total_packages) VALUES ($1, $2, $3, $4) RETURNING *',
      [file.originalname, ext === 'pdf' ? 'pdf' : 'xlsx', userId, packages.length]
    );
    const batchId = batch.rows[0].id;
    for (const pkg of packages) {
      await conn.query(
        `INSERT INTO packages (code, recipient, address, neighborhood, city, zip_code, observations, status, import_batch_id, qr_code_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'imported',$8,$1)`,
        [pkg.code, pkg.recipient, pkg.address, pkg.neighborhood, pkg.city, pkg.zip_code, pkg.observations || null, batchId]
      );
    }
    await conn.query('COMMIT');
    res.status(201).json({ batch: batch.rows[0], count: packages.length });
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  } finally {
    conn.release();
  }
}

export async function manualImport(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { packages: pkgList } = req.body;
  if (!pkgList || !pkgList.length) {
    return res.status(400).json({ error: 'Lista de pacotes obrigatória' });
  }

  const photoUrl = (req as any).photoUrl || null;
  const client = (await import('../config/database')).pool;
  const conn = await client.connect();
  try {
    await conn.query('BEGIN');
    const batch = await conn.query(
      'INSERT INTO import_batches (filename, method, photo_url, imported_by, total_packages) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['manual', 'manual_photo', photoUrl, userId, pkgList.length]
    );
    const batchId = batch.rows[0].id;
    for (const pkg of pkgList) {
      await conn.query(
        `INSERT INTO packages (code, recipient, address, neighborhood, city, zip_code, observations, status, import_batch_id, qr_code_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'imported',$8,$1)`,
        [pkg.code, pkg.recipient, pkg.address, pkg.neighborhood, pkg.city, pkg.zip_code, pkg.observations || null, batchId]
      );
    }
    await conn.query('COMMIT');
    res.status(201).json({ batch: batch.rows[0], count: pkgList.length });
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  } finally {
    conn.release();
  }
}

export async function uploadPhoto(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: 'Foto obrigatória' });
  const photoUrl = `/uploads/${req.file.filename}`;
  res.json({ url: photoUrl });
}
