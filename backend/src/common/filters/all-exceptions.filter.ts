import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * Filtre global : renvoie toujours le même format d'erreur
 * { statusCode, error, message, path, timestamp }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erreur interne du serveur';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : ((body as any).message ?? message);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Erreurs Prisma courantes
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Une ressource avec ces valeurs uniques existe déjà';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Ressource introuvable';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Référence invalide (clé étrangère)';
      }
    } else {
      this.logger.error(exception);
    }

    res.status(status).json({
      statusCode: status,
      error: HttpStatus[status],
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
