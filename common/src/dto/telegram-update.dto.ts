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

export class TelegramUpdateDto {
  @IsNumber()
  update_id!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageDto)
  message?: MessageDto;
}