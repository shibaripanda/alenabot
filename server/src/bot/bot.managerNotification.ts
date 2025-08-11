import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { UserDocument } from 'src/user/user.schema';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotManagerNotificationService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
  ) {
    console.log('BotManagerNotificationService initialized');
  }

  async newUserNotification(user: UserDocument) {
    const admin = this.config.get<number>('MANAGER_GROUP')!;
    const text = `Новый пользователь в боте\n@${user.username}\n${user.firstName}\n${user.lastName}`;
    await this.bot.telegram.sendMessage(admin, text).catch((e) => {
      console.log(e);
    });
  }

  async simpleNotification(user: UserDocument, textStatus: string) {
    const admin = this.config.get<number>('MANAGER_GROUP')!;
    const text = `Уведомление\n@${user.username} | ${user.firstName} | ${user.lastName}\n==================\n${textStatus}`;
    await this.bot.telegram.sendMessage(admin, text).catch((e) => {
      console.log(e);
    });
  }

  async newPaymentNotification(user: UserDocument) {
    const admin = this.config.get<number>('MANAGER_GROUP')!;
    const text = `💰💰💰💰💰💰💰💰💰\n@${user.username}\n${user.firstName}\n${user.lastName}\n🤑🤑🤑🤑🤑🤑🤑🤑🤑`;
    await this.bot.telegram.sendMessage(admin, text).catch((e) => {
      console.log(e);
    });
  }

  async treeDaysNotification(user: UserDocument, textStatus: string) {
    const admin = this.config.get<number>('MANAGER_GROUP')!;
    const text = `${textStatus}\n----\n${user.lastName}`;
    await this.bot.telegram.sendMessage(admin, text).catch((e) => {
      console.log(e);
    });
  }

  async newLongPaymentNotification(user: UserDocument) {
    const admin = this.config.get<number>('MANAGER_GROUP')!;
    const text = `Новый пользователь в боте\n@${user.username}\n${user.firstName}\n${user.lastName}`;
    await this.bot.telegram.sendMessage(admin, text).catch((e) => {
      console.log(e);
    });
  }

  async lastNotification(user: UserDocument, textStatus: string) {
    const admin = this.config.get<number>('MANAGER_GROUP')!;
    const text = `${textStatus}\n----\n${user.lastName}`;
    await this.bot.telegram.sendMessage(admin, text).catch((e) => {
      console.log(e);
    });
  }

  async deleteUserNotification(user: UserDocument, textStatus: string) {
    const admin = this.config.get<number>('MANAGER_GROUP')!;
    const text = `Пользователь удален с канала\n${textStatus}\n@${user.username}\n${user.firstName}\n${user.lastName}`;
    await this.bot.telegram.sendMessage(admin, text).catch((e) => {
      console.log(e);
    });
  }
}
