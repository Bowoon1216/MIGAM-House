import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  /** 예: '무료', '5만원', '음료 1잔 이상 주문' */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  priceCondition: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
