import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Payment } from 'src/user/payment.schema';
import { UserDocument } from 'src/user/user.schema';
import { Telegraf } from 'telegraf';

interface Money {
  period: number;
  moneyTotal: number;
  countPayments: number;
  newPaymentUsers: number;
  exitUsers: number;
  newUsersInBot: number;
  time: number;
}

@Injectable()
export class BotManagerNotificationService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
  ) {
    console.log('BotManagerNotificationService initialized');
  }

  async moneyNotification(data: Money) {
    console.log(data);
    const textData = `💰 Сумма платежей: ${data.moneyTotal / 100}\n🗓 Количество платежей: ${data.countPayments}\n✴️ Новички в боте: ${data.newUsersInBot}\n💵 Первый платеж: ${data.newPaymentUsers}\n🚪 Ушедшие: ${data.exitUsers}\n\n${data.time} сек.`;
    const text = `💵 <b>Отчет за ${data.period} дней</b>\n\n${textData}`;
    await this.sendNot(text);
  }

  async sendNot(text: string) {
    const admin = this.config.get<number>('MANAGER_GROUP')!;
    await this.bot.telegram
      .sendMessage(admin, text, { parse_mode: 'HTML' })
      .catch((e) => {
        console.log(e);
      });
  }

  escapeHtml(str: string) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  listUserData(user: UserDocument) {
    const username = user.username
      ? '@' + this.escapeHtml(user.username)
      : 'нет юзернейма';
    const name = user.firstName
      ? this.escapeHtml(user.firstName)
      : '' + user.lastName
        ? this.escapeHtml(user.lastName)
        : '';
    return name + ' (' + username + ')';
  }

  listTotalForDelete(user: UserDocument) {
    const sumUserPayments =
      user.payments.reduce((acc, p) => acc + p.total_amount, 0) / 100;
    const totalPayments = `Сумма по клиенту: ${sumUserPayments}`;
    const countPayment = `<b>Всего платежей: ${user.payments.length}</b>`;

    return totalPayments + '\n' + countPayment;
  }

  listLastPaymentAndTotal(user: UserDocument) {
    const payment: Payment = user.payments[user.payments.length - 1];
    const sumUserPayments =
      user.payments.reduce((acc, p) => acc + p.total_amount, 0) / 100;
    const totalPayments = `Сумма по клиенту: ${sumUserPayments}`;
    const lastPayment = `<b>Оплата: ${payment.total_amount / 100}</b>`;
    const countPayment = `<b>Всего платежей: ${user.payments.length}</b>`;

    return (
      lastPayment +
      '\n\n' +
      this.escapeHtml(payment.service) +
      '\n' +
      this.escapeHtml(payment.email) +
      '\n<code>' +
      this.escapeHtml(payment.provider_payment_charge_id) +
      '</code>\n<code>' +
      this.escapeHtml(payment.telegram_payment_charge_id) +
      '</code>\n\n' +
      totalPayments +
      '\n' +
      countPayment
    );
  }

  async newUserNotification(user: UserDocument) {
    const text = `✴️ <b>Новый пользователь в боте</b>\n\n${this.listUserData(user)}`;
    await this.sendNot(text);
  }

  async extraSimpleNotification(textStatus: string) {
    const text = `ℹ️ <b>Уведомление</b>\n\n${textStatus}`;
    await this.sendNot(text);
  }

  async simpleNotification(user: UserDocument, textStatus: string) {
    const text = `ℹ️ <b>Уведомление</b>\n\n${this.listUserData(user)}\n${textStatus}`;
    await this.sendNot(text);
  }

  async newPaymentNotification(user: UserDocument) {
    const text = `💰 <b>Получен платеж за вход</b>\n\n${this.listUserData(user)}\n\n${this.listLastPaymentAndTotal(user)}\n\n🤑🤑🤑🤑🤑🤑🤑🤑🤑`;
    await this.sendNot('💰');
    await this.sendNot(text);
  }

  async treeDaysNotification(user: UserDocument, textStatus: string) {
    const text = `3️⃣ ${textStatus}\n\n${this.listUserData(user)}`;
    await this.sendNot(text);
  }

  async newLongPaymentNotification(user: UserDocument) {
    const text = `💰 <b>Получен платеж за продление</b>\n\n${this.listUserData(user)}\n\n${this.listLastPaymentAndTotal(user)}\n\n🤑🤑🤑🤑🤑🤑🤑🤑🤑`;
    await this.sendNot('💰');
    await this.sendNot(text);
  }

  async lastNotification(user: UserDocument, textStatus: string) {
    const text = `1️⃣ ${textStatus}\n\n${this.listUserData(user)}`;
    await this.sendNot(text);
  }

  async deleteUserNotification(user: UserDocument, textStatus: string) {
    const text = `🚪 <b>Пользователь удален с канала</b>\n\n${textStatus}\n\n${this.listUserData(user)}\n\n${this.listTotalForDelete(user)}`;
    await this.sendNot('🚪');
    await this.sendNot(text);
  }
}
