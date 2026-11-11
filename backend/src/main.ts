// 로컬 개발 시 .env 로드 (배포 환경에서는 플랫폼 환경변수 사용)
try {
  process.loadEnvFile();
} catch {
  /* .env 없음 */
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { env } from './common/env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // 프론트는 Next.js rewrites로 same-origin 프록시하지만, 직접 호출 대비 CORS 허용
  app.enableCors({ origin: env.frontendUrl, credentials: true });
  // Supabase 미설정 시 로컬 업로드 파일 제공 (개발용)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/local-uploads/' });
  app.set('trust proxy', 1);

  await app.listen(env.port);
  console.log(`API listening on :${env.port}`);
}
bootstrap();
