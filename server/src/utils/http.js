import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Parse req[part] with a zod schema; on success replaces it with the cleaned value. */
export const validate = (schema, part = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[part]);
  if (!result.success) return next(result.error);
  if (part === 'query') Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
  else req[part] = result.data;
  return next();
};

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) fields[issue.path.join('.') || '_'] ??= issue.message;
    return res.status(400).json({ error: Object.values(fields)[0] || 'Invalid request.', fields });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body.' });
  if (err?.name === 'CastError') return res.status(404).json({ error: 'Not found.' });
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}
