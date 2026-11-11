import { Injectable, Logger } from '@nestjs/common';

export interface OrderConfirmedPayload {
  contact: string;
  applicantName: string;
  clubName: string;
  seasonNumber: number;
  startDate: Date;
}

/**
 * 알림톡/문자 발송 stub.
 * 실제 연동 시 (예: 카카오 알림톡 대행사, NHN Cloud, Solapi) 여기만 구현하면 된다.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async orderConfirmed(payload: OrderConfirmedPayload): Promise<void> {
    this.logger.log(`[stub] 예약 확정 알림 → ${payload.applicantName} (${payload.contact}) / ${payload.clubName} 시즌 ${payload.seasonNumber}`);
  }
}
