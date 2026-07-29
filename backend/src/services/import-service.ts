import * as XLSX from 'xlsx';
import * as fs from 'fs';

export async function parseXLSX(filePath: string): Promise<any[]> {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map((row: any) => ({
    code: row['Código'] || row['codigo'] || row['Código do pacote'] || row['code'] || '',
    recipient: row['Destinatário'] || row['destinatario'] || row['Destinatario'] || row['recipient'] || '',
    address: row['Endereço'] || row['endereco'] || row['Endereco'] || row['address'] || '',
    neighborhood: row['Bairro'] || row['bairro'] || row['neighborhood'] || '',
    city: row['Cidade'] || row['cidade'] || row['city'] || '',
    zip_code: row['CEP'] || row['cep'] || row['zip_code'] || '',
    observations: row['Observações'] || row['observacoes'] || row['Observacoes'] || '',
  }));
}

export async function parsePDF(filePath: string): Promise<any[]> {
  const fs = require('fs');
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text;
  const lines = text.split('\n').filter((l: string) => l.trim());
  const packages: any[] = [];
  let current: any = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^\d{6,}/)) {
      if (current.code) packages.push(current);
      current = { code: trimmed, recipient: '', address: '', neighborhood: '', city: '', zip_code: '' };
    } else if (current.code) {
      if (!current.recipient) current.recipient = trimmed;
      else if (!current.address) current.address = trimmed;
      else if (!current.neighborhood) current.neighborhood = trimmed;
      else if (!current.city) current.city = trimmed;
      else if (!current.zip_code && trimmed.match(/^\d{5}-?\d{3}$/)) current.zip_code = trimmed;
      else current.observations = (current.observations || '') + ' ' + trimmed;
    }
  }
  if (current.code) packages.push(current);
  return packages;
}
