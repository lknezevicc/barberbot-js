# webhook-service

Webhook ulazna točka za Telegram update poruke.

## Security

- Validira header `x-telegram-bot-api-secret-token`.
- Podržava gašenje endpointa preko `APP_ENABLED=false` (vraća 204).
- Usporedba secret tokena radi se timing-safe usporedbom.

## Rate limiting

- IP limit: `WEBHOOK_RATE_LIMIT_IP_PER_MINUTE` (default 300).
- User limit: `WEBHOOK_RATE_LIMIT_USER_PER_MINUTE` (default 20).

## Flow

1. Telegram šalje update na `POST /telegram/webhook`.
2. Servis validira secret i rate limit.
3. Update mapira u `UserMessageEvent`.
4. Event se publisha u RabbitMQ exchange.
