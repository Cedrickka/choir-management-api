import { MessagingProviderCode } from '@prisma/client';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessagingTemplateDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(MessagingProviderCode)
  provider?: MessagingProviderCode;

  @IsString()
  providerTemplateName!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsString()
  body!: string;
}

export class SendWhatsappDto {
  @IsString()
  idempotencyKey!: string;

  @IsUUID()
  membershipId!: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string | number | boolean>;
}
