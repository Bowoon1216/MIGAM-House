import { Controller, Get } from '@nestjs/common';
import { env } from '../common/env';

@Controller()
export class AppConfigController {
  /** 프론트에 노출할 공개 설정 (무통장 입금 계좌 등) */
  @Get('config')
  config() {
    return {
      bank: { name: env.bank.name, accountNumber: env.bank.accountNumber, holder: env.bank.holder },
    };
  }

  @Get('health')
  health() {
    return { ok: true };
  }
}
