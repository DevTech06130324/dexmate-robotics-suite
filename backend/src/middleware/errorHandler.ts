import { Request, Response, NextFunction } from 'express';

interface HttpError extends Error {
  status?: number;
}

const errorHandler = (err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ error: message });
};

export default errorHandler;
