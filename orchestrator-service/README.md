# orchestrator-service

Orkestrator konzumira `user.message` evente iz RabbitMQ, vodi booking sesiju i vraća poruke prema Telegram adapteru.

## Trenutni flow

1. `RabbitMQ -> user.message`
2. učitavanje sesije (`SessionStore`)
3. detekcija intenta (`IntentService`)
4. popunjavanje booking drafta
5. ponuditi/lockati termin na 3 minute
6. potvrda termina

## Napomena

- `IntentService` koristi LLM adapter (`OpenAiChatClient`) sa strict JSON promptom.
- Ako LLM nije dostupan ili vrati nevalidan odgovor, koristi se automatski rule-based fallback.
- `SessionStore` je in-memory; lako se zamijeni Redis implementacijom preko istog sučelja.
- `TelegramGateway` je logger adapter; idući korak je pravi Telegram Bot API poziv.
- Slot gumbi koriste potpisane callback action tokene (HMAC) s istekom.
- Nisko-pouzdan LLM rezultat (`confidence < LLM_MIN_CONFIDENCE`) ne ažurira draft, nego traži pojašnjenje korisnika.

## Environment

- REDIS_URL (opcijski; bez njega se koristi in-memory store)
- TELEGRAM_BOT_TOKEN (opcijski; bez njega se koristi logger gateway)
- TELEGRAM_ACTION_TOKEN_SECRET (obavezno; servis neće startati bez njega)
- ACTION_TOKEN_TTL_SECONDS
- ALLOW_INSECURE_ACTION_TOKENS (`true` samo za lokalno testiranje)
- OPENAI_API_KEY (opcijski; bez njega se koristi fallback)
- OPENAI_BASE_URL (opcijski; default je OpenAI v1 endpoint)
- OPENAI_MODEL (opcijski; default `gpt-4o-mini`)
- LLM_MIN_CONFIDENCE (default `0.65`)
- SESSION_TTL_SECONDS
- BOOKING_LOCK_SECONDS
