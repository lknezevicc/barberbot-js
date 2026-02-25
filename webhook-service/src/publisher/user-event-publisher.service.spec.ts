import { Test, TestingModule } from '@nestjs/testing';
import { UserEventPublisher } from './user-event-publisher.service';

describe('UserEventPublisher', () => {
  let service: UserEventPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserEventPublisher],
    }).compile();

    service = module.get<UserEventPublisher>(UserEventPublisher);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
