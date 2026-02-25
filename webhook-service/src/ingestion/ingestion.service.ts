import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserMessageEvent } from '@barberbot/common';
import type { EventPublisher } from '@barberbot/common';

@Injectable()
export class IngestionService {

  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject('UserEventPublisher')
    private readonly eventPublisher: EventPublisher<UserMessageEvent>
  ) {}

  async ingestTelegramUpdate(event: UserMessageEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }
}
