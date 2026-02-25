import { TelegramUpdateDto, UserMessageEvent } from "@barberbot/common";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TelegramUpdateMapper {

  toUserMessageEvent(update: TelegramUpdateDto): UserMessageEvent {
    const message = update.message;
    if (!message) {
      throw new Error("Invalid Telegram update: missing message");
    }

    return new UserMessageEvent(
      message.from.id,
      message.chat.id,
      message.text || "",
      new Date(message.date * 1000)
    );
  }

}
