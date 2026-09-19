import type { RequestHandler } from 'express';
import { EXPORT_COLUMN_LABELS, EXPORT_COLUMNS } from '../constants/transaction.js';
import { exportBodySchema } from '../schemas/export.schema.js';
import { exportFilename, writeTransactionsCsv } from '../services/export.service.js';

/** The whitelist itself, so the client's column picker can never offer a column the API refuses. */
export const getExportColumns: RequestHandler = (_req, res) => {
  res.json({
    columns: EXPORT_COLUMNS.map((key) => ({ key, label: EXPORT_COLUMN_LABELS[key] })),
  });
};

function isClientDisconnect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_STREAM_PREMATURE_CLOSE'
  );
}

export const postExport: RequestHandler = async (req, res) => {
  // Validated before any header is sent, so a bad request still gets a normal JSON error.
  const request = exportBodySchema.parse(req.body);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${exportFilename(request.filters)}"`);
  res.setHeader('Cache-Control', 'no-store');

  try {
    await writeTransactionsCsv(request, res);
  } catch (error) {
    // Cancelling a download closes the connection mid-stream. That's the user's choice, not a
    // server fault, so it isn't reported as one.
    if (isClientDisconnect(error)) return;
    throw error;
  }
};
