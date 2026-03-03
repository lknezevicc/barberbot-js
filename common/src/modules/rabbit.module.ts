import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ } from '../config/rabbit.config';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot({
      uri: RABBITMQ.host,
      exchanges: [
        {
          name: RABBITMQ.exchange,
          type: 'topic',
        },
      ],
      channels: {
        'default-channel': {
          prefetchCount: RABBITMQ.prefetchCount,
          default: true,
        },
      },
      connectionInitOptions: {
        wait: true,
        timeout: 30000,
      },
      enableControllerDiscovery: true,
    }),
  ],
  providers: [
    {
      provide: 'RABBIT_CONFIG',
      useValue: RABBITMQ,
    },
  ],
  exports: [RabbitMQModule, 'RABBIT_CONFIG'],
})
export class RabbitModule {}