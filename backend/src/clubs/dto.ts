import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { VenueStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** '#태그' → '태그', 공백 제거, 중복 제거 */
const normalizeTags = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? [...new Set(value.map((t) => String(t).trim().replace(/^#/, '').replace(/\s+/g, '')).filter(Boolean))]
    : value;

const cleanList = ({ value }: { value: unknown }) =>
  Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : value;

export class SessionInputDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: '각 회차의 만남 주제를 입력해주세요.' })
  @MaxLength(60)
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(600)
  durationMinutes: number;

  /** 제휴 공간 id (비우면 '장소 미정') */
  @IsOptional()
  @IsString()
  spaceId?: string;
}

/** 클럽 프로필 (시즌 오픈 Step 1~2 + 혜택). 클럽 페이지 상단/My Style/Benefit 섹션에 렌더링 */
export class ClubProfileDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: '클럽에 표시될 이름을 입력해주세요.' })
  @MaxLength(30)
  displayName: string;

  @IsArray()
  @ArrayMinSize(1, { message: '무드 태그를 1개 이상 선택해주세요.' })
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(15, { each: true })
  @Transform(normalizeTags)
  moodTags: string[];

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: '짧은 소개 글을 입력해주세요.' })
  @MaxLength(1000)
  intro: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  instagramFollowers?: number;

  @IsArray()
  @ArrayMinSize(1, { message: '사진을 1장 이상 올려주세요.' })
  @ArrayMaxSize(10)
  @IsUrl({ require_tld: false }, { each: true })
  gallery: string[];

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  @Transform(cleanList)
  benefits: string[];
}

/** 시즌 설정 (Step 3 커리큘럼 + Step 4 티켓) */
export class SeasonFieldsDto {
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => SessionInputDto)
  sessions: SessionInputDto[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  maxCapacity: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsOptional()
  @IsUrl()
  openChatUrl?: string;
}

export class OpenSeasonDto {
  /** 기존 하우스의 다음 시즌이면 하우스 id, 비우면 새 하우스 생성 */
  @IsOptional()
  @IsString()
  clubId?: string;

  @ValidateNested()
  @Type(() => ClubProfileDto)
  profile: ClubProfileDto;

  @ValidateNested()
  @Type(() => SeasonFieldsDto)
  season: SeasonFieldsDto;
}

export class FeaturedDto {
  @IsBoolean()
  isFeatured: boolean;
}

export class UpdateSessionVenueDto {
  @IsIn(Object.values(VenueStatus))
  venueStatus: VenueStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;
}

export class CreateMoodTagDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/^#/, '').replace(/\s+/g, '') : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  name: string;
}
