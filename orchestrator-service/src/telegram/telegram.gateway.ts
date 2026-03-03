export interface TelegramButtonOption {
  text: string;
  callbackData: string;
}

export interface TelegramGateway {
  sendMessage(chatId: number, text: string, options?: TelegramButtonOption[][]): Promise<void>;
}
