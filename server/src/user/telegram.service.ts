import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';
// import { User } from './user.schema';
// import { User } from 'telegraf/typings/core/types/typegram';

interface User {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private client: TelegramClient;

  private readonly apiId: number;
  private readonly apiHash: string;
  private readonly stringSession: string;
  private readonly channel: number | string;

  constructor(private readonly config: ConfigService) {
    this.apiId = Number(this.config.get<number>('API_ID')!);
    this.apiHash = this.config.get<string>('API_HASH')!;
    this.stringSession = this.config.get<string>('TELEGRAM_STRING_SESSION')!;
    this.channel = this.config.get<number | string>('ID_CHANNEL')!;

    if (!this.apiId || !this.apiHash || !this.stringSession || !this.channel) {
      throw new Error(
        'Отсутствуют обязательные параметры конфигурации Telegram',
      );
    }
  }

  async onModuleInit() {
    try {
      this.client = new TelegramClient(
        new StringSession(this.stringSession),
        this.apiId,
        this.apiHash,
        { connectionRetries: 5 },
      );

      await this.client.start({
        // eslint-disable-next-line @typescript-eslint/require-await
        phoneNumber: async () => '',
        // eslint-disable-next-line @typescript-eslint/require-await
        phoneCode: async () => '',
        // eslint-disable-next-line @typescript-eslint/require-await
        password: async () => '',
        onError: (err) => this.logger.error('Ошибка авторизации', err),
      });

      this.logger.log('Telegram client успешно инициализирован');
    } catch (error) {
      this.logger.error('Ошибка инициализации Telegram client', error);
      throw error;
    }
  }

  async getChannelUsers(): Promise<User[]> {
    if (!this.client) {
      throw new Error('Telegram client не инициализирован');
    }

    const channelEntity = await this.client.getEntity(this.channel);
    const allMembers: User[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const participants = await this.client.invoke(
        new Api.channels.GetParticipants({
          channel: channelEntity,
          filter: new Api.ChannelParticipantsRecent(),
          offset,
          limit,
        }),
      );

      if (!('users' in participants) || participants.users.length === 0) {
        break;
      }

      for (const user of participants.users) {
        if (user instanceof Api.User) {
          allMembers.push({
            telegramId: Number(user.id),
            username: user.username ?? null,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
          });
        }
      }

      offset += participants.users.length;
    }

    return allMembers;
  }
}
