import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FromDto {
  @IsNumber()
  id!: number;

  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  username?: string;
}

class ChatDto {
  @IsNumber()
  id!: number;

  @IsString()
  type!: string;
}

class MessageDto {
  @IsNumber()
  message_id!: number;

  @ValidateNested()
  @Type(() => FromDto)
  from!: FromDto;

  @ValidateNested()
  @Type(() => ChatDto)
  chat!: ChatDto;

  @IsOptional()
  @IsString()
  text?: string;

  @IsNumber()
  date!: number;
}

class CallbackMessageDto {
  @ValidateNested()
  @Type(() => ChatDto)
  chat!: ChatDto;

  @IsNumber()
  date!: number;
}

class CallbackQueryDto {
  @IsString()
  id!: string;

  @ValidateNested()
  @Type(() => FromDto)
  from!: FromDto;

  @ValidateNested()
  @Type(() => CallbackMessageDto)
  message!: CallbackMessageDto;

  @IsOptional()
  @IsString()
  data?: string;
}

class InlineQueryDto {
  @IsString()
  id!: string;

  @ValidateNested()
  @Type(() => FromDto)
  from!: FromDto;

  @IsOptional()
  @IsString()
  query?: string;
}

export class TelegramUpdateDto {
  @IsNumber()
  update_id!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageDto)
  message?: MessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CallbackQueryDto)
  callback_query?: CallbackQueryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InlineQueryDto)
  inline_query?: InlineQueryDto;
}