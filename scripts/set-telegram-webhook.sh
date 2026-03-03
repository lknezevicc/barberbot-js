#!/usr/bin/env sh
set -eu

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "Missing TELEGRAM_BOT_TOKEN (set it in .env or export it in shell)"
  exit 1
fi

if [ -z "${WEBHOOK_PUBLIC_URL:-}" ]; then
  echo "Missing WEBHOOK_PUBLIC_URL (example: https://xxxx.ngrok-free.app)"
  exit 1
fi

if [ -z "${TELEGRAM_WEBHOOK_SECRET:-}" ]; then
  echo "Missing TELEGRAM_WEBHOOK_SECRET (set it in .env or export it in shell)"
  exit 1
fi

WEBHOOK_URL="${WEBHOOK_PUBLIC_URL%/}/telegram/webhook"
API_URL="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook"

curl -sS -X POST "$API_URL" \
  --data-urlencode "url=${WEBHOOK_URL}" \
  --data-urlencode "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
  --data-urlencode "allowed_updates=[\"message\",\"callback_query\",\"inline_query\"]"

echo
echo "Webhook configured for: ${WEBHOOK_URL}"
