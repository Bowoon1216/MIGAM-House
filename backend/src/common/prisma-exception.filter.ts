import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/** Prisma 에러를 적절한 HTTP 상태로 변환 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const map: Record<string, [number, string]> = {
      P2025: [HttpStatus.NOT_FOUND, '대상을 찾을 수 없거나 이미 변경되었습니다.'],
      P2002: [HttpStatus.CONFLICT, '이미 존재하는 데이터입니다.'],
      P2003: [HttpStatus.CONFLICT, '연결된 데이터가 있어 처리할 수 없습니다.'],
      P2034: [HttpStatus.CONFLICT, '요청이 충돌했습니다. 다시 시도해주세요.'],
    };
    const [statusCode, message] = map[e.code] ?? [HttpStatus.INTERNAL_SERVER_ERROR, '서버 오류가 발생했습니다.'];
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) console.error(e);
    res.status(statusCode).json({ statusCode, message });
  }
}
