# orchestrator-service

The orchestrator consumes `user.message` events from RabbitMQ, runs the booking session and sends messages back through the Telegram adapter.

## Current flow

1. `RabbitMQ -> user.message`
2. load the session (`SessionStore`)
3. detect the intent (`IntentService`)
4. fill in the booking draft
5. offer and lock a slot for 3 minutes
6. confirm the booking

## Notes

- `IntentService` uses an LLM adapter (`OpenAiChatClient`) with a strict JSON prompt.
- If the LLM is unavailable or returns an invalid response, a rule-based fallback is used automatically.
- `SessionStore` is in-memory. A Redis implementation can replace it behind the same interface.
- `TelegramGateway` is a logging adapter. The next step is a real Telegram Bot API call.
- Slot buttons use signed callback action tokens (HMAC) with an expiry.
- A low-confidence LLM result (`confidence < LLM_MIN_CONFIDENCE`) does not update the draft. The bot asks the user to clarify instead.

## Environment

- REDIS_URL (optional; without it the in-memory store is used)
- TELEGRAM_BOT_TOKEN (optional; without it the logging gateway is used)
- TELEGRAM_ACTION_TOKEN_SECRET (required; the service will not start without it)
- ACTION_TOKEN_TTL_SECONDS
- ALLOW_INSECURE_ACTION_TOKENS (`true` only for local testing)
- OPENAI_API_KEY (optional; without it the fallback is used)
- OPENAI_BASE_URL (optional; defaults to the OpenAI v1 endpoint)
- OPENAI_MODEL (optional; defaults to `gpt-4o-mini`)
- LLM_MIN_CONFIDENCE (default `0.65`)
- SESSION_TTL_SECONDS
- BOOKING_LOCK_SECONDS
