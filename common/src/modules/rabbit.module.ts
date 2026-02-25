import { Global, Module } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ } from '../config/rabbit.config';

@Global()
@Module({
  providers: [
    {
      provide: 'RABBIT_CONFIG',
      useValue: RABBITMQ,
    },
    AmqpConnection,
  ],
  exports: [AmqpConnection, 'RABBIT_CONFIG'],
})
export class RabbitModule {}