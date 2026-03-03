# barberbot-js

Telegram booking orkestracija kroz mikroservise i RabbitMQ.

## Servisi

- `webhook-service` — prima Telegram webhook, validira secret token i objavljuje `user.message` event.
- `orchestrator-service` — konzumira `user.message`, vodi booking sesiju i vraća odgovor kroz Telegram gateway adapter.
- `common` — shared DTO/event/intent/session ugovori i RabbitMQ konfiguracija.

## Environment

1. Kopiraj `.env.example` u `.env`.
2. Popuni barem: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ACTION_TOKEN_SECRET`.
3. Za OpenRouter postavi:
	- `OPENAI_API_KEY`
	- `OPENAI_BASE_URL=https://openrouter.ai/api/v1`
	- `OPENAI_MODEL=openai/gpt-oss-120b:free`

## Local run (Docker)

```bash
docker compose up --build
```

RabbitMQ management UI: `http://localhost:15672` (`guest` / `guest`).

## Telegram webhook setup

Nakon što podigneš lokalni webhook i izložiš ga preko ngrok-a:

```bash
export WEBHOOK_PUBLIC_URL=https://<tvoj-ngrok-url>
./scripts/set-telegram-webhook.sh
```

## Sljedeći koraci

1. Dodati persistent booking storage (MongoDB) i finalnu potvrdu zapisa.
2. Dodati callback query/action token flow za potvrdu/otkaz.
3. Dodati distributed rate limiting (Redis) i DLQ replay flow.
