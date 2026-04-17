import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware
 * Tüm hataları yakalar ve tutarlı JSON formatında döndürür
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error]', {
    path: req.path,
    method: req.method,
    error: err.message || err,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Validation errors
  if (err.name === 'ValidationError' || err.isValidationError) {
    return res.status(400).json({
      error: 'Doğrulama hatası',
      details: err.details || err.message,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Geçersiz veya süresi dolmuş oturum',
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Bu kayıt zaten mevcut',
      code: 'DUPLICATE_ENTRY',
      timestamp: new Date().toISOString(),
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Kayıt bulunamadı',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Sunucu hatası oluştu';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `${req.method} ${req.path} - Bu endpoint bulunamadı`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}