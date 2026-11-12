import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { ClubsService } from './clubs.service';
import { ClubProfileDto, CreateMoodTagDto, FeaturedDto, OpenSeasonDto, SeasonFieldsDto, UpdateSessionVenueDto } from './dto';

@Controller()
export class ClubsController {
  constructor(
    private readonly clubs: ClubsService,
    private readonly prisma: PrismaService,
  ) {}

  // 공개
  @Get('clubs')
  list(@Query('tag') tag?: string, @Query('q') q?: string) {
    return this.clubs.list({ tag, q });
  }

  @Get('mood-tags')
  moodTags() {
    return this.clubs.moodTags();
  }

  @Get('clubs/:id')
  detail(@Param('id') id: string, @CurrentUser() user: User | null) {
    return this.clubs.detail(id, user);
  }

  // 호스트
  @Auth(Role.HOST)
  @Get('host/clubs')
  hostClubs(@CurrentUser() user: User) {
    return this.clubs.hostClubs(user);
  }

  @Auth(Role.HOST)
  @Get('host/clubs/:id')
  hostClub(@CurrentUser() user: User, @Param('id') id: string) {
    return this.clubs.hostClub(user, id);
  }

  @Auth(Role.HOST)
  @Delete('host/clubs/:id')
  deleteClub(@CurrentUser() user: User, @Param('id') id: string) {
    return this.clubs.deleteClub(user, id);
  }

  @Auth(Role.HOST)
  @Post('host/seasons')
  openSeason(@CurrentUser() user: User, @Body() dto: OpenSeasonDto) {
    return this.clubs.openSeason(user, dto);
  }

  @Auth(Role.HOST)
  @Patch('host/clubs/:id')
  updateProfile(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ClubProfileDto) {
    return this.clubs.updateProfile(user, id, dto);
  }

  @Auth(Role.HOST)
  @Patch('host/seasons/:id')
  updateSeason(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: SeasonFieldsDto) {
    return this.clubs.updateSeason(user, id, dto);
  }

  @Auth(Role.HOST)
  @Get('host/seasons/:id/members')
  members(@CurrentUser() user: User, @Param('id') id: string) {
    return this.clubs.seasonMembers(id, user);
  }

  // 관리자
  @Auth(Role.ADMIN)
  @Get('admin/clubs')
  adminClubs() {
    return this.clubs.adminClubs();
  }

  @Auth(Role.ADMIN)
  @Patch('admin/clubs/:id/featured')
  setFeatured(@Param('id') id: string, @Body() dto: FeaturedDto) {
    return this.clubs.setFeatured(id, dto.isFeatured);
  }

  @Auth(Role.ADMIN)
  @Get('admin/sessions')
  adminSessions(@Query('status') status?: string) {
    return this.clubs.adminSessions(status);
  }

  @Auth(Role.ADMIN)
  @Patch('admin/sessions/:id')
  updateSession(@Param('id') id: string, @Body() dto: UpdateSessionVenueDto) {
    return this.clubs.updateSessionVenue(id, dto.venueStatus, dto.scheduledAt);
  }

  @Auth(Role.ADMIN)
  @Get('admin/mood-tags')
  adminMoodTags() {
    return this.prisma.moodTag.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  @Auth(Role.ADMIN)
  @Post('admin/mood-tags')
  async addMoodTag(@Body() dto: CreateMoodTagDto) {
    const max = await this.prisma.moodTag.aggregate({ _max: { sortOrder: true } });
    return this.prisma.moodTag.create({ data: { name: dto.name, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  }

  @Auth(Role.ADMIN)
  @Delete('admin/mood-tags/:id')
  async removeMoodTag(@Param('id') id: string) {
    await this.prisma.moodTag.delete({ where: { id } });
    return { ok: true };
  }
}
