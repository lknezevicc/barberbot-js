export const RABBITMQ = {
  host: process.env.RABBITMQ_HOST || 'amqp://localhost',
  exchange: 'barberbot.events',
  userMessageRoutingKey: 'user.message',
  dlqSuffix: '.dlq',
} as const;