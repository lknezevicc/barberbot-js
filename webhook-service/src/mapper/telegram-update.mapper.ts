import { TelegramUpdateDto, UserMessageEvent } from "@barberbot/common";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TelegramUpdateMapper {

  toUserMessageEvent(update: TelegramUpdateDto): UserMessageEvent {
    const message = update.message;
    if (message) {
      return new UserMessageEvent(
        message.from.id,
        message.chat.id,
        message.text || '',
        new Date(message.date * 1000),
      );
    }

    const callback = update.callback_query;
    if (callback) {
      return new UserMessageEvent(
        callback.from.id,
        callback.message.chat.id,
        callback.data || '',
        new Date(callback.message.date * 1000),
      );
    }

    const inline = update.inline_query;
    if (inline) {
      return new UserMessageEvent(
        inline.from.id,
        inline.from.id,
        inline.query || '',
        new Date(),
      );
    }

    throw new Error('Invalid Telegram update: unsupported payload');
  }

}
