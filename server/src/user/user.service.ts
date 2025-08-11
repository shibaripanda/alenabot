import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { User as TelegramUser } from 'telegraf/typings/core/types/typegram';
import { BotService } from 'src/bot/bot.service';
import { BotUserNotificationService } from 'src/bot/bot.userNotification copy';
import { AppDocument } from 'src/app/app.schema';
import { BotManagerNotificationService } from 'src/bot/bot.managerNotification';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private botService: BotService,
    private botUserNotificationService: BotUserNotificationService,
    private botManagerNotificationService: BotManagerNotificationService,
  ) {
    console.log('UserService initialized');
  }

  async controlTreeDaysUserNotification(user: UserDocument, app: AppDocument) {
    if (user.subscriptionExpiresAt) {
      let text: string;
      const statusUser = await this.botService.isUserActive(user.telegramId);
      if (statusUser) {
        await this.botUserNotificationService.treeDaysNotification(user, app);
        text = 'Напоминанение "3 дня" доставлено';
      } else {
        text =
          'Напоминанение "3 дня" не доставлено, бот отключен пользователем';
      }
      await this.botManagerNotificationService.treeDaysNotification(user, text);
    }
  }

  async controlLastUserNotification(user: UserDocument, app: AppDocument) {
    if (user.subscriptionExpiresAt) {
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
  }

  async controlUserForDelete(user: UserDocument) {
    if (user.subscriptionExpiresAt) {
      const res = await this.botService.removeAndUnbanUser(user.telegramId);
      if (!res) {
        console.log('Ошибка удаления');
        return;
      }
      user.isSubscribed = false;
      await user.save();
      let text: string;
      const statusUser = await this.botService.isUserActive(user.telegramId);
      if (statusUser) {
        text = 'Бот активен';
      } else {
        text = 'Бот отключен пользователем';
      }
      await this.botManagerNotificationService.deleteUserNotification(
        user,
        text,
      );
    }
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
    });

    return created.save();
  }
}
