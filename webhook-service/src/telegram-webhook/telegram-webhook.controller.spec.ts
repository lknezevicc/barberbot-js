import { Test, TestingModule } from '@nestjs/testing';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { IngestionService } from '../ingestion/ingestion.service';

describe('TelegramWebhookController', () => {
  let controller: TelegramWebhookController;
  let ingestionService: IngestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramWebhookController],
      providers: [
        {
          provide: IngestionService,
          useValue: {
            ingestTelegramUpdate: jest.fn(),
          }
        }
      ],
    }).compile();

    controller = module.get<TelegramWebhookController>(TelegramWebhookController);
    ingestionService = module.get<IngestionService>(IngestionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call ingestionService', async () => {
    const update = { update_id: 1 } as any;
    await controller.handleTelegramUpdate(update);

    expect(ingestionService.ingestTelegramUpdate).toHaveBeenCalledWith(update);
  });

});
