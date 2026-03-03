export const RABBITMQ = {
  host: process.env.RABBITMQ_HOST || 'amqp://localhost',
  exchange: 'barberbot.events',
  userMessageRoutingKey: 'user.message',
  userMessageQueue: 'barberbot.user-message.queue',
  bookingConfirmedRoutingKey: 'booking.confirmed',
  bookingConfirmedQueue: 'barberbot.booking-confirmed.queue',
  prefetchCount: 5,
  dlqSuffix: '.dlq',
} as const;