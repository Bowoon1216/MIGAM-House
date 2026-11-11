import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^@?[A-Za-z0-9._]{1,30}$/, { message: '인스타그램 ID 형식이 올바르지 않습니다.' })
  instagramId?: string;
}

export class UpdateRoleDto {
  @IsIn([Role.USER, Role.HOST])
  role: Role;
}
