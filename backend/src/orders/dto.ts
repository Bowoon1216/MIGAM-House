import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { OrderStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateOrderDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  @MaxLength(30)
  applicantName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value))
  @Matches(/^01[016789][0-9]{7,8}$/, { message: '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)' })
  contact: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/^@/, '') : value))
  @Matches(/^[A-Za-z0-9._]{1,30}$/, { message: '인스타그램 ID 형식이 올바르지 않습니다.' })
  instagramId: string;
}

export class UpdateOrderStatusDto {
  @IsIn([OrderStatus.CONFIRMED, OrderStatus.CANCELED])
  status: OrderStatus;
}
