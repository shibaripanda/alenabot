import { Injectable } from '@nestjs/common';
import { UserDocument } from 'src/user/user.schema';
import { AppDocument } from 'src/app/app.schema';
import { BotService } from './bot.service';

@Injectable()
export class BotUserNotificationService {
  constructor(private botService: BotService) {
    console.log('BotUserNotificationService initialized');
  }

  async treeDaysNotification(user: UserDocument, app: AppDocument) {
    const text = `Здравствуйте, ${user.firstName}!

Напоминаем, что срок подписки на канал JUMPING UNIVERSE истекает через 3 дня⏳

Не пропустите эксклюзивный контент, советы и вдохновение для вашего пути в мире Jumping Fitness! Продливайте подписку и продолжайте заряжаться энергией! 🔥

Перейдя по ссылке, можно оплатить продление. Если вы из России, оплата возможна только картой платежной системы «Мир»`;
    await this.botService.listProductsForOldUsers(
      user.telegramId,
      text,
      user,
      app,
    );
  }

  async lastNotification(user: UserDocument, app: AppDocument) {
    const text = `Здравствуйте, ${user.firstName}!

Напоминаем, что ваша подписка на канал JUMPING UNIVERSE истекла, и сегодня ваш аккаунт будет исключен⏳

Не пропустите эксклюзивный контент, советы и вдохновение для вашего пути в мире Jumping Fitness! Продливайте подписку и продолжайте заряжаться энергией! 🔥

Перейдя по ссылке, можно оплатить продление. Если вы из России, оплата возможна только картой платежной системы «Мир»`;
    await this.botService.listProductsForOldUsers(
      user.telegramId,
      text,
      user,
      app,
    );
  }
}
