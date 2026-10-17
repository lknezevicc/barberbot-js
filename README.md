# barberbot-js

Telegram booking orchestration through microservices and RabbitMQ (TypeScript, NestJS). The Java version of the same idea is [barberbot](https://github.com/lknezevicc/barberbot).

## Services

- `webhook-service` receives the Telegram webhook, validates the secret token and publishes a `user.message` event.
- `orchestrator-service` consumes `user.message`, runs the booking session and sends the reply through the Telegram gateway adapter.
- `booking-service` consumes booking events and stores bookings.
- `common` holds the shared DTO, event, intent and session contracts and the RabbitMQ configuration.

## Environment

1. Copy `.env.example` to `.env`.
2. Fill in at least `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` and `TELEGRAM_ACTION_TOKEN_SECRET`.
3. To use OpenRouter, set:
	- `OPENAI_API_KEY`
	- `OPENAI_BASE_URL=https://openrouter.ai/api/v1`
	- `OPENAI_MODEL=openai/gpt-oss-120b:free`

## Local run (Docker)

```bash
docker compose up --build
```

RabbitMQ management UI: `http://localhost:15672` (`guest` / `guest`).

## Telegram webhook setup

After you start the local webhook and expose it through ngrok:

```bash
export WEBHOOK_PUBLIC_URL=https://<your-ngrok-url>
./scripts/set-telegram-webhook.sh
```

## Next steps

1. Add persistent booking storage (MongoDB) and a final booking confirmation record.
2. Add the callback query and action token flow for confirm and cancel.
3. Add distributed rate limiting (Redis) and a dead-letter queue replay flow.
