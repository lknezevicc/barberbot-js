# webhook-service

Webhook entry point for Telegram updates.

## Security

- Validates the `x-telegram-bot-api-secret-token` header.
- The endpoint can be switched off with `APP_ENABLED=false` (it then returns 204).
- The secret token is compared with a timing-safe comparison.

## Rate limiting

- IP limit: `WEBHOOK_RATE_LIMIT_IP_PER_MINUTE` (default 300).
- User limit: `WEBHOOK_RATE_LIMIT_USER_PER_MINUTE` (default 20).

## Flow

1. Telegram sends an update to `POST /telegram/webhook`.
2. The service validates the secret and the rate limit.
3. It maps the update to a `UserMessageEvent`.
4. The event is published to the RabbitMQ exchange.
