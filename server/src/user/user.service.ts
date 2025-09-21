import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { User as TelegramUser } from 'telegraf/typings/core/types/typegram';
import { BotService } from 'src/bot/bot.service';
import { BotUserNotificationService } from 'src/bot/bot.userNotification';
import { AppDocument } from 'src/app/app.schema';
import { BotManagerNotificationService } from 'src/bot/bot.managerNotification';
// import { TelegramService } from './telegram.service';
import { ConfigService } from '@nestjs/config';

// function addMonths(date: Date, months: number): Date {
//   const result = new Date(date);
//   result.setMonth(result.getMonth() + months);

//   // Если при добавлении месяцев день "перепрыгнул" в следующий месяц (например, 31 марта + 1 месяц = 31 апреля → 1 мая),
//   // то подкорректируем, чтобы вернуть последний день нужного месяца:
//   if (result.getDate() !== date.getDate()) {
//     result.setDate(0); // 0-й день месяца = последний день предыдущего месяца
//   }

//   // return result;
//   return new Date(Date.now() + 5 * 60 * 1000);
// }

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);

  // Если день "перепрыгнул" в следующий месяц (например, 31 марта + 1 месяц = 31 апреля → 1 мая)
  if (result.getDate() !== date.getDate()) {
    result.setDate(0); // 0-й день месяца = последний день предыдущего месяца
  }

  // return result;
  return new Date(Date.now() + 5 * 60 * 1000);
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private botService: BotService,
    private botUserNotificationService: BotUserNotificationService,
    private botManagerNotificationService: BotManagerNotificationService,
    // private telegramService: TelegramService,
    private readonly config: ConfigService,
  ) {
    console.log('UserService initialized');
  }

  async onModuleInit() {
    // const money = await this.getMoneyBook(1);
    // console.log(money);
  }

  async moneyBook(days: number) {
    const money = await this.getMoneyBook(days);
    await this.botManagerNotificationService.moneyNotification(money);
  }

  async getMoneyBook(days: number) {
    const now = Date.now();
    const paymentsResult = await this.getPaymentsStats(days);
    const newPaymentUsers = await this.countNewUsersWithRecentPayments(days);
    const exitUsers = await this.countExpiredSubscriptionsWithin(days);
    const newUsersInBot = await this.countNewUsers(days);
    const time = (Date.now() - now) / 1000;
    return {
      period: days,
      moneyTotal: paymentsResult.totalAmount,
      countPayments: paymentsResult.count,
      newPaymentUsers,
      exitUsers,
      newUsersInBot,
      time,
    };
  }

  async countExpiredSubscriptionsWithin(days: number): Promise<number> {
    const now = new Date();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return this.userModel.countDocuments({
      subscriptionExpiresAt: {
        $gte: cutoff,
        $lt: now,
      },
      status: { $ne: 'free' }, // исключаем free
    });
  }

  async countNewUsersWithRecentPayments(days: number): Promise<number> {
    const cutoffUser = new Date();
    cutoffUser.setDate(cutoffUser.getDate() - days);

    const cutoffPayment = new Date();
    cutoffPayment.setDate(cutoffPayment.getDate() - 30);

    const cutoffSinglePayment = new Date();
    cutoffSinglePayment.setDate(cutoffSinglePayment.getDate() - days);

    const result: { count: number }[] = await this.userModel.aggregate([
      // 1. Новые пользователи
      { $match: { createdAt: { $gte: cutoffUser } } },

      // 2. Есть хотя бы один платеж
      { $match: { 'payments.0': { $exists: true } } },

      // 3. Исключаем "free" с одним платежом в пределах N дней
      {
        $match: {
          $nor: [
            {
              status: 'free',
              $expr: {
                $and: [
                  { $eq: [{ $size: '$payments' }, 1] },
                  {
                    $gte: [
                      { $arrayElemAt: ['$payments.createdAt', 0] },
                      cutoffSinglePayment,
                    ],
                  },
                ],
              },
            },
          ],
        },
      },

      // 4. Разворачиваем платежи
      { $unwind: '$payments' },

      // 5. Только платежи за последние 30 дней
      { $match: { 'payments.createdAt': { $gte: cutoffPayment } } },

      // 6. Группируем по пользователю
      { $group: { _id: '$_id' } },

      // 7. Считаем количество
      { $count: 'count' },
    ]);

    return result[0]?.count ?? 0;
  }

  async getPaymentsStats(
    days: number,
  ): Promise<{ totalAmount: number; count: number }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result: { _id: null; totalAmount: number; count: number }[] =
      await this.userModel.aggregate([
        // 1. Только те, у кого есть платежи
        { $match: { 'payments.0': { $exists: true } } },

        // 2. Разворачиваем массив payments
        { $unwind: '$payments' },

        // 3. Фильтр по дате
        { $match: { 'payments.createdAt': { $gte: cutoff } } },

        // 4. Группируем всё в один документ
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$payments.total_amount' },
            count: { $sum: 1 },
          },
        },
      ]);

    return {
      totalAmount: result[0]?.totalAmount ?? 0,
      count: result[0]?.count ?? 0,
    };
  }

  async countNewUsers(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return this.userModel.countDocuments({
      createdAt: { $gte: cutoff },
    });
  }

  async checkPayment(telegramId: number): Promise<boolean> {
    const excludedIds = [
      this.config.get<string>('BOT_ID'),
      this.config.get<string>('SUPERADMIN'),
      this.config.get<string>('ADMIN_USER_API'),
    ]
      .filter(Boolean) // убираем undefined
      .map(Number); // приводим к числу

    if (excludedIds.includes(telegramId)) {
      return true;
    }
    // const user = await this.userModel.findOne({ telegramId }).exec();
    const user = await this.userModel
      .findOneAndUpdate({ telegramId }, { isSubscribed: true })
      .exec();
    if (!user) {
      return false;
    }
    if (user.status === 'free') {
      return true;
    }
    if (!user.subscriptionExpiresAt) {
      return false;
    }
    const now = new Date();
    const isValid = user.subscriptionExpiresAt > now;
    return isValid;
  }

  async successfulPayment(
    telegramId: number,
    total_amount: number,
    service: string,
    long: number,
    provider_payment_charge_id: string,
    telegram_payment_charge_id: string,
    email: string,
  ) {
    const user = await this.getUserByTelegramId(telegramId);
    if (!user) return false;
    const newOrder = {
      total_amount,
      service,
      provider_payment_charge_id,
      telegram_payment_charge_id,
      email,
    };
    const now = new Date();
    const exTime = addMonths(now, long);
    user.payments.push(newOrder);
    // user.subscriptionExpiresAt = exTime;
    user.notified24h = false;
    user.notified72h = false;
    user.status = 'old';
    if (
      !user.subscriptionExpiresAt ||
      user.subscriptionExpiresAt <= now ||
      !user.isSubscribed
    ) {
      user.subscriptionExpiresAt = exTime;
      await user.save();
      await this.botManagerNotificationService.newPaymentNotification(user);
      await this.botService.sendOneTimeInvite(user);
    } else {
      user.subscriptionExpiresAt = addMonths(user.subscriptionExpiresAt, long);
      await user.save();
      await this.botManagerNotificationService.newLongPaymentNotification(user);
      await this.botService.sendLongUp(user);
    }
    console.log('payment');
  }

  async getUsersControl(): Promise<UserDocument[]> {
    const excludedIds = [
      this.config.get<string>('BOT_ID'),
      this.config.get<string>('SUPERADMIN'),
      this.config.get<string>('ADMIN_USER_API'),
    ]
      .filter(Boolean) // убираем undefined
      .map(Number); // приводим к числу
    console.log(excludedIds);
    const now = new Date();
    return await this.userModel.find({
      subscriptionExpiresAt: {
        $gte: new Date(
          now.getTime() -
            this.config.get<number>('TIME_3DAYS_CONTROL')! * 60 * 60 * 1000,
        ),
      },
      status: { $nin: ['free', 'new'] },
      telegramId: {
        $nin: excludedIds,
      },
    });
  }

  async getUsers(): Promise<UserDocument[]> {
    return await this.userModel.find();
  }

  async getUserByTelegramId(telegramId: number): Promise<UserDocument | null> {
    return await this.userModel.findOne({ telegramId: telegramId });
  }

  async controlTreeDaysUserNotification(user: UserDocument, app: AppDocument) {
    let text: string;
    const statusUser = await this.botService.isUserActive(user.telegramId);
    if (statusUser) {
      await this.botUserNotificationService.treeDaysNotification(user, app);
      text = 'Напоминанение "3 дня" доставлено';
    } else {
      text = 'Напоминанение "3 дня" не доставлено, бот отключен пользователем';
    }
    await this.botManagerNotificationService.treeDaysNotification(user, text);
  }

  async controlLastUserNotification(user: UserDocument, app: AppDocument) {
    let text: string;
    const statusUser = await this.botService.isUserActive(user.telegramId);
    if (statusUser) {
      await this.botUserNotificationService.lastNotification(user, app);
      text = 'Напоминанение "Последнее" доставлено';
    } else {
      text =
        'Напоминанение "Последнее" не доставлено, бот отключен пользователем';
    }
    await this.botManagerNotificationService.lastNotification(user, text);
  }

  async controlUserForDelete(user: UserDocument) {
    const res = await this.botService.removeAndUnbanUser(user.telegramId);
    let text: string = 'Пользователь удален';
    if (!res) {
      user.isSubscribed = true;
      text = 'Пользователь не удален из канала, по ошибке\n';
    }
    if (res) {
      user.isSubscribed = false;
    }
    const statusUser = await this.botService.isUserActive(user.telegramId);
    if (!statusUser) {
      text = text + 'Бот отключен пользователем';
    }
    await this.botManagerNotificationService.deleteUserNotification(user, text);
    return res;
  }

  async createOrUpdateUser(user: TelegramUser): Promise<UserDocument | null> {
    if (!user) return null;

    const ex = await this.userModel.findOne({ telegramId: user.id });
    if (ex) {
      ex.username = user.username ?? '';
      ex.firstName = user.first_name;
      ex.lastName = user.last_name ?? '';
      await ex.save();
      return ex;
    }

    const created = new this.userModel({
      telegramId: user.id,
      username: user.username ?? '',
      firstName: user.first_name,
      lastName: user.last_name ?? '',
      status: 'new',
    });
    await this.botManagerNotificationService.newUserNotification(created);
    return created.save();
  }
}
