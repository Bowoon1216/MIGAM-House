import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { env } from '../common/env';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private client: SupabaseClient | null = null;

  private get supabase(): SupabaseClient | null {
    if (!env.supabase.url || !env.supabase.serviceRoleKey) return null;
    this.client ??= createClient(env.supabase.url, env.supabase.serviceRoleKey, { auth: { persistSession: false } });
    return this.client;
  }

  async uploadImages(files: Express.Multer.File[], ownerId: string): Promise<string[]> {
    return Promise.all(files.map((f) => this.uploadOne(f, ownerId)));
  }

  private async uploadOne(file: Express.Multer.File, ownerId: string): Promise<string> {
    const ext = (extname(file.originalname) || '.jpg').toLowerCase();
    const key = `${ownerId}/${Date.now()}-${randomUUID()}${ext}`;
    const sb = this.supabase;

    if (!sb) {
      if (env.isProd) throw new InternalServerErrorException('이미지 저장소가 설정되지 않았습니다.');
      // 개발용 로컬 저장
      const dir = join(process.cwd(), 'uploads', ownerId);
      await mkdir(dir, { recursive: true });
      await writeFile(join(process.cwd(), 'uploads', key), file.buffer);
      return `${env.frontendUrl}/api/local-uploads/${key}`;
    }

    const { error } = await sb.storage
      .from(env.supabase.bucket)
      .upload(key, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('이미지 업로드에 실패했습니다.');
    }
    return sb.storage.from(env.supabase.bucket).getPublicUrl(key).data.publicUrl;
  }
}
