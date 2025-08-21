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

  async sendNot(text: string) {
    const admin = this.config.get<number>('MANAGER_GROUP')!;
    await this.bot.telegram
      .sendMessage(admin, text, { parse_mode: 'HTML' })
      .catch((e) => {
        console.log(e);
      });
  }

  async newUserNotification(user: UserDocument) {
    const text = `✴️ <b>Новый пользователь в боте</b>\n==================\n@${user.username}\n${user.firstName}\n${user.lastName}`;
    await this.sendNot(text);
  }

  async extraSimpleNotification(textStatus: string) {
    const text = `ℹ️ <b>Уведомление</b>\n==================\n${textStatus}`;
    await this.sendNot(text);
  }

  async simpleNotification(user: UserDocument, textStatus: string) {
    const text = `ℹ️ <b>Уведомление</b>\n==================\n@${user.username} | ${user.firstName} | ${user.lastName}\n${textStatus}`;
    await this.sendNot(text);
  }

  async newPaymentNotification(user: UserDocument) {
    const payment = user.payments[user.payments.length - 1];
    const sumUserPayments =
      user.payments.reduce((acc, p) => acc + p.total_amount, 0) / 100;
    const text = `💰 <b>Получен платеж за вход</b>\n==================\n@${user.username} | ${user.firstName} | ${user.lastName}\n${payment.service}\n<b>Оплата: ${payment.total_amount / 100}</b>\nСумма по клиенту: ${sumUserPayments}\n🤑🤑🤑🤑🤑🤑🤑🤑🤑`;
    await this.sendNot('💰');
    await this.sendNot(text);
  }

  async treeDaysNotification(user: UserDocument, textStatus: string) {
    const text = `3️⃣ ${textStatus}\n----\n${user.firstName} @${user.username}`;
    await this.sendNot(text);
  }

  async newLongPaymentNotification(user: UserDocument) {
    const payment = user.payments[user.payments.length - 1];
    const sumUserPayments =
      user.payments.reduce((acc, p) => acc + p.total_amount, 0) / 100;
    const text = `💰 <b>Получен платеж за продление</b>\n==================\n@${user.username} | ${user.firstName} | ${user.lastName}\n${payment.service}\n<b>Оплата: ${payment.total_amount / 100}</b>\nСумма по клиенту: ${sumUserPayments}\n🤑🤑🤑🤑🤑🤑🤑🤑🤑`;
    await this.sendNot('💰');
    await this.sendNot(text);
  }

  async lastNotification(user: UserDocument, textStatus: string) {
    const text = `1️⃣ ${textStatus}\n----\n${user.firstName} @${user.username}`;
    await this.sendNot(text);
  }

  async deleteUserNotification(user: UserDocument, textStatus: string) {
    const sumUserPayments =
      user.payments.reduce((acc, p) => acc + p.total_amount, 0) / 100;
    const text = `🚪 <b>Пользователь удален с канала</b>\n==================\n${textStatus}\n@${user.username}\n${user.firstName}\n${user.lastName}\nСумма по клиенту: ${sumUserPayments}`;
    await this.sendNot(text);
  }
}
