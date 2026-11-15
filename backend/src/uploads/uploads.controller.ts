import { BadRequestException, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Role, User } from '@prisma/client';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { UploadsService } from './uploads.service';

const MAX_FILES = 10;
const MAX_SIZE = 5 * 1024 * 1024;

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Auth(Role.HOST)
  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (/^image\/(jpeg|png|webp|gif|heic|heif)$/.test(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('이미지 파일만 업로드할 수 있습니다.'), false);
      },
    }),
  )
  async images(@CurrentUser() user: User, @UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('업로드할 이미지가 없습니다.');
    return { urls: await this.uploads.uploadImages(files, user.id) };
  }
}
