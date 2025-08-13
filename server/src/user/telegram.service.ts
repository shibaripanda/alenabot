import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserService } from './user.service';
import { BotManagerNotificationService } from 'src/bot/bot.managerNotification';
import { BotService } from 'src/bot/bot.service';

interface User {
  telegramId: number;
  username: string | null;
  firstName: string;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private client: TelegramClient;

  private userService: UserService;
  private botManagerNotificationService: BotManagerNotificationService;
  private botService: BotService;

  private readonly apiId: number;
  private readonly apiHash: string;
  private readonly stringSession: string;
  private readonly channelId: number;

  constructor(private readonly config: ConfigService) {
    this.apiId = Number(this.config.get<number>('API_ID')!);
    this.apiHash = this.config.get<string>('API_HASH')!;
    this.stringSession = this.config.get<string>('TELEGRAM_STRING_SESSION')!;
    this.channelId = Number(this.config.get<number>('ID_CHANNEL')!);

    if (
      !this.apiId ||
      !this.apiHash ||
      !this.stringSession ||
      !this.channelId
    ) {
      throw new Error('Не заданы параметры конфигурации Telegram');
    }
  }

  async onModuleInit() {
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

    this.logger.log('Telegram client инициализирован');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async getUsersTelegramIdsAndControl(): Promise<void> {
    if (!this.client) throw new Error('Telegram client не инициализирован');
    console.log('Cron контроль юзеров');

    const channel = await this.client.getEntity(this.channelId);
    let offset = 0;
    const limit = 100;

    while (true) {
      const participants = await this.client.invoke(
        new Api.channels.GetParticipants({
          channel,
          filter: new Api.ChannelParticipantsRecent(),
          offset,
          limit,
        }),
      );

      if (!('users' in participants) || participants.users.length === 0) break;

      const allMembers: User[] = [];
      for (const user of participants.users) {
        if (user instanceof Api.User) {
          allMembers.push({
            telegramId: Number(user.id),
            username: user.username ?? '',
            firstName: user.firstName ?? '',
          });
        }
      }

      this.logger.log(
        `Обрабатываем ${allMembers.length} пользователей из канала (offset=${offset})`,
      );
      await this.checkChannelUsers(allMembers);

      offset += participants.users.length;
      await new Promise((r) => setTimeout(r, 200));
    }

    this.logger.log('Проверка участников канала завершена');
  }

  private async checkChannelUsers(users: User[]) {
    for (const user of users) {
      try {
        const hasPayment = await this.userService.checkPayment(user.telegramId);
        if (!hasPayment) {
          this.logger.log(
            `Удаляем пользователя ${user.telegramId} (${user.firstName})`,
          );
          await this.botManagerNotificationService.extraSimpleNotification(
            `Удаляю\n${user.firstName} | ${user.telegramId} | ${user.username ? '@' + user.username : ''}`,
          );
          const res = await this.botService.removeAndUnbanUser(user.telegramId); // твоя заглушка для удаления
          if (!res) {
            await this.botManagerNotificationService.extraSimpleNotification(
              `Не смог удалить\n${user.firstName} | ${user.telegramId} | ${user.username ? '@' + user.username : ''}`,
            );
            return;
          }
          await this.botManagerNotificationService.extraSimpleNotification(
            `Удалён\n${user.firstName} | ${user.telegramId} | ${user.username ? '@' + user.username : ''}`,
          );
        }
      } catch (e) {
        this.logger.error(
          `Ошибка при обработке пользователя ${user.telegramId}`,
          e,
        );
      }
    }
  }
}

// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { TelegramClient } from 'telegram';
// import { StringSession } from 'telegram/sessions';
// import { Api } from 'telegram';
// import { Cron, CronExpression } from '@nestjs/schedule';

// interface User {
//   telegramId: number;
//   username: string | null;
//   firstName: string | null;
//   lastName: string | null;
// }

// @Injectable()
// export class TelegramService implements OnModuleInit {
//   private readonly logger = new Logger(TelegramService.name);
//   private client!: TelegramClient;

//   private readonly apiId: number;
//   private readonly apiHash: string;
//   private readonly stringSession: string;
//   private readonly channelId: number; // MTProto ID (без -100)

//   constructor(private readonly config: ConfigService) {
//     this.apiId = Number(this.config.get('API_ID'));
//     this.apiHash = String(this.config.get('API_HASH'));
//     this.stringSession = String(this.config.get('TELEGRAM_STRING_SESSION'));

//     const raw = String(this.config.get('ID_CHANNEL')); // может быть -100..., числом или строкой
//     this.channelId = Number(
//       raw.startsWith('-100') ? raw.slice(4) : raw.replace('-', ''),
//     );

//     if (
//       !this.apiId ||
//       !this.apiHash ||
//       !this.stringSession ||
//       !this.channelId
//     ) {
//       throw new Error(
//         'Отсутствуют обязательные параметры конфигурации Telegram',
//       );
//     }
//   }

//   async onModuleInit() {
//     try {
//       this.client = new TelegramClient(
//         new StringSession(this.stringSession),
//         this.apiId,
//         this.apiHash,
//         { connectionRetries: 5 },
//       );

//       await this.client.start({
//         // eslint-disable-next-line @typescript-eslint/require-await
//         phoneNumber: async () => '',
//         // eslint-disable-next-line @typescript-eslint/require-await
//         phoneCode: async () => '',
//         // eslint-disable-next-line @typescript-eslint/require-await
//         password: async () => '',
//         onError: (err) => this.logger.error('Ошибка авторизации', err),
//       });

//       this.logger.log('Telegram client успешно инициализирован');

//       // Подписываемся на raw-апдейты — БЕЗ event builder'ов,
//       // чтобы не ловить конфликт типов Api.Message vs Api.MessageService
//       // eslint-disable-next-line @typescript-eslint/no-misused-promises
//       this.client.addEventHandler(this.onRawUpdate);
//     } catch (error) {
//       this.logger.error('Ошибка инициализации Telegram client', error);
//       throw error;
//     }
//   }

//   // === Реальное время: ловим вступления через сервисные сообщения ===

//   // Ловим только вступления по ссылке
//   private onRawUpdate = async (update: Api.TypeUpdate) => {
//     try {
//       if (!(update instanceof Api.UpdateNewChannelMessage)) return;

//       const m = update.message;
//       if (!(m instanceof Api.MessageService)) return;

//       if (!(m.peerId instanceof Api.PeerChannel)) return;
//       if (Number(m.peerId.channelId) !== this.channelId) return;

//       const action = m.action;

//       if (action instanceof Api.MessageActionChatAddUser) {
//         // "Сам вошёл" — если fromId совпадает с добавленным пользователем
//         if (m.fromId instanceof Api.PeerUser) {
//           const fromId = Number(m.fromId.userId);
//           for (const uid of action.users) {
//             if (Number(uid) === fromId) {
//               this.logger.log(`JOIN by link detected: userId=${fromId}`);
//               // await this.handleJoin(fromId); // тут твой обработчик
//             }
//           }
//         }
//       }
//     } catch (err) {
//       this.logger.error('Ошибка при обработке update', err);
//     }
//   };

//   // === Подстраховка раз в час: полная сверка списка участников ===
//   @Cron(CronExpression.EVERY_MINUTE)
//   async syncChannelUsers(): Promise<User[]> {
//     if (!this.client) {
//       throw new Error('Telegram client не инициализирован');
//     }

//     // Находим entity канала из диалогов (так гарантированно получим access_hash)
//     const dialogs = await this.client.getDialogs({});
//     const found = dialogs.find(
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//       (d: any) => d.isChannel && Number(d.entity?.id) === this.channelId,
//     );
//     if (!found) {
//       this.logger.warn(
//         `Канал с id=${this.channelId} не найден в ваших диалогах. Откройте канал в клиенте один раз.`,
//       );
//       return [];
//     }

//     const channelEntity = found.entity as unknown as Api.TypeInputChannel;

//     const allMembers: User[] = [];
//     let offset = 0;
//     const limit = 200;

//     for (;;) {
//       const participants = await this.client.invoke(
//         new Api.channels.GetParticipants({
//           channel: channelEntity,
//           // Для «полного» обхода лучше использовать поиск с пустой строкой
//           // чтобы не застревать на «recent»
//           filter: new Api.ChannelParticipantsSearch({ q: '' }),
//           offset,
//           limit,
//         }),
//       );

//       if (!('users' in participants) || participants.users.length === 0) break;

//       for (const u of participants.users) {
//         if (u instanceof Api.User) {
//           allMembers.push({
//             telegramId: Number(u.id),
//             username: u.username ?? null,
//             firstName: u.firstName ?? null,
//             lastName: u.lastName ?? null,
//           });
//         }
//       }

//       offset += participants.users.length;
//     }

//     console.log(allMembers);
//     return allMembers;
//   }
// }

// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { TelegramClient } from 'telegram';
// import { StringSession } from 'telegram/sessions';
// import { Api } from 'telegram';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { NewMessage, NewMessageEvent } from 'telegram/events/NewMessage';

// interface User {
//   telegramId: number;
//   username: string | null;
//   firstName: string | null;
//   lastName: string | null;
// }

// @Injectable()
// export class TelegramService implements OnModuleInit {
//   private readonly logger = new Logger(TelegramService.name);
//   private client: TelegramClient;

//   private readonly apiId: number;
//   private readonly apiHash: string;
//   private readonly stringSession: string;
//   private readonly channelId: number; // без -100
//   private lastKnownUsers: Set<number> = new Set();

//   constructor(private readonly config: ConfigService) {
//     this.apiId = Number(this.config.get<number>('API_ID')!);
//     this.apiHash = this.config.get<string>('API_HASH')!;
//     this.stringSession = this.config.get<string>('TELEGRAM_STRING_SESSION')!;

//     // сохраняем без -100
//     const rawChannel = this.config.get<number>('ID_CHANNEL')!;
//     this.channelId = Math.abs(Number(rawChannel));

//     if (
//       !this.apiId ||
//       !this.apiHash ||
//       !this.stringSession ||
//       !this.channelId
//     ) {
//       throw new Error(
//         'Отсутствуют обязательные параметры конфигурации Telegram',
//       );
//     }
//   }

//   async onModuleInit() {
//     try {
//       this.client = new TelegramClient(
//         new StringSession(this.stringSession),
//         this.apiId,
//         this.apiHash,
//         { connectionRetries: 5 },
//       );

//       await this.client.start({
//         // eslint-disable-next-line @typescript-eslint/require-await
//         phoneNumber: async () => '',
//         // eslint-disable-next-line @typescript-eslint/require-await
//         phoneCode: async () => '',
//         // eslint-disable-next-line @typescript-eslint/require-await
//         password: async () => '',
//         onError: (err) => this.logger.error('Ошибка авторизации', err),
//       });

//       this.logger.log('Telegram client успешно инициализирован');

//       // Слушаем новые сообщения (в том числе сервисные)
//       this.client.addEventHandler((event: NewMessageEvent) => {
//         const msg = event.message;

//         if (!msg.isChannel) return; // только для каналов
//         if (Number(msg.chatId) !== this.channelId) return; // привели к одному типу

//         if (msg instanceof Api.MessageService && msg.action?) {
//           if (msg.action instanceof Api.MessageActionChatAddUser) {
//             // Здесь TS уже знает, что это точно ChatAddUser
//             for (const userId of msg.action.users) {
//               this.logger.log(`Новый участник (добавлен): ${userId}`);
//             }
//           } else if (msg.action instanceof Api.MessageActionChatJoinedByLink) {
//             // Здесь TS уже знает, что это точно JoinedByLink
//             this.logger.log(
//               `Новый участник (по ссылке): inviterId=${msg.action.inviterId}`,
//             );
//           }
//         }
//       }, new NewMessage({}));

//       this.logger.log('Подписка на события о новых участниках активна');
//     } catch (error) {
//       this.logger.error('Ошибка инициализации Telegram client', error);
//       throw error;
//     }
//   }

//   @Cron(CronExpression.EVERY_HOUR)
//   async syncChannelUsers(): Promise<User[]> {
//     if (!this.client) {
//       throw new Error('Telegram client не инициализирован');
//     }

//     const channelEntity = await this.client.getEntity(this.channelId);
//     const allMembers: User[] = [];
//     let offset = 0;
//     const limit = 100;

//     while (true) {
//       const participants = await this.client.invoke(
//         new Api.channels.GetParticipants({
//           channel: channelEntity,
//           filter: new Api.ChannelParticipantsRecent(),
//           offset,
//           limit,
//         }),
//       );

//       if (!('users' in participants) || participants.users.length === 0) break;

//       for (const user of participants.users) {
//         if (user instanceof Api.User) {
//           allMembers.push({
//             telegramId: Number(user.id),
//             username: user.username ?? null,
//             firstName: user.firstName ?? null,
//             lastName: user.lastName ?? null,
//           });
//         }
//       }

//       offset += participants.users.length;
//     }

//     // Сохраняем список, чтобы сравнивать в будущем
//     const currentIds = new Set(allMembers.map((u) => u.telegramId));
//     const newUsers = [...currentIds].filter(
//       (id) => !this.lastKnownUsers.has(id),
//     );
//     if (newUsers.length > 0) {
//       this.logger.log(
//         `Найдено новых участников при синхронизации: ${newUsers.join(', ')}`,
//       );
//     }
//     this.lastKnownUsers = currentIds;

//     return allMembers;
//   }
// }

// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { TelegramClient } from 'telegram';
// import { StringSession } from 'telegram/sessions';
// import { Api } from 'telegram';
// import { Cron, CronExpression } from '@nestjs/schedule';

// interface User {
//   telegramId: number;
//   username: string | null;
//   firstName: string | null;
//   lastName: string | null;
// }

// @Injectable()
// export class TelegramService implements OnModuleInit {
//   private readonly logger = new Logger(TelegramService.name);
//   private client: TelegramClient;

//   private readonly apiId: number;
//   private readonly apiHash: string;
//   private readonly stringSession: string;
//   private readonly channel: number | string;

//   constructor(private readonly config: ConfigService) {
//     this.apiId = Number(this.config.get<number>('API_ID')!);
//     this.apiHash = this.config.get<string>('API_HASH')!;
//     this.stringSession = this.config.get<string>('TELEGRAM_STRING_SESSION')!;
//     this.channel = this.config.get<number | string>('ID_CHANNEL')!;

//     if (!this.apiId || !this.apiHash || !this.stringSession || !this.channel) {
//       throw new Error(
//         'Отсутствуют обязательные параметры конфигурации Telegram',
//       );
//     }
//   }

//   async onModuleInit() {
//     try {
//       this.client = new TelegramClient(
//         new StringSession(this.stringSession),
//         this.apiId,
//         this.apiHash,
//         { connectionRetries: 5 },
//       );

//       await this.client.start({
//         // eslint-disable-next-line @typescript-eslint/require-await
//         phoneNumber: async () => '',
//         // eslint-disable-next-line @typescript-eslint/require-await
//         phoneCode: async () => '',
//         // eslint-disable-next-line @typescript-eslint/require-await
//         password: async () => '',
//         onError: (err) => this.logger.error('Ошибка авторизации', err),
//       });

//       this.logger.log('Telegram client успешно инициализирован');
//     } catch (error) {
//       this.logger.error('Ошибка инициализации Telegram client', error);
//       throw error;
//     }
//   }

//   @Cron(CronExpression.EVERY_5_MINUTES)
//   async getChannelUsers(): Promise<User[]> {
//     if (!this.client) {
//       throw new Error('Telegram client не инициализирован');
//     }

//     const channelEntity = await this.client.getEntity(this.channel);
//     const allMembers: User[] = [];
//     let offset = 0;
//     const limit = 100;

//     while (true) {
//       const participants = await this.client.invoke(
//         new Api.channels.GetParticipants({
//           channel: channelEntity,
//           filter: new Api.ChannelParticipantsRecent(),
//           offset,
//           limit,
//         }),
//       );

//       if (!('users' in participants) || participants.users.length === 0) {
//         break;
//       }

//       for (const user of participants.users) {
//         if (user instanceof Api.User) {
//           allMembers.push({
//             telegramId: Number(user.id),
//             username: user.username ?? null,
//             firstName: user.firstName ?? null,
//             lastName: user.lastName ?? null,
//           });
//         }
//       }

//       offset += participants.users.length;
//     }
//     console.log(allMembers);

//     return allMembers;
//   }
// }
